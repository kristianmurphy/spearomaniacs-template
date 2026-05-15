"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type GallerySlide = {
  src: string;
  alt: string;
};

export function ExploreGalleryCarousel({
  title,
  slides,
}: {
  title: string;
  slides: GallerySlide[];
}) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [canScroll, setCanScroll] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (slides.length === 0) {
    return null;
  }

  useEffect(() => {
    const updateScrollableState = () => {
      if (!trackRef.current) {
        return;
      }

      setCanScroll(trackRef.current.scrollWidth > trackRef.current.clientWidth + 4);
    };

    updateScrollableState();
    window.addEventListener("resize", updateScrollableState);

    return () => {
      window.removeEventListener("resize", updateScrollableState);
    };
  }, [slides.length]);

  const scrollByAmount = (direction: "left" | "right") => {
    if (!trackRef.current) {
      return;
    }

    const amount = Math.max(trackRef.current.clientWidth * 0.75, 280);
    trackRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-4">
      <h3 className="text-2xl font-semibold tracking-[0.06em] text-neutral-950">{title}</h3>

      <div
        ref={trackRef}
        className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, slideIndex) => (
          <button
            key={`${title}-${slideIndex}`}
            type="button"
            onClick={() => setPreviewIndex(slideIndex)}
            className="group relative h-full w-[11rem] shrink-0 overflow-hidden border-y border-neutral-200 bg-neutral-100 text-left sm:w-[13rem] lg:w-[14rem]"
            aria-label={`Open larger preview of image ${slideIndex + 1} in ${title}`}
          >
            <div className="relative aspect-[4/5]">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>
          </button>
        ))}
      </div>

      {canScroll ? (
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="border border-black px-3 py-2 text-lg leading-none text-black transition hover:bg-black hover:text-white"
            aria-label={`Scroll ${title} gallery left`}
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="border border-black px-3 py-2 text-lg leading-none text-black transition hover:bg-black hover:text-white"
            aria-label={`Scroll ${title} gallery right`}
          >
            →
          </button>
        </div>
      ) : null}

      {previewIndex !== null ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setPreviewIndex(null)}
            className="absolute inset-0"
            aria-label={`Close preview for ${title}`}
          />
          <div className="relative z-10 w-full max-w-6xl bg-black">
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              className="absolute right-3 top-3 z-20 border border-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
            >
              Close
            </button>
            <div className="relative min-h-[70vh]">
              <Image
                src={slides[previewIndex].src}
                alt={slides[previewIndex].alt}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
