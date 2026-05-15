"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type NavigationLink = {
  href: string;
  label: string;
};

type SocialLink = {
  platform?: string;
  url?: string;
  handle?: string;
};

export function SiteFooter({
  theme = "light",
  copyrightLine,
  links,
  socialLinks,
}: {
  theme?: "brand" | "light";
  copyrightLine: string;
  links: NavigationLink[];
  socialLinks: SocialLink[];
}) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterError(null);
    setNewsletterMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newsletterEmail, source: "site-footer" }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not subscribe.");
      }

      setNewsletterMessage(payload.message || "You’re subscribed.");
      setNewsletterEmail("");
    } catch (error) {
      setNewsletterError(error instanceof Error ? error.message : "Could not subscribe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-white/10 bg-black text-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 text-sm md:flex-row md:items-end md:justify-between">
        <div className="max-w-md space-y-3">
          <p>{copyrightLine}</p>
          <form onSubmit={(event) => void handleNewsletterSubmit(event)} className="space-y-2">
            <label className="block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-white/52">
              Newsletter
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Email for updates"
                className="min-w-0 flex-1 border border-white/16 bg-transparent px-4 py-2.5 text-white outline-none placeholder:text-white/34"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="border border-white bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white disabled:opacity-55"
              >
                {isSubmitting ? "Saving..." : "Subscribe"}
              </button>
            </div>
            {newsletterMessage ? <p className="text-xs text-white/72">{newsletterMessage}</p> : null}
            {newsletterError ? <p className="text-xs text-red-300">{newsletterError}</p> : null}
          </form>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex flex-wrap gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((link) => (
                <a
                  key={`${link.platform}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition hover:text-white"
                >
                  {link.handle || link.platform}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
