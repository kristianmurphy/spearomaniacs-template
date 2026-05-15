import { NextResponse } from "next/server";
import {
  ACCOUNT_SESSION_COOKIE,
  createSessionCookieValue,
  normalizeEmail,
} from "@/lib/account-auth";
import { attemptUserSignIn } from "@/lib/account.data";

export async function POST(request: Request) {
  let payload: { email?: string; password?: string } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid sign in payload." }, { status: 400 });
  }

  const email = normalizeEmail(payload.email || "");
  const password = payload.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
  }

  const result = await attemptUserSignIn(email, password);

  if (!result.ok) {
    if (result.reason === "locked") {
      return NextResponse.json(
        { error: "Too many failed sign-in attempts. Please wait 15 minutes before trying again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const user = result.user;

  const response = NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email, newsletterOptIn: Boolean(user.newsletterOptIn) },
  });

  response.cookies.set(ACCOUNT_SESSION_COOKIE, createSessionCookieValue({ name: user.name, email: user.email }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
