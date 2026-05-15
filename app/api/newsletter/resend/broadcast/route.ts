import { NextResponse } from "next/server";
import { createResendBroadcast, sendResendBroadcast } from "@/lib/resend-newsletter";

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

  let payload: {
    subject?: string;
    html?: string;
    text?: string;
    name?: string;
    previewText?: string;
    replyTo?: string;
    sendNow?: boolean;
    scheduledAt?: string;
  } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid broadcast payload." }, { status: 400 });
  }

  if (!payload.subject?.trim() || !payload.html?.trim()) {
    return NextResponse.json({ error: "Subject and HTML are required." }, { status: 400 });
  }

  try {
    const broadcast = await createResendBroadcast({
      subject: payload.subject.trim(),
      html: payload.html,
      text: payload.text,
      name: payload.name,
      previewText: payload.previewText,
      replyTo: payload.replyTo,
    });

    if (payload.sendNow) {
      await sendResendBroadcast(broadcast.id, payload.scheduledAt);
    }

    return NextResponse.json({
      ok: true,
      id: broadcast.id,
      status: payload.sendNow ? "queued" : "draft",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create Resend broadcast." },
      { status: 500 }
    );
  }
}
