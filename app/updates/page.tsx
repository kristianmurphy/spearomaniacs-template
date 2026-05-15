import { ArticleListView } from "@/app/_components/article-list-view";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { imageUrl } from "@/lib/sanity.image";
import { getPageBySlug, getSiteData, getUpdates } from "@/lib/sanity.page";

export async function generateMetadata() {
  const page = await getPageBySlug("updates");

  return buildPageMetadata({
    pageTabTitle: page?.pageTabTitle || page?.title || "Updates",
    description:
      page?.excerpt || "Latest news, products, stories, and updates from your brand.",
  });
}

export default async function UpdatesPage() {
  const [site, updates, page] = await Promise.all([getSiteData(), getUpdates(), getPageBySlug("updates")]);

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <ArticleListView
        title={page?.title || "Updates"}
        intro={page?.tagline || page?.excerpt || "Latest news, products, stories, and updates from your brand."}
        items={updates}
        basePath="/updates"
        bannerImageSrc={imageUrl(page?.bannerImage, 2200)}
      />
    </SitePageShell>
  );
}
