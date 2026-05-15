import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_SESSION_COOKIE, createSessionCookieValue, readSessionCookieValue } from "@/lib/account-auth";
import { updateAccountProfile } from "@/lib/account.data";
import { createOrUpdateStripeCustomer } from "@/lib/stripe-customers";

type ProfilePayload = {
  name?: string;
  defaultShippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  stripeCustomerId?: string;
};

function normalizeAddress(address?: ProfilePayload["defaultShippingAddress"]) {
  return {
    line1: address?.line1?.trim() || "",
    line2: address?.line2?.trim() || "",
    city: address?.city?.trim() || "",
    state: address?.state?.trim() || "",
    postalCode: address?.postalCode?.trim() || "",
    country: address?.country?.trim().toUpperCase() || "",
  };
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSessionCookieValue(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let payload: ProfilePayload = {};

  try {
    payload = (await request.json()) as ProfilePayload;
  } catch {
    return NextResponse.json({ error: "Invalid profile payload." }, { status: 400 });
  }

  const name = payload.name?.trim() || session.name;
  const defaultShippingAddress = normalizeAddress(payload.defaultShippingAddress);

  let stripeCustomerId = payload.stripeCustomerId || "";

  try {
    stripeCustomerId = await createOrUpdateStripeCustomer({
      stripeCustomerId: stripeCustomerId || undefined,
      email: session.email,
      name,
      shippingAddress:
        defaultShippingAddress.line1 &&
        defaultShippingAddress.city &&
        defaultShippingAddress.postalCode &&
        defaultShippingAddress.country
          ? defaultShippingAddress
          : undefined,
    });

    await updateAccountProfile(session.email, {
      name,
      defaultShippingAddress,
      stripeCustomerId,
    });

    const response = NextResponse.json({ ok: true, stripeCustomerId });
    response.cookies.set(ACCOUNT_SESSION_COOKIE, createSessionCookieValue({ name, email: session.email }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update account profile." },
      { status: 400 }
    );
  }
}
