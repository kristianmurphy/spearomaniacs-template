import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/account-auth";
import { applyOrderRewards } from "@/lib/account.data";
import { buildPrintfulOrderExternalId, buildPrintfulOrderItemExternalId } from "@/lib/order-identifiers";
import { submitPrintfulOrder } from "@/lib/printful";
import { calculateRewardPointsEarned } from "@/lib/rewards";
import { sanityWriteClient } from "@/lib/sanity.write.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type StripeProduct = {
  name?: string | null;
  metadata?: Record<string, string>;
  images?: string[];
};

type StripeLineItem = {
  description?: string | null;
  quantity?: number | null;
  amount_total?: number | null;
  amount_subtotal?: number | null;
  currency?: string | null;
  price?: {
    unit_amount?: number | null;
    product?: StripeProduct | string | null;
  } | null;
};

type StripeSession = {
  id: string;
  object: "checkout.session";
  customer?: string | null;
  payment_status?: string | null;
  payment_intent?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  created?: number | null;
  metadata?: Record<string, string> | null;
  customer_details?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: StripeAddress | null;
  } | null;
  shipping_details?: {
    name?: string | null;
    phone?: string | null;
    address?: StripeAddress | null;
  } | null;
  collected_information?: {
    shipping_details?: {
      name?: string | null;
      phone?: string | null;
      address?: StripeAddress | null;
    } | null;
  } | null;
};

type StripePaymentIntent = {
  id?: string | null;
  latest_charge?: {
    payment_method_details?: {
      card?: {
        brand?: string | null;
        last4?: string | null;
      } | null;
    } | null;
  } | null;
};

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: StripeSession;
  };
};

function isPrintfulAutoSubmitEnabled() {
  return process.env.PRINTFUL_AUTO_SUBMIT_ORDERS !== "false";
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));

  if (!Number.isFinite(age) || age > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => {
    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });
}

