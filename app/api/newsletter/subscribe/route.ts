import { NextResponse } from "next/server";
import { subscribeEmailToNewsletter } from "@/lib/account.data";
import { normalizeEmail } from "@/lib/account-auth";
import { syncNewsletterContactToResend } from "@/lib/resend-newsletter";

export async function POST(request: Request) {
  let payload: { email?: string; source?: string } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid newsletter subscription payload." }, { status: 400 });
  }

  const email = normalizeEmail(payload.email || "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    const result = await subscribeEmailToNewsletter(email, payload.source || "site-footer");
    const resendSync = await syncNewsletterContactToResend({
      email,
      source: payload.source || "site-footer",
    });

    return NextResponse.json({
      ok: true,
      alreadySubscribed: result.alreadySubscribed,
      message: result.alreadySubscribed ? "You’re already subscribed." : "You’re subscribed to updates.",
      resendSync,
      warning: resendSync.ok ? undefined : `Saved in Sanity, but Resend sync failed: ${resendSync.error}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not subscribe to the newsletter." },
      { status: 400 }
    );
  }
}
