import { PortableText } from "@portabletext/react";
import type { CmsPage } from "@/lib/sanity.page";

export function CmsPageView({
  page,
  theme = "brand",
  isFallback = false,
}: {
  page: CmsPage;
  theme?: "brand" | "light";
  isFallback?: boolean;
}) {
  const isLightTheme = theme === "light";

  return (
    <main className={`px-6 py-16 ${isLightTheme ? "bg-white text-slate-950" : "bg-slate-950 text-white"}`}>
      <article
        className={`mx-auto flex min-h-[calc(100vh-15rem)] w-full max-w-3xl flex-col gap-6 border p-8 sm:p-10 ${
          isLightTheme
            ? "rounded-lg border-slate-200 bg-slate-50"
            : "rounded-lg border-white/10 bg-white/[0.03]"
        }`}
      >
        <header className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">{page.title}</h1>
          {page.excerpt ? (
            <p className={`max-w-2xl ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>{page.excerpt}</p>
          ) : null}
        </header>
        {page.content && page.content.length > 0 ? (
          <div className={`max-w-none ${isLightTheme ? "prose prose-slate" : "prose prose-invert"}`}>
            <PortableText value={page.content} />
          </div>
        ) : (
          <div className={`space-y-3 ${isLightTheme ? "text-slate-600" : "text-white/70"}`}>
            <p>
              {isFallback
                ? "This page route is ready, but no CMS content has been published yet."
                : "No content published yet for this page."}
            </p>
            {isFallback ? (
              <p>Create a page document in Sanity with this slug to replace this placeholder.</p>
            ) : null}
          </div>
        )}
      </article>
    </main>
  );
}
