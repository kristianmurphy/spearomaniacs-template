import Image from "next/image";
import Link from "next/link";
import { PageBanner } from "@/app/_components/page-banner";
import type { CmsArticle } from "@/lib/site.data";
import { imageUrl } from "@/lib/sanity.image";

function formatPublishedDate(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ArticleListView({
  title,
  intro,
  items,
  basePath,
  bannerImageSrc,
}: {
  title: string;
  intro: string;
  items: CmsArticle[];
  basePath: string;
  bannerImageSrc?: string | null;
}) {
  return (
    <main className="bg-white pb-16 text-neutral-950">
      <PageBanner title={title} intro={intro} imageSrc={bannerImageSrc} />

      <section className="mx-auto max-w-6xl px-6 pt-2">

        {items.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {items.map((item) => {
              const href = item.slug ? `${basePath}/${item.slug}` : basePath;
              const imageSrc = imageUrl(item.image, 1200);

              return (
                <Link key={item._id || href} href={href} className="overflow-hidden rounded border border-neutral-200 hover:border-neutral-400">
                  <article className="grid gap-0 sm:grid-cols-[14rem_minmax(0,1fr)]">
                    <div className="relative min-h-52 bg-neutral-100">
                      {imageSrc ? (
                        <Image src={imageSrc} alt={item.title || title} fill className="object-cover" />
                      ) : null}
                    </div>
                    <div className="space-y-4 p-5">
                      {item.publishedAt ? (
                        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
                          {formatPublishedDate(item.publishedAt)}
                        </p>
                      ) : null}
                      <h2 className="text-2xl font-semibold">{item.title || "Untitled"}</h2>
                      {item.excerpt ? <p className="text-neutral-700">{item.excerpt}</p> : null}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-neutral-600">No entries published yet.</p>
        )}
      </section>
    </main>
  );
}
