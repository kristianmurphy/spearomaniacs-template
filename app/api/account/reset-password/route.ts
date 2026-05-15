import { NextResponse } from "next/server";
import { ACCOUNT_SESSION_COOKIE, createSessionCookieValue } from "@/lib/account-auth";
import { resetPasswordWithToken } from "@/lib/account.data";

export async function POST(request: Request) {
  let payload: { token?: string; password?: string } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid reset password payload." }, { status: 400 });
  }

  const token = payload.token?.trim() || "";
  const password = payload.password || "";

  if (!token) {
    return NextResponse.json({ error: "Missing password reset token." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const user = await resetPasswordWithToken(token, password);
    const response = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email },
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
      { error: error instanceof Error ? error.message : "Could not reset password." },
      { status: 400 }
    );
  }
}
