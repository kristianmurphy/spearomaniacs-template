import Image from "next/image";
import Link from "next/link";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { getPreferredHoverPreviewImage, getPreferredProductPreviewImage } from "@/lib/product-variants";
import { buildPageMetadata } from "@/lib/site.metadata";
import { imageUrl } from "@/lib/sanity.image";
import { getLatestUpdate, getPageBySlug, getRecipes, getShopProducts, getSiteData, type CmsProduct } from "@/lib/site.data";

export async function generateMetadata() {
  const site = await getSiteData();

  return buildPageMetadata({
    pageTabTitle: site.homePageTabTitle || "Home",
    description: site.tagline || site.introText || `${site.title || process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand"} website`,
  });
}

function SectionHeading({
  title,
  theme = "light",
}: {
  title: string;
  theme?: "light" | "dark";
}) {
  const lineClass = theme === "dark" ? "bg-white/35" : "bg-black/18";
  const textClass = theme === "dark" ? "text-white" : "text-neutral-950";

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <span className={`h-px flex-1 ${lineClass}`} />
      <h2
        className={`text-center text-[1.7rem] font-semibold uppercase tracking-[0.18em] sm:text-3xl ${textClass}`}
      >
        {title}
      </h2>
      <span className={`h-px flex-1 ${lineClass}`} />
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: CmsProduct;
}) {
  const imageSrc = imageUrl(product.image, 900) || getPreferredProductPreviewImage(product, { preferredSize: "L" });
  const hoverImageSrc = imageUrl(product.hoverImage, 900) || getPreferredHoverPreviewImage(product, { preferredSize: "L" });
  const resolvedImageSrc = imageSrc;
  const resolvedPriceLabel = product.priceLabel || product.printfulPriceLabel;
  const productHref = product.slug ? `/shop/${product.slug}` : "/shop";

  return (
    <Link href={productHref} className="group block bg-white">
      <article>
        <div className="relative aspect-[4/5] overflow-hidden border border-neutral-200 bg-white transition group-hover:border-neutral-400">
          {resolvedImageSrc ? (
            <>
                <Image
                  src={resolvedImageSrc}
                  alt={product.title || "Product"}
                  fill
                  unoptimized
                  className={`object-contain p-3 transition duration-500 ${
                  hoverImageSrc ? "scale-100 opacity-100 group-hover:scale-[1.02] group-hover:opacity-0" : "group-hover:scale-[1.02]"
                }`}
              />
              {hoverImageSrc ? (
                <Image
                  src={hoverImageSrc}
                  alt={product.title || "Product alternate view"}
                  fill
                  className="object-contain p-3 opacity-0 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : null}
        </div>
        <div className="space-y-2.5 px-1 py-4">
          <div className="space-y-1.5">
            {product.badge ? (
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-neutral-400">
                {product.badge}
              </p>
            ) : null}
            <h3 className="text-[0.95rem] font-semibold text-neutral-950 transition group-hover:underline sm:text-base">
              {product.title || "Untitled product"}
            </h3>
            {resolvedPriceLabel ? (
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-neutral-500 sm:text-xs">
                {resolvedPriceLabel}
              </p>
            ) : null}
          </div>
          {product.summary ? (
            <p className="text-xs leading-5 text-neutral-600 sm:text-sm">{product.summary}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export default async function Home() {
  const [site, products, latestUpdate, recipes, aboutPage] = await Promise.all([
    getSiteData(),
    getShopProducts(),
    getLatestUpdate(),
    getRecipes(),
    getPageBySlug("explore"),
  ]);

  const heroImage = imageUrl(site.heroImage, 2400);
  const closingImage = imageUrl(site.closingImage, 2400);
  const featuredRecipe = site.featuredRecipe || recipes[0] || null;
  const homeProducts = products.slice(0, 8);
  const heroAspectRatio = site.heroImage?.asset?.metadata?.dimensions?.aspectRatio || 13 / 4;
  const latestUpdateImage = latestUpdate ? imageUrl(latestUpdate.image, 1400) : null;
  const aboutImage = imageUrl(site.exploreImage, 1600);

  return (
    <SitePageShell pageTheme="home" siteData={site}>
      <main className="bg-white text-neutral-950">
        <section id="masthead" className="bg-black text-white">
          <div
            className="relative min-h-[clamp(7.75rem,36vw,10rem)] w-full overflow-hidden bg-black sm:min-h-0"
            style={{ aspectRatio: `${heroAspectRatio}` }}
          >
            {site.heroVideoUrl ? (
              <video
                className="block h-full w-full object-cover object-left sm:object-contain sm:object-center"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster={heroImage || undefined}
              >
                <source src={site.heroVideoUrl} />
              </video>
            ) : heroImage ? (
              <Image
                src={heroImage}
                alt={site.title}
                fill
                priority
                className="object-cover object-left sm:object-contain sm:object-center"
              />
            ) : null}
          </div>
          <div className="bg-black px-4 py-4 text-center sm:px-6 sm:py-5">
            <div className="mx-auto max-w-3xl space-y-1.5">
              <p className="text-[0.68rem] font-light uppercase tracking-[0.22em] text-white/78 sm:text-xs">
                Support The Dream &
              </p>
              <h1 className="text-[1.25rem] font-semibold uppercase tracking-[0.14em] text-white sm:text-[2rem]">
                Catch Youself Some Top Designs
              </h1>
              <div className="pt-1">
                <Link
                  href="/shop"
                  className="inline-flex border border-white bg-transparent px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white no-underline transition-colors duration-200 hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="shop-section" className="bg-white text-neutral-950">
          <div className="mx-auto max-w-5xl scroll-mt-40 px-6 py-14 sm:px-8 lg:px-10">
            <div className="mb-8 pb-4">
              <SectionHeading title="Latest Apparel" />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {homeProducts.map((product) => (
                <ProductCard
                  key={product._id || product.slug}
                  product={product}
                />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/shop" className="inline-flex border border-black bg-transparent px-8 py-3 font-semibold text-black no-underline transition-colors duration-200 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white">
                View All
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-black text-white">
          <div className="relative w-full">
            <div className="relative h-4 w-full">
              <Image src="/rough-edge.svg" alt="" fill className="object-cover rotate-180" aria-hidden="true" />
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-6 pb-18 pt-10 sm:px-8 lg:px-10">
            <div className="pt-8">
              <div className="space-y-14">
                <div className="space-y-5">
                  <SectionHeading title="Latest Update" theme="dark" />
                  <div className="border border-neutral-200 bg-white px-6 py-6 text-neutral-950 outline outline-1 outline-offset-[2px] outline-white sm:px-7 sm:py-7">
                    {latestUpdate ? (
                      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_14rem] md:items-start">
                        <div className="space-y-3">
                          <h3 className="text-2xl font-semibold">{latestUpdate.title}</h3>
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                            {latestUpdate.publishedAt
                              ? new Intl.DateTimeFormat("en-AU", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }).format(new Date(latestUpdate.publishedAt))
                              : "Latest"}
                          </p>
                          <p className="max-w-3xl text-neutral-700">
                            {latestUpdate.excerpt || "More updates coming soon."}
                          </p>
                        </div>
                        {latestUpdateImage ? (
                          <div className="relative min-h-40 overflow-hidden border border-neutral-200 bg-neutral-100">
                            <Image
                              src={latestUpdateImage}
                              alt={latestUpdate.title || "Latest update"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-2xl font-semibold">No Updates Yet!</h3>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
                          Latest
                        </p>
                        <p className="max-w-3xl text-neutral-700">Stay tuned for updates soon.</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href="/updates" className="inline-flex border border-white bg-transparent px-6 py-3 font-semibold text-white no-underline transition-colors duration-200 hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black">
                      Check Updates
                    </Link>
                  </div>
                </div>

                <div className="space-y-5 border-t border-white/14 pt-10">
                  <SectionHeading title="Featured Recipe" theme="dark" />
                  <div className="border border-neutral-200 bg-white px-6 py-6 text-neutral-950 outline outline-1 outline-offset-[2px] outline-white sm:px-7 sm:py-7">
                    {featuredRecipe ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="text-2xl font-semibold">{featuredRecipe.title}</h3>
                          {(featuredRecipe.priceTier || featuredRecipe.timeLabel || featuredRecipe.servesLabel) ? (
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                              {featuredRecipe.priceTier ? <span>{featuredRecipe.priceTier}</span> : null}
                              {featuredRecipe.timeLabel ? <span>{featuredRecipe.timeLabel}</span> : null}
                              {featuredRecipe.servesLabel ? <span>{featuredRecipe.servesLabel}</span> : null}
                            </div>
                          ) : null}
                          {featuredRecipe.excerpt ? (
                            <p className="max-w-3xl text-neutral-700">
                              {featuredRecipe.excerpt}{" "}
                              {featuredRecipe.slug ? (
                                <Link
                                  href={`/recipes/${featuredRecipe.slug}`}
                                  className="font-medium underline underline-offset-4 hover:text-black"
                                >
                                  View Full Recipe
                                </Link>
                              ) : null}
                            </p>
                          ) : featuredRecipe.slug ? (
                            <p className="max-w-3xl text-neutral-700">
                              <Link
                                href={`/recipes/${featuredRecipe.slug}`}
                                className="font-medium underline underline-offset-4 hover:text-black"
                              >
                                View Full Recipe
                              </Link>
                            </p>
                          ) : null}
                        </div>

                        {imageUrl(featuredRecipe.image, 1600) ? (
                          featuredRecipe.slug ? (
                            <Link
                              href={`/recipes/${featuredRecipe.slug}`}
                              className="relative block min-h-64 overflow-hidden border border-neutral-200 bg-neutral-100"
                            >
                              <Image
                                src={imageUrl(featuredRecipe.image, 1600)!}
                                alt={featuredRecipe.title || "Featured recipe"}
                                fill
                                className="object-cover"
                              />
                              <div className="pointer-events-none absolute inset-1.5 border border-white" aria-hidden="true" />
                            </Link>
                          ) : (
                            <div className="relative min-h-64 overflow-hidden border border-neutral-200 bg-neutral-100">
                              <Image
                                src={imageUrl(featuredRecipe.image, 1600)!}
                                alt={featuredRecipe.title || "Featured recipe"}
                                fill
                                className="object-cover"
                              />
                              <div className="pointer-events-none absolute inset-1.5 border border-white" aria-hidden="true" />
                            </div>
                          )
                        ) : null}

                        <div className="flex flex-wrap gap-4">
                          {featuredRecipe.youtubeUrl ? (
                            <a
                              href={featuredRecipe.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex border border-black bg-transparent px-6 py-3 font-semibold text-black no-underline transition-colors duration-200 hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white"
                            >
                              Watch Catch Video
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-2xl font-semibold">No Recipes Yet!</h3>
                        <p className="text-neutral-600">A featured recipe will land here soon.</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href="/recipes" className="inline-flex border border-white bg-transparent px-6 py-3 font-semibold text-white no-underline transition-colors duration-200 hover:bg-white hover:text-black focus-visible:bg-white focus-visible:text-black">
                      See All Recipes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative w-full">
            <div className="relative h-4 w-full">
              <Image src="/rough-edge.svg" alt="" fill className="object-cover" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-14 sm:px-8 lg:px-10">
          <div className="space-y-5">
            <SectionHeading title="Explore" />
            <div className="border border-neutral-200 bg-black sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] sm:items-stretch">
              <div className="flex min-h-[28rem] items-center justify-center bg-black p-4 sm:min-h-[32rem] sm:justify-start sm:p-5 md:min-h-[38rem] md:p-6">
                {aboutImage ? (
                  <Image
                    src={aboutImage}
                    alt={aboutPage?.title || "Explore"}
                    width={2200}
                    height={1600}
                    className="h-auto max-h-full w-full object-contain object-center sm:object-left"
                  />
                ) : null}
              </div>
              <div className="relative z-10 -mt-14 px-4 pb-4 sm:mt-0 sm:flex sm:items-center sm:px-0 sm:py-5 sm:pr-5 md:py-6 md:pr-6">
                <div
                  className="w-full max-w-md space-y-4 border border-neutral-200 bg-white px-4 py-4 text-neutral-950 shadow-sm sm:-ml-10 sm:w-[20rem] sm:px-5 sm:py-5 md:w-[22rem]"
                >
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">About</h3>
                    <p className="text-neutral-700">
                      {aboutPage?.excerpt || "Use this space to explain the brand, its story, and what the site is built around."}{" "}
                      <Link href="/explore" className="font-semibold underline underline-offset-4 hover:no-underline">
                        Learn more
                      </Link>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-semibold">Reach Out</h4>
                    <p className="text-neutral-700">
                      You can get in touch for store questions, collaborations, or anything else.{" "}
                      <Link href="/explore#contact" className="font-semibold underline underline-offset-4 hover:no-underline">
                        Contact us
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-8 pt-2 sm:px-8 lg:px-10">
          <div className="overflow-hidden border border-neutral-200 bg-black text-white">
            <div className="relative md:grid md:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end p-3 sm:p-4 md:static md:order-1">
                <p
                  className="max-w-xl text-4xl font-semibold uppercase leading-tight sm:text-6xl"
                  style={{
                    textShadow: "0 2px 6px rgba(0,0,0,0.45)",
                  }}
                >
                  {site.closingTagline || "Closing statement"}
                </p>
              </div>
              <div className="relative min-h-[16rem] bg-black md:order-2 md:-ml-32 md:min-h-[22rem]">
                {closingImage ? (
                  <Image
                    src={closingImage}
                    alt={site.closingTagline || site.title || process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand"}
                    fill
                    className="object-contain"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </SitePageShell>
  );
}
