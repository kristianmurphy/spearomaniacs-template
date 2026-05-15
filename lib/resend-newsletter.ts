import { getNewsletterAudience } from "@/lib/newsletter";

type ResendContactPayload = {
  audienceId: string;
  email: string;
  unsubscribed?: boolean;
  firstName?: string;
  lastName?: string;
};

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY.");
  }

  return apiKey;
}

function getNewsletterAudienceId() {
  const audienceId = process.env.RESEND_NEWSLETTER_AUDIENCE_ID?.trim();

  if (!audienceId) {
    throw new Error("Missing RESEND_NEWSLETTER_AUDIENCE_ID.");
  }

  return audienceId;
}

export function getNewsletterFromAddress() {
  const fromEmail = process.env.EMAIL_FROM?.trim();

  if (!fromEmail) {
    throw new Error("Missing EMAIL_FROM.");
  }

  const fromName = process.env.NEWSLETTER_FROM_NAME?.trim() || process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand";
  return `${fromName} <${fromEmail}>`;
}

async function resendRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
      "User-Agent": "spearomaniacs-newsletter/1.0",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Resend request failed (${response.status}): ${await response.text()}`);
  }

  return (await response.json()) as T;
}

async function createOrUpdateResendContact(payload: ResendContactPayload) {
  try {
    return await resendRequest<{ id?: string }>("/audiences/" + payload.audienceId + "/contacts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (!/already exists|409|duplicate/i.test(message)) {
      throw error;
    }

    return await resendRequest<{ id?: string }>("/contacts/" + encodeURIComponent(payload.email), {
      method: "PATCH",
      body: JSON.stringify({
        unsubscribed: payload.unsubscribed ?? false,
        firstName: payload.firstName,
        lastName: payload.lastName,
      }),
    });
  }
}

type ResendSyncResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

export async function syncNewsletterAudienceToResend() {
  const audienceId = getNewsletterAudienceId();
  const audience = await getNewsletterAudience();
  let synced = 0;

  for (const recipient of audience) {
    await createOrUpdateResendContact({
      audienceId,
      email: recipient.email,
      unsubscribed: false,
    });
    synced += 1;
  }

  return {
    audienceId,
    synced,
  };
}

export async function syncNewsletterContactToResend(input: {
  email: string;
  source?: string;
  subscribedAt?: string;
}): Promise<ResendSyncResult> {
  try {
    await createOrUpdateResendContact({
      audienceId: getNewsletterAudienceId(),
      email: input.email,
      unsubscribed: false,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend sync error.";
    console.error("Newsletter contact sync to Resend failed.", {
      email: input.email,
      source: input.source,
      error: message,
    });
    return {
      ok: false,
      error: message,
    };
  }
}

export async function unsubscribeNewsletterContactInResend(email: string): Promise<ResendSyncResult> {
  try {
    await resendRequest<{ id?: string }>(`/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      body: JSON.stringify({
        unsubscribed: true,
      }),
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Resend unsubscribe error.";
    console.error("Newsletter contact unsubscribe in Resend failed.", {
      email,
      error: message,
    });
    return {
      ok: false,
      error: message,
    };
  }
}

export async function createResendBroadcast(input: {
  subject: string;
  html: string;
  text?: string;
  name?: string;
  previewText?: string;
  replyTo?: string;
}) {
  const audienceId = getNewsletterAudienceId();
  const payload = await resendRequest<{ id: string }>("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audienceId,
      from: getNewsletterFromAddress(),
      subject: input.subject,
      html: input.html,
      text: input.text,
      name: input.name,
      previewText: input.previewText,
      replyTo: input.replyTo,
    }),
  });

  return payload;
}

export async function sendResendBroadcast(broadcastId: string, scheduledAt?: string) {
  return resendRequest<{ id: string }>(`/broadcasts/${broadcastId}/send`, {
    method: "POST",
    body: JSON.stringify(scheduledAt ? { scheduledAt } : {}),
  });
}
