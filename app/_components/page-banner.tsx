"use client";

import Image from "next/image";
import { useState } from "react";

export function PageBanner({
  title,
  intro,
  imageSrc,
}: {
  title: string;
  intro?: string;
  imageSrc?: string | null;
}) {
  const hasImage = Boolean(imageSrc);
  const [isImageLoaded, setIsImageLoaded] = useState(!hasImage);

  return (
    <section className="w-full bg-white px-[8px] pb-7 sm:px-[8px] sm:pb-8" style={{ paddingTop: "8px" }}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <header className="bg-black">
          <div className="space-y-2.5 px-3.5 py-4 sm:px-4 sm:py-5">
            <h1 className="text-4xl font-semibold uppercase tracking-[0.28em] text-white sm:text-5xl">
              {title}
            </h1>
            {intro ? (
              <p className="max-w-3xl text-sm font-light tracking-[0.08em] text-white sm:text-base">
                {intro}
              </p>
            ) : null}
          </div>
          {hasImage ? (
            <div className="relative -mb-3 bg-black">
              <div className="relative h-[8.75rem] w-full overflow-visible sm:h-40 lg:h-[13.5rem]">
                <Image
                  src={imageSrc!}
                  alt={title}
                  fill
                  onLoad={() => setIsImageLoaded(true)}
                  className={`object-contain grayscale contrast-125 transition-opacity duration-700 ${
                    isImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ objectPosition: "center bottom" }}
                  unoptimized
                />
              </div>
            </div>
          ) : null}
        </header>
      </div>
    </section>
  );
}
