import { notFound } from "next/navigation";
import { CmsPageView } from "@/app/_components/cms-page-view";
import { ShopPageView } from "@/app/_components/shop-page-view";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getPageBySlug, getPageDefinition, getShopProducts, getSiteData } from "@/lib/sanity.page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pageDefinition = getPageDefinition(slug);

  if (!pageDefinition) {
    return buildPageMetadata({ pageTabTitle: null });
  }

  const page = await getPageBySlug(slug);

  return buildPageMetadata({
    pageTabTitle: page?.pageTabTitle || page?.title || pageDefinition.fallbackTitle,
    description: page?.excerpt || pageDefinition.fallbackExcerpt,
  });
}

export default async function DynamicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pageDefinition = getPageDefinition(slug);
  const site = await getSiteData();

  if (!pageDefinition) {
    notFound();
  }

  const page = await getPageBySlug(slug);
  const resolvedPage = page || {
    title: pageDefinition.fallbackTitle,
    excerpt: pageDefinition.fallbackExcerpt,
    content: [],
  };

  if (slug === "shop") {
    const products = await getShopProducts();

    return (
      <SitePageShell pageTheme="interior" siteData={site}>
        <ShopPageView page={resolvedPage} products={products} shopLocked={site.shopLocked} theme={site.interiorPageTheme} />
      </SitePageShell>
    );
  }

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <CmsPageView page={resolvedPage} theme={site.interiorPageTheme} isFallback={!page?._id} />
    </SitePageShell>
  );
}