async function fetchStripeLineItems(sessionId: string, secretKey: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=100&expand[]=data.price.product`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Stripe line item fetch failed: ${await response.text()}`);
  }

  const payload = (await response.json()) as { data?: StripeLineItem[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

async function fetchStripeSession(sessionId: string, secretKey: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Stripe session fetch failed: ${await response.text()}`);
  }

  return (await response.json()) as StripeSession;
}

async function fetchStripePaymentIntent(paymentIntentId: string, secretKey: string) {
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${paymentIntentId}?expand[]=latest_charge.payment_method_details.card`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Stripe payment intent fetch failed: ${await response.text()}`);
  }

  return (await response.json()) as StripePaymentIntent;
}

function formatCardBrand(brand?: string | null) {
  if (!brand) {
    return "";
  }

  return brand
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toSanityAddress(address?: StripeAddress | null) {
  if (!address) {
    return undefined;
  }

  return {
    line1: address.line1 || "",
    line2: address.line2 || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postal_code || "",
    country: address.country || "",
  };
}

function getStripeShippingDetails(session: StripeSession) {
  const shipping = session.shipping_details || session.collected_information?.shipping_details || null;
  const fallbackAddress = session.customer_details?.address || null;

  return {
    name: shipping?.name || session.customer_details?.name || "",
    phone: shipping?.phone || session.customer_details?.phone || "",
    address: shipping?.address || fallbackAddress,
  };
}

function getPrintfulSyncVariantId(item: StripeLineItem) {
  const product =
    item.price?.product && typeof item.price.product !== "string" ? item.price.product : undefined;
  const rawValue = product?.metadata?.printful_sync_variant_id;
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function getLineItemDisplayTitle(item: StripeLineItem) {
  const product =
    item.price?.product && typeof item.price.product !== "string" ? item.price.product : undefined;

  return product?.name || "Item";
}

function formatStripeAmount(amount?: number | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return (amount / 100).toFixed(2);
}

function buildOrderDocument(
  session: StripeSession,
  lineItems: StripeLineItem[],
  overrides?: Record<string, unknown>
) {
  const shipping = getStripeShippingDetails(session);
  const rewardsPointsRedeemed = Math.max(0, Number(session.metadata?.rewards_points_redeemed || 0));
  const rewardsDiscountAmount = Math.max(0, Number(session.metadata?.rewards_discount_amount || 0));
  const rewardsPointsEarned = calculateRewardPointsEarned(session.amount_total ?? 0);

  return {
    _id: `order.${session.id}`,
    _type: "order",
    stripeSessionId: session.id,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : "",
    paymentStatus: session.payment_status || "",
    fulfillmentStatus: "processing",
    amountTotal: session.amount_total ?? 0,
    rewardsPointsEarned,
    rewardsPointsRedeemed,
    rewardsDiscountAmount,
    currency: session.currency?.toUpperCase() || "",
    customerName: session.customer_details?.name || "",
    customerEmail: session.customer_details?.email || "",
    customerEmailNormalized: normalizeEmail(session.customer_details?.email || ""),
    customerPhone: session.customer_details?.phone || "",
    shippingName: shipping.name,
    shippingPhone: shipping.phone,
    shippingAddress: toSanityAddress(shipping.address),
    cardBrand: "",
    cardLast4: "",
    stripeCreatedAt: session.created ? new Date(session.created * 1000).toISOString() : undefined,
    items: lineItems.map((item) => {
      const product =
        item.price?.product && typeof item.price.product !== "string" ? item.price.product : undefined;

      return {
        _type: "orderItem",
        _key: crypto.randomUUID(),
        title: getLineItemDisplayTitle(item),
        slug: product?.metadata?.slug || "",
        description: item.description || "",
        syncVariantId: product?.metadata?.printful_sync_variant_id || "",
        size: product?.metadata?.size || "",
        color: product?.metadata?.color || "",
        quantity: item.quantity ?? 0,
        unitAmount: item.price?.unit_amount ?? item.amount_subtotal ?? 0,
        totalAmount: item.amount_total ?? 0,
        currency: item.currency?.toUpperCase() || session.currency?.toUpperCase() || "",
        imageUrl: product?.images?.[0] || "",
      };
    }),
    ...overrides,
  };
}

async function saveOrder(session: StripeSession, lineItems: StripeLineItem[], overrides?: Record<string, unknown>) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  await sanityWriteClient.createOrReplace(buildOrderDocument(session, lineItems, overrides));
}

async function hasRewardsAlreadyBeenApplied(sessionId: string) {
  if (!sanityWriteClient) {
    return false;
  }

  const existing = await sanityWriteClient.fetch<{
    rewardsPointsEarned?: number;
    rewardsPointsRedeemed?: number;
  } | null>(`*[_type == "order" && _id == $id][0]{rewardsPointsEarned, rewardsPointsRedeemed}`, {
    id: `order.${sessionId}`,
  });

  return Boolean(
    existing &&
      (typeof existing.rewardsPointsEarned === "number" || typeof existing.rewardsPointsRedeemed === "number")
  );
}

async function syncAccountRewardsFromOrder(session: StripeSession) {
  const email = normalizeEmail(session.customer_details?.email || "");

  if (!email) {
    return;
  }

  const shipping = getStripeShippingDetails(session);

  await applyOrderRewards({
    email,
    rewardsPointsEarned: calculateRewardPointsEarned(session.amount_total ?? 0),
    rewardsPointsRedeemed: Math.max(0, Number(session.metadata?.rewards_points_redeemed || 0)),
    defaultShippingAddress: toSanityAddress(shipping.address),
    stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
    customerName: session.customer_details?.name || shipping.name || undefined,
  });
}

function buildPrintfulRecipient(session: StripeSession) {
  const shipping = getStripeShippingDetails(session);
  const shippingAddress = shipping.address;
  const recipientName = shipping.name || session.customer_details?.name || "";

  if (
    !recipientName ||
    !shippingAddress?.line1 ||
    !shippingAddress.city ||
    !shippingAddress.postal_code ||
    !shippingAddress.country
  ) {
    throw new Error("Missing required shipping details for Printful fulfillment.");
  }

  return {
    name: recipientName,
    email: session.customer_details?.email || undefined,
    phone: shipping.phone || session.customer_details?.phone || undefined,
    address1: shippingAddress.line1,
    address2: shippingAddress.line2 || undefined,
    city: shippingAddress.city,
    stateCode: shippingAddress.state || undefined,
    countryCode: shippingAddress.country,
    zip: shippingAddress.postal_code,
  };
}

async function submitOrderToPrintful(session: StripeSession, lineItems: StripeLineItem[]) {
  const orderExternalId = buildPrintfulOrderExternalId(session.id);
  const items = lineItems.map((item, index) => {
    const syncVariantId = getPrintfulSyncVariantId(item);

    if (!syncVariantId) {
      throw new Error(`Missing Printful sync variant ID for item ${index + 1}.`);
    }

    return {
      syncVariantId,
      quantity: item.quantity ?? 0,
      retailPrice: formatStripeAmount(item.price?.unit_amount ?? item.amount_subtotal),
      externalId: buildPrintfulOrderItemExternalId(orderExternalId, index),
      name: getLineItemDisplayTitle(item),
    };
  });

  if (items.some((item) => item.quantity <= 0)) {
    throw new Error("A paid order item has an invalid quantity.");
  }

  return submitPrintfulOrder({
    externalId: orderExternalId,
    recipient: buildPrintfulRecipient(session),
    items,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const signatureHeader = request.headers.get("stripe-signature");

  if (!webhookSecret || !stripeSecretKey) {
    return NextResponse.json({ error: "Missing Stripe webhook configuration." }, { status: 500 });
  }

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  if (!verifyStripeSignature(payload, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;

  if (!session || session.object !== "checkout.session") {
    return NextResponse.json({ error: "Invalid checkout session payload." }, { status: 400 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, skipped: true });
  }

  try {
    const [fullSession, lineItems] = await Promise.all([
      fetchStripeSession(session.id, stripeSecretKey),
      fetchStripeLineItems(session.id, stripeSecretKey),
    ]);
    const paymentIntent =
      typeof fullSession.payment_intent === "string" && fullSession.payment_intent
        ? await fetchStripePaymentIntent(fullSession.payment_intent, stripeSecretKey)
        : null;
    const paymentCard = paymentIntent?.latest_charge?.payment_method_details?.card || null;
    const rewardsAlreadyApplied = await hasRewardsAlreadyBeenApplied(fullSession.id);
    await saveOrder(fullSession, lineItems, {
      cardBrand: formatCardBrand(paymentCard?.brand),
      cardLast4: paymentCard?.last4 || "",
    });

    if (!rewardsAlreadyApplied) {
      await syncAccountRewardsFromOrder(fullSession);
    }

    if (!isPrintfulAutoSubmitEnabled()) {
      await saveOrder(fullSession, lineItems, {
        fulfillmentStatus: "processing",
        printfulSubmissionError: "",
        cardBrand: formatCardBrand(paymentCard?.brand),
        cardLast4: paymentCard?.last4 || "",
      });

      return NextResponse.json({ received: true, skipped: "printful_auto_submit_disabled" });
    }

    try {
      const printfulOrder = await submitOrderToPrintful(fullSession, lineItems);

      await saveOrder(fullSession, lineItems, {
        fulfillmentStatus: "submitted_to_printful",
        printfulOrderId: printfulOrder.id,
        printfulExternalId: printfulOrder.externalId,
        printfulStatus: printfulOrder.status,
        printfulSubmittedAt: new Date().toISOString(),
        printfulSubmissionError: "",
        cardBrand: formatCardBrand(paymentCard?.brand),
        cardLast4: paymentCard?.last4 || "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Printful submission failed.";

      await saveOrder(fullSession, lineItems, {
        fulfillmentStatus: "submission_failed",
        printfulSubmissionError: message,
        cardBrand: formatCardBrand(paymentCard?.brand),
        cardLast4: paymentCard?.last4 || "",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order logging failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
