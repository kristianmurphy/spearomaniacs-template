import { notFound } from "next/navigation";
import { ArticlePageView } from "@/app/_components/article-page-view";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getSiteData, getUpdateBySlug } from "@/lib/sanity.page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getUpdateBySlug(slug);

  return buildPageMetadata({
    pageTabTitle: article?.title || "Update",
    description: article?.excerpt || "Latest update.",
  });
}

export default async function UpdateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [site, article] = await Promise.all([getSiteData(), getUpdateBySlug(slug)]);

  if (!article) {
    notFound();
  }

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <ArticlePageView article={article} sectionLabel="Updates" backHref="/updates" />
    </SitePageShell>
  );
}
