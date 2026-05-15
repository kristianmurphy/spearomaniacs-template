import Link from "next/link";
import type { ReactNode } from "react";
import { PortableText } from "@portabletext/react";
import { PageBanner } from "@/app/_components/page-banner";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { ExploreGalleryCarousel } from "@/app/explore/explore-gallery-carousel";
import { buildPageMetadata } from "@/lib/site.metadata";
import { imageUrl } from "@/lib/sanity.image";
import { getPageBySlug, getSiteData } from "@/lib/sanity.page";

function renderFormattedExcerpt(text: string) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const rendered: ReactNode[] = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const bulletLines = lines.filter((line) => /^[•*-]\s+/.test(line));
    if (bulletLines.length === lines.length) {
      rendered.push(
        <ul key={`bullets-${index}`} className="list-disc space-y-2 pl-6 text-neutral-700">
          {bulletLines.map((line, itemIndex) => (
            <li key={itemIndex}>{line.replace(/^[•*-]\s+/, "")}</li>
          ))}
        </ul>,
      );
      continue;
    }

    rendered.push(
      <p key={`paragraph-${index}`} className="text-neutral-700">
        {lines.join(" ")}
      </p>,
    );

    if (block.endsWith(":")) {
      const implicitList: string[] = [];
      let nextIndex = index + 1;

      while (nextIndex < blocks.length) {
        const nextBlock = blocks[nextIndex];
        const nextLines = nextBlock
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const isImplicitListItem =
          nextLines.length === 1 && !/[.!?]$/.test(nextLines[0]) && nextLines[0].length <= 80;

        if (!isImplicitListItem) {
          break;
        }

        implicitList.push(nextLines[0]);
        nextIndex += 1;
      }

      if (implicitList.length > 0) {
        rendered.push(
          <ul key={`implicit-list-${index}`} className="list-disc space-y-2 pl-6 text-neutral-700">
            {implicitList.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>,
        );
        index = nextIndex - 1;
      }
    }
  }

  return rendered;
}

const explorePortableTextComponents = {
  block: {
    normal: ({ children }: { children?: ReactNode }) => (
      <p className="whitespace-pre-line text-[1.02rem] leading-8 text-neutral-800">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }: { children?: ReactNode }) => <ul className="list-disc space-y-3 pl-6 text-neutral-800">{children}</ul>,
  },
  listItem: {
    bullet: ({ children }: { children?: ReactNode }) => <li className="pl-1 leading-8">{children}</li>,
  },
};

export async function generateMetadata() {
  const aboutPage = await getPageBySlug("explore");

  return buildPageMetadata({
    pageTabTitle: aboutPage?.pageTabTitle || aboutPage?.title || "Explore",
    description: aboutPage?.excerpt || "Start with the brand story or send through an enquiry.",
  });
}

export default async function ExplorePage() {
  const [site, aboutPage] = await Promise.all([getSiteData(), getPageBySlug("explore")]);
  const content = aboutPage?.content ?? [];
  const hasRichContent = content.length > 0;
  const galleries =
    aboutPage?.photoGalleries
      ?.map((gallery) => ({
        title: gallery.title || "Gallery",
        slides:
          gallery.photos
            ?.map((photo, index) => ({
              src: imageUrl(photo, 2200),
              alt: `${gallery.title || "Gallery"} ${index + 1}`,
            }))
            .filter((photo): photo is { src: string; alt: string } => Boolean(photo.src)) || [],
      }))
      .filter((gallery) => gallery.slides.length > 0) || [];

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <main className="bg-white pb-16 text-neutral-950">
        <PageBanner
          title="Explore"
          intro="Start with the brand story or send through an enquiry."
          imageSrc={imageUrl(aboutPage?.bannerImage, 2200)}
        />

        <section className="mx-auto max-w-5xl space-y-12 px-6 pt-2">
          <section className="space-y-5">
            <h2 className="text-3xl font-semibold">About Us</h2>
            {!hasRichContent && aboutPage?.excerpt ? <div className="space-y-4">{renderFormattedExcerpt(aboutPage.excerpt)}</div> : null}
            {hasRichContent ? (
              <div className="max-w-none space-y-5">
                <PortableText value={content} components={explorePortableTextComponents} />
              </div>
            ) : (
              <p className="text-neutral-600">
                Add content to the `explore` page in the CMS and it will appear here.
              </p>
            )}
          </section>

        </section>

        {galleries.length > 0 ? (
          <section className="mx-auto w-full max-w-7xl space-y-8 px-6 pt-12">
            {galleries.map((gallery) => (
              <ExploreGalleryCarousel key={gallery.title} title={gallery.title} slides={gallery.slides} />
            ))}
          </section>
        ) : null}

        <section id="contact" className="mx-auto max-w-5xl space-y-4 px-6 pt-12">
          <h2 className="text-3xl font-semibold">Contact Us</h2>
          <p className="text-neutral-600">Store enquiries, collaborations, and anything else.</p>
          <div>
            <Link href="mailto:spearomaniacs@gmail.com" className="inline-flex border border-black px-6 py-3 font-semibold hover:bg-black hover:text-white">
              Email Us
            </Link>
          </div>
        </section>
      </main>
    </SitePageShell>
  );
}
