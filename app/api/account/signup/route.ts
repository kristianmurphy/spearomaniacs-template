import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE,
  createSessionCookieValue,
  normalizeEmail,
} from "@/lib/account-auth";
import { createUser, upsertNewsletterSubscriber } from "@/lib/account.data";
import { syncNewsletterContactToResend } from "@/lib/resend-newsletter";

export async function POST(request: Request) {
  let payload: {
    name?: string;
    email?: string;
    password?: string;
    newsletterOptIn?: boolean;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid signup payload." }, { status: 400 });
  }

  const name = payload.name?.trim() || "";
  const email = normalizeEmail(payload.email || "");
  const password = payload.password || "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const user = await createUser({
      name,
      email,
      password,
      newsletterOptIn: Boolean(payload.newsletterOptIn),
    });

    let resendSync;
    if (user.newsletterOptIn) {
      try {
        await upsertNewsletterSubscriber(user.email, "account-opt-in");
        resendSync = await syncNewsletterContactToResend({
          email: user.email,
          source: "account-opt-in",
        });
      } catch {
        // Account creation should not fail if newsletter mirroring is temporarily unavailable.
      }
    }

    const response = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, newsletterOptIn: user.newsletterOptIn },
      resendSync,
      warning: resendSync?.ok ? undefined : resendSync ? `Account created, but Resend sync failed: ${resendSync.error}` : undefined,
    });

    response.cookies.set(ACCOUNT_SESSION_COOKIE, createSessionCookieValue({ name: user.name, email: user.email }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create account." },
      { status: 400 }
    );
  }
}
