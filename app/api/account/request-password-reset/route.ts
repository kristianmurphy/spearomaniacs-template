import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/account-auth";
import { createPasswordResetRequest } from "@/lib/account.data";
import { buildPasswordResetLink, sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  let payload: { email?: string } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid password reset payload." }, { status: 400 });
  }

  const email = normalizeEmail(payload.email || "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  let resetRequest = null;

  try {
    resetRequest = await createPasswordResetRequest(email);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create password reset request.";

    return NextResponse.json({ error: message }, { status: 429 });
  }

  if (!resetRequest) {
    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a password reset email has been sent.",
    });
  }

  const resetLink = buildPasswordResetLink(resetRequest.token);

  try {
    const emailResult = await sendPasswordResetEmail({
      email: resetRequest.user.email,
      name: resetRequest.user.name,
      resetLink,
    });

    if (!emailResult.sent) {
      return NextResponse.json(
        { error: "Password reset email is not configured yet." },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Password reset instructions sent.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not send password reset email." },
      { status: 502 }
    );
  }
}
