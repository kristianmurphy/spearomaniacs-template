import type { Metadata } from "next";
import { getSiteData } from "@/lib/site.data";

function getSiteTitle(siteTitle?: string) {
  return siteTitle || process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand";
}

function formatTabTitle(siteTitle: string, pageTabTitle?: string | null) {
  const trimmed = pageTabTitle?.trim();
  return trimmed ? `${siteTitle} | ${trimmed}` : siteTitle;
}

export async function getRootMetadata(): Promise<Metadata> {
  const site = await getSiteData();
  const siteTitle = getSiteTitle(site.title);
  const hasCmsIcon = Boolean(site.siteIcon?.asset?.url);

  return {
    title: siteTitle,
    description: site.tagline || `${siteTitle} website`,
    icons: hasCmsIcon
      ? {
          icon: [
            { url: "/api/site-icon", sizes: "any" },
          ],
          shortcut: ["/api/site-icon"],
          apple: ["/api/site-icon"],
        }
      : {
          icon: "/favicon.ico",
          shortcut: "/favicon.ico",
          apple: "/favicon.ico",
        },
  };
}

export async function buildPageMetadata({
  pageTabTitle,
  description,
}: {
  pageTabTitle?: string | null;
  description?: string | null;
}): Promise<Metadata> {
  const site = await getSiteData();
  const siteTitle = getSiteTitle(site.title);

  return {
    title: {
      absolute: formatTabTitle(siteTitle, pageTabTitle),
    },
    description: description || site.tagline || `${siteTitle} website`,
  };
}
