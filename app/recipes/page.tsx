import { ArticleListView } from "@/app/_components/article-list-view";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { imageUrl } from "@/lib/sanity.image";
import { getPageBySlug, getRecipes, getSiteData } from "@/lib/sanity.page";

export async function generateMetadata() {
  const page = await getPageBySlug("recipes");

  return buildPageMetadata({
    pageTabTitle: page?.pageTabTitle || page?.title || "Recipes",
    description: page?.excerpt || "Featured catches and simple cooking ideas from the water to the plate.",
  });
}

export default async function RecipesPage() {
  const [site, recipes, page] = await Promise.all([getSiteData(), getRecipes(), getPageBySlug("recipes")]);

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <ArticleListView
        title={page?.title || "Recipes"}
        intro={page?.tagline || page?.excerpt || "Featured catches and simple cooking ideas from the water to the plate."}
        items={recipes}
        basePath="/recipes"
        bannerImageSrc={imageUrl(page?.bannerImage, 2200)}
      />
    </SitePageShell>
  );
}
