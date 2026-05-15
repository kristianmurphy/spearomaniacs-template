import { NextResponse } from "next/server";
import { getNewsletterAudience } from "@/lib/newsletter";

function isAuthorized(request: Request) {
  const adminToken = process.env.NEWSLETTER_ADMIN_TOKEN;

  if (!adminToken) {
    return false;
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return bearerToken === adminToken;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const audience = await getNewsletterAudience();

  return NextResponse.json({
    count: audience.length,
    recipients: audience,
  });
}
