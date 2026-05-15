import { NextResponse } from "next/server";
import { syncNewsletterAudienceToResend } from "@/lib/resend-newsletter";

function isAuthorized(request: Request) {
  const adminToken = process.env.NEWSLETTER_ADMIN_TOKEN;

  if (!adminToken) {
    return false;
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return bearerToken === adminToken;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncNewsletterAudienceToResend();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not sync Resend audience." },
      { status: 500 }
    );
  }
}
