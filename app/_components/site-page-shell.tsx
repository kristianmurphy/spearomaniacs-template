import type { ReactNode } from "react";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { imageUrl } from "@/lib/sanity.image";
import { getSiteData } from "@/lib/site.data";

const NAV_OPTIONS = [
  { key: "shop", href: "/shop" },
  { key: "updates", href: "/updates" },
  { key: "recipes", href: "/recipes" },
  { key: "explore", href: "/explore" },
] as const;

const NAV_LABELS: Record<(typeof NAV_OPTIONS)[number]["key"], string> = {
  shop: "Shop",
  updates: "Updates",
  recipes: "Recipes",
  explore: "Explore",
};

export async function SitePageShell({
  children,
  pageTheme = "interior",
  siteData,
}: {
  children: ReactNode;
  pageTheme?: "home" | "interior";
  siteData?: Awaited<ReturnType<typeof getSiteData>>;
}) {
  const site = siteData ?? (await getSiteData());
  const navLogoSrc = imageUrl(site.navLogo, 800);
  const longLogoSrc = imageUrl(site.siteLogo, 1200);
  const resolvedTheme = pageTheme === "home" ? "brand" : site.interiorPageTheme;

  const pageTitles = new Map(site.pages.map((page) => [page.slug, page.title]));

  const mainLinks = (site.navbarItems || [])
    .map((key) => NAV_OPTIONS.find((option) => option.key === key))
    .filter((item): item is (typeof NAV_OPTIONS)[number] => Boolean(item))
    .map((item) => ({
      href: item.href,
      label: pageTitles.get(item.key) || NAV_LABELS[item.key],
    }));

  const footerLinks = [
    { href: "/shop", label: "Shop" },
    { href: "/updates", label: "Updates" },
    { href: "/recipes", label: "Recipes" },
    { href: "/explore", label: "Explore" },
    { href: "/returns", label: "Returns" },
    { href: "/customer-service", label: "Customer Service" },
  ];

  return (
    <>
      <SiteHeader
        theme={resolvedTheme}
        logoSrc={navLogoSrc}
        logoAlt={site.navLogoAlt}
        longLogoSrc={longLogoSrc}
        longLogoAlt={site.siteLogoAlt}
        invertLogo={site.invertNavbarLogo}
        invertWordmark={site.invertNavbarWordmark}
        oversizeLongLogo={site.navLogoOversized}
        socialLinks={site.socialLinks}
        mainLinks={mainLinks}
        exploreLinks={[]}
      />
      <div aria-hidden="true" style={{ height: "var(--site-header-height)" }} />
      {children}
      <SiteFooter
        theme={resolvedTheme}
        copyrightLine={site.copyrightLine}
        links={footerLinks}
        socialLinks={site.socialLinks}
      />
    </>
  );
}
