import { notFound } from "next/navigation";
import { ArticlePageView } from "@/app/_components/article-page-view";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getRecipeBySlug, getSiteData } from "@/lib/sanity.page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getRecipeBySlug(slug);

  return buildPageMetadata({
    pageTabTitle: article?.title || "Recipe",
    description: article?.excerpt || "Featured recipe.",
  });
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [site, article] = await Promise.all([getSiteData(), getRecipeBySlug(slug)]);

  if (!article) {
    notFound();
  }

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <ArticlePageView article={article} sectionLabel="Recipes" backHref="/recipes" />
    </SitePageShell>
  );
}
