import { notFound } from "next/navigation";
import { ShopProductView } from "@/app/_components/shop-product-view";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getShopProductBySlug, getSiteData } from "@/lib/sanity.page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getShopProductBySlug(slug);

  return buildPageMetadata({
    pageTabTitle: product?.title || "Product",
    description: product?.summary || product?.priceLabel || product?.printfulPriceLabel || "Product page.",
  });
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, site] = await Promise.all([getShopProductBySlug(slug), getSiteData()]);

  if (!product) {
    notFound();
  }

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <ShopProductView product={product} theme={site.interiorPageTheme} />
    </SitePageShell>
  );
}
