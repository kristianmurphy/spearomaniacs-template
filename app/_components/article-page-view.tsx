import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
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

export function ArticlePageView({
  article,
  sectionLabel,
  backHref,
}: {
  article: CmsArticle;
  sectionLabel: string;
  backHref: string;
}) {
  const imageSrc = imageUrl(article.image, 1800);

  return (
    <main className="bg-white px-6 pb-16 pt-28 text-neutral-950 sm:pt-32">
      <article className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-4">
          <Link href={backHref} className="text-sm text-neutral-600 underline-offset-4 hover:text-black hover:underline">
            Back to {sectionLabel}
          </Link>
          {article.publishedAt ? (
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              {formatPublishedDate(article.publishedAt)}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold">{article.title || "Untitled"}</h1>
          {article.excerpt ? <p className="text-lg text-neutral-700">{article.excerpt}</p> : null}
          {(article.priceTier || article.timeLabel || article.servesLabel) ? (
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
              {article.priceTier ? <span>{article.priceTier}</span> : null}
              {article.timeLabel ? <span>{article.timeLabel}</span> : null}
              {article.servesLabel ? <span>{article.servesLabel}</span> : null}
            </div>
          ) : null}
          {article.youtubeUrl ? (
            <div>
              <a
                href={article.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-neutral-700 underline underline-offset-4 hover:text-black"
              >
                Watch the catch on YouTube
              </a>
            </div>
          ) : null}
        </div>

        {imageSrc ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded border border-neutral-200 bg-neutral-100">
            <Image src={imageSrc} alt={article.title || sectionLabel} fill className="object-cover" />
          </div>
        ) : null}

        {(article.ingredients && article.ingredients.length > 0) || (article.instructions && article.instructions.length > 0) ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Ingredients</h2>
              {article.ingredients && article.ingredients.length > 0 ? (
                <ul className="space-y-2 text-neutral-800">
                  {article.ingredients.map((item) => (
                    <li key={item} className="border-b border-neutral-200 pb-2 last:border-b-0 last:pb-0">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-600">Ingredients coming soon.</p>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">Instructions</h2>
              {article.instructions && article.instructions.length > 0 ? (
                <ol className="space-y-3 text-neutral-800">
                  {article.instructions.map((step, index) => (
                    <li key={`${index + 1}-${step}`} className="flex gap-3">
                      <span className="shrink-0 font-semibold text-neutral-500">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-neutral-600">Instructions coming soon.</p>
              )}
            </section>
          </div>
        ) : null}

        {article.content && article.content.length > 0 ? (
          <div className="prose max-w-none">
            <PortableText value={article.content} />
          </div>
        ) : null}
      </article>
    </main>
  );
}
