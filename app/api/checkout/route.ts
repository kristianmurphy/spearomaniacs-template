import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { CartItem } from "@/app/_components/cart-provider";
import { ACCOUNT_SESSION_COOKIE, readSessionCookieValue } from "@/lib/account-auth";
import { getUserByEmail } from "@/lib/account.data";
import { cartItemsToCheckoutLineItems } from "@/lib/checkout";
import { fetchPrintfulSyncVariant } from "@/lib/printful";
import { isAvailabilityPurchasable } from "@/lib/product-variants";
import {
  calculateMaxRedeemablePoints,
  calculateRewardDiscountAmount,
} from "@/lib/rewards";
import { getSiteData } from "@/lib/sanity.page";
import { createRewardsCoupon, createOrUpdateStripeCustomer } from "@/lib/stripe-customers";

function getAllowedShippingCountries() {
  const raw = process.env.SHOP_ALLOWED_COUNTRIES || "AU,NZ,US,CA,GB";
  return raw
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => /^[A-Z]{2}$/.test(value));
}

function getBaseUrl(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    return origin;
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const site = await getSiteData();

  if (site.shopLocked) {
    return NextResponse.json({ error: "Ordering is currently unavailable." }, { status: 403 });
  }

  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const accountSession = readSessionCookieValue(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value);
  const signedInUser = accountSession ? await getUserByEmail(accountSession.email) : null;

  let payload: { items?: CartItem[]; useRewards?: boolean } = {};

  try {
    payload = (await request.json()) as { items?: CartItem[] };
  } catch {
    return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const lineItems = cartItemsToCheckoutLineItems(items);
  const orderAmount = lineItems.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0);

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid cart items available for checkout." }, { status: 400 });
  }

  try {
    await Promise.all(
      lineItems.map(async (item) => {
        if (!item.syncVariantId) {
          return;
        }

        const variant = await fetchPrintfulSyncVariant(Number(item.syncVariantId));

        if (!isAvailabilityPurchasable(variant.availabilityStatus)) {
          throw new Error(
            `${item.title}${variant.size ? ` (${variant.size}` : ""}${variant.color ? `${variant.size ? " / " : " ("}${variant.color}` : ""}${variant.size || variant.color ? ")" : ""} is no longer available.`
          );
        }
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "A cart item is no longer available.";

    return NextResponse.json({ error: message }, { status: 409 });
  }

  const baseUrl = getBaseUrl(request);
  const form = new URLSearchParams();

  form.set("mode", "payment");
  form.set("success_url", `${baseUrl}/checkout/success`);
  form.set("cancel_url", `${baseUrl}/shop?cart=open`);
  form.set("billing_address_collection", "auto");
  form.set("phone_number_collection[enabled]", "true");

  let rewardsPointsRedeemed = 0;
  let rewardsDiscountAmount = 0;

  if (signedInUser && payload.useRewards) {
    rewardsPointsRedeemed = calculateMaxRedeemablePoints(
      Math.floor(signedInUser.rewardsPoints || 0),
      orderAmount
    );
    rewardsDiscountAmount = calculateRewardDiscountAmount(rewardsPointsRedeemed);
  }

  if (signedInUser) {
    const stripeCustomerId = await createOrUpdateStripeCustomer({
      stripeCustomerId: signedInUser.stripeCustomerId || undefined,
      email: signedInUser.email,
      name: signedInUser.name,
      shippingAddress: signedInUser.defaultShippingAddress,
    });

    form.set("customer", stripeCustomerId);
    form.set("customer_update[name]", "auto");
    form.set("customer_update[shipping]", "auto");
    form.set("metadata[account_email]", signedInUser.email);
  } else if (accountSession) {
    form.set("customer_email", accountSession.email);
  }

  form.set("metadata[rewards_points_redeemed]", String(rewardsPointsRedeemed));
  form.set("metadata[rewards_discount_amount]", String(rewardsDiscountAmount));

  const allowedShippingCountries = getAllowedShippingCountries();

  allowedShippingCountries.forEach((country, index) => {
    form.set(`shipping_address_collection[allowed_countries][${index}]`, country);
  });

  lineItems.forEach((item, index) => {
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
    form.set(`line_items[${index}][price_data][currency]`, item.currency);
    form.set(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
    form.set(`line_items[${index}][price_data][product_data][name]`, item.title);
    form.set(`line_items[${index}][price_data][product_data][metadata][cart_item_id]`, item.id);
    form.set(`line_items[${index}][price_data][product_data][metadata][slug]`, item.slug);
    if (item.syncVariantId) {
      form.set(`line_items[${index}][price_data][product_data][metadata][printful_sync_variant_id]`, item.syncVariantId);
    }

    if (item.description) {
      form.set(`line_items[${index}][price_data][product_data][description]`, item.description);
    }

    if (item.size) {
      form.set(`line_items[${index}][price_data][product_data][metadata][size]`, item.size);
    }

    if (item.color) {
      form.set(`line_items[${index}][price_data][product_data][metadata][color]`, item.color);
    }

    if (item.imageUrl) {
      form.set(`line_items[${index}][price_data][product_data][images][0]`, item.imageUrl);
    }
  });

  if (rewardsDiscountAmount > 0 && rewardsPointsRedeemed > 0) {
    const couponId = await createRewardsCoupon({
      amountOff: rewardsDiscountAmount,
      currency: lineItems[0]?.currency || "aud",
      pointsRedeemed: rewardsPointsRedeemed,
    });

    form.set("discounts[0][coupon]", couponId);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: `Stripe checkout failed: ${errorText}` }, { status: 502 });
  }

  const session = (await response.json()) as { url?: string };

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
