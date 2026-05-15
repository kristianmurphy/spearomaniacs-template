import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_SESSION_COOKIE, readSessionCookieValue } from "@/lib/account-auth";
import { updateNewsletterPreference } from "@/lib/account.data";
import { syncNewsletterContactToResend, unsubscribeNewsletterContactInResend } from "@/lib/resend-newsletter";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSessionCookieValue(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let payload: { newsletterOptIn?: boolean } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid newsletter payload." }, { status: 400 });
  }

  try {
    const newsletterOptIn = Boolean(payload.newsletterOptIn);
    await updateNewsletterPreference(session.email, newsletterOptIn);

    let resendSync;
    if (newsletterOptIn) {
      resendSync = await syncNewsletterContactToResend({
        email: session.email,
        source: "account-opt-in",
      });
    } else {
      resendSync = await unsubscribeNewsletterContactInResend(session.email);
    }

    return NextResponse.json({
      ok: true,
      resendSync,
      warning: resendSync?.ok ? undefined : `Saved in Sanity, but Resend sync failed: ${resendSync?.error}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update newsletter preference." },
      { status: 400 }
    );
  }
}
