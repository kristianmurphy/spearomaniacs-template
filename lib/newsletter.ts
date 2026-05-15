import { groq } from "next-sanity";
import { normalizeEmail } from "@/lib/account-auth";
import { backfillNewsletterSubscribersFromUsers } from "@/lib/account.data";
import { sanityWriteClient } from "@/lib/sanity.write.client";

export type NewsletterRecipient = {
  email: string;
  sources: string[];
  subscribedAt?: string;
};

type NewsletterSourceRecord = {
  email?: string;
  subscribedAt?: string;
  source?: string;
};

const newsletterAudienceQuery = groq`
  *[_type == "newsletterSubscriber"]{
    email,
    subscribedAt,
    source
  }
`;

export async function getNewsletterAudience() {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  await backfillNewsletterSubscribersFromUsers();

  const subscribers = await sanityWriteClient.fetch<NewsletterSourceRecord[]>(newsletterAudienceQuery);

  const deduped = new Map<string, NewsletterRecipient>();

  for (const subscriber of subscribers || []) {
    const email = normalizeEmail(subscriber.email || "");

    if (!email) {
      continue;
    }

    const existing = deduped.get(email);

    if (existing) {
      if (subscriber.source && !existing.sources.includes(subscriber.source)) {
        existing.sources.push(subscriber.source);
      }

      if (!existing.subscribedAt || (subscriber.subscribedAt && subscriber.subscribedAt < existing.subscribedAt)) {
        existing.subscribedAt = subscriber.subscribedAt;
      }

      continue;
    }

    deduped.set(email, {
      email,
      sources: [subscriber.source || "site-footer"],
      subscribedAt: subscriber.subscribedAt,
    });
  }

  return Array.from(deduped.values()).sort((a, b) => a.email.localeCompare(b.email));
}
