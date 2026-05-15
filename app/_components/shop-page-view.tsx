"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { PageBanner } from "@/app/_components/page-banner";
import { getPreferredHoverPreviewImage, getPreferredProductPreviewImage } from "@/lib/product-variants";
import type { CmsPage, CmsProduct } from "@/lib/site.data";
import { imageUrl } from "@/lib/sanity.image";

type FilterState = {
  audience: string[];
  type: string[];
  size: string[];
  color: string[];
};

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
  theme = "brand",
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  theme?: "brand" | "light";
}) {
  if (options.length === 0) {
    return null;
  }

  const isLightTheme = theme === "light";

  return (
    <section className={`space-y-3 border-b pb-5 ${isLightTheme ? "border-black/12" : "border-white/10"}`}>
      <h3 className={`text-xs font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "text-black/55" : "text-white/45"}`}>{label}</h3>
      <div className="space-y-2.5">
        {options.map((option) => {
          const isChecked = selected.includes(option);

          return (
            <label
              key={option}
              className={`group flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-sm transition ${
                isLightTheme
                  ? "rounded-none border-black bg-white text-black hover:bg-black hover:text-white"
                  : "rounded-md border-white/10 bg-white/[0.02] text-white/72 hover:border-white/20 hover:bg-white/[0.045]"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(option)}
                className="sr-only"
              />
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-[0.35rem] border transition ${
                  isLightTheme
                    ? "rounded-none border-black bg-white group-hover:border-white"
                    : "border-white/25 bg-slate-950/55 group-hover:border-white/40"
                }`}
              >
              <span
                className={`absolute inset-[3px] flex items-center justify-center rounded-[0.18rem] transition ${
                  isChecked
                    ? isLightTheme
                      ? "bg-black"
                      : "bg-white text-slate-950"
                    : "bg-transparent"
                }`}
              />
            </span>
              <span
                className={`text-[0.92rem] tracking-[0.04em] transition ${
                  isLightTheme ? "text-black group-hover:text-white" : "text-white/78 group-hover:text-white"
                }`}
              >
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function FilterSidebar({
  activeFilterCount,
  showHeader = true,
  filterOptions,
  filters,
  setFilters,
  theme = "brand",
}: {
  activeFilterCount: number;
  showHeader?: boolean;
  filterOptions: {
    audience: string[];
    type: string[];
    size: string[];
    color: string[];
  };
  filters: FilterState;
  setFilters: Dispatch<SetStateAction<FilterState>>;
  theme?: "brand" | "light";
}) {
  const isLightTheme = theme === "light";

  return (
    <aside className={`space-y-5 ${isLightTheme ? "border border-black px-4 py-4" : ""}`}>
      {showHeader ? (
        <div className="space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "text-black/55" : "text-white/45"}`}>Filters</p>
          <p className={`text-sm ${isLightTheme ? "text-black/70" : "text-white/58"}`}>{activeFilterCount} selected</p>
          <div className={`h-px w-full ${isLightTheme ? "bg-black/12" : "bg-white/10"}`} />
        </div>
      ) : null}
      <FilterGroup
        label="Audience"
        options={filterOptions.audience}
        selected={filters.audience}
        theme={theme}
        onToggle={(value) =>
          setFilters((current) => ({ ...current, audience: toggleValue(current.audience, value) }))
        }
      />
      <FilterGroup
        label="Type"
        options={filterOptions.type}
        selected={filters.type}
        theme={theme}
        onToggle={(value) =>
          setFilters((current) => ({ ...current, type: toggleValue(current.type, value) }))
        }
      />
      <FilterGroup
        label="Size"
        options={filterOptions.size}
        selected={filters.size}
        theme={theme}
        onToggle={(value) =>
          setFilters((current) => ({ ...current, size: toggleValue(current.size, value) }))
        }
      />
      <FilterGroup
        label="Color"
        options={filterOptions.color}
        selected={filters.color}
        theme={theme}
        onToggle={(value) =>
          setFilters((current) => ({ ...current, color: toggleValue(current.color, value) }))
        }
      />
    </aside>
  );
}

function ShopProductCard({ product, theme = "brand" }: { product: CmsProduct; theme?: "brand" | "light" }) {
  const imageSrc = imageUrl(product.image, 900) || getPreferredProductPreviewImage(product, { preferredSize: "L" });
  const hoverImageSrc = imageUrl(product.hoverImage, 900) || getPreferredHoverPreviewImage(product, { preferredSize: "L" });
  const resolvedImageSrc = imageSrc;
  const resolvedPriceLabel = product.priceLabel || product.printfulPriceLabel;
  const productHref = product.slug ? `/shop/${product.slug}` : "/shop";
  const isLightTheme = theme === "light";

  return (
    <Link
      href={productHref}
      className={`group block transition ${
        isLightTheme
          ? "bg-white"
          : "bg-white/[0.03]"
      }`}
    >
      <article>
            <div
          className={`relative aspect-[4/5] overflow-hidden border transition ${
            isLightTheme
              ? "border-neutral-200 bg-white group-hover:border-neutral-400"
              : "border-white/10 bg-white group-hover:border-white/22"
          }`}
        >
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
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_40%),linear-gradient(135deg,_#1e293b,_#020617)]" />
          )}
        </div>
        <div className="space-y-2.5 px-1 py-4">
          <div className="space-y-1.5">
            {product.badge ? (
              <p className={`text-[0.65rem] font-medium uppercase tracking-[0.24em] ${isLightTheme ? "text-neutral-400" : "text-white/42"}`}>
                {product.badge}
              </p>
            ) : null}
            <h2 className={`text-[0.95rem] font-semibold transition sm:text-base ${
              isLightTheme ? "text-neutral-950 group-hover:underline" : "text-white group-hover:underline"
            }`}>
              {product.title || "Untitled product"}
            </h2>
            {resolvedPriceLabel ? (
              <p className={`text-[0.72rem] font-medium uppercase tracking-[0.16em] sm:text-xs ${isLightTheme ? "text-neutral-500" : "text-white/68"}`}>
                {resolvedPriceLabel}
              </p>
            ) : null}
          </div>
          {product.summary ? (
            <p className={`text-xs leading-5 sm:text-sm ${isLightTheme ? "text-neutral-600" : "text-white/62"}`}>{product.summary}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export function ShopPageView({
  page,
  products,
  shopLocked = false,
  theme = "brand",
}: {
  page: CmsPage;
  products: CmsProduct[];
  shopLocked?: boolean;
  theme?: "brand" | "light";
}) {
  const isLightTheme = theme === "light";
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    audience: [],
    type: [],
    size: [],
    color: [],
  });

  const filterOptions = useMemo(() => {
    const audience = Array.from(
      new Set(products.flatMap((product) => product.audienceTags || []))
    ).sort();
    const type = Array.from(
      new Set(products.map((product) => product.productType).filter(Boolean))
    ).sort() as string[];
    const size = Array.from(
      new Set(products.flatMap((product) => product.availableSizes || []))
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const color = Array.from(
      new Set(products.flatMap((product) => product.availableColors || []))
    ).sort();

    return { audience, type, size, color };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesAudience =
        filters.audience.length === 0 ||
        filters.audience.some((value) => (product.audienceTags || []).includes(value));
      const matchesType =
        filters.type.length === 0 ||
        filters.type.includes(product.productType || "");
      const matchesSize =
        filters.size.length === 0 ||
        filters.size.some((value) => (product.availableSizes || []).includes(value));
      const matchesColor =
        filters.color.length === 0 ||
        filters.color.some((value) => (product.availableColors || []).includes(value));

      return matchesAudience && matchesType && matchesSize && matchesColor;
    });
  }, [filters, products]);

  const activeFilterCount =
    filters.audience.length + filters.type.length + filters.size.length + filters.color.length;

  return (
    <main className={`relative isolate ${isLightTheme ? "bg-black text-neutral-950" : "bg-black text-white"}`}>
      {isLightTheme ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-white" /> : null}

      <div className="relative z-10">
        <PageBanner
          title={page.title?.toUpperCase() || "SHOP"}
          intro={page.tagline}
          imageSrc={imageUrl(page.bannerImage, 2200)}
        />

        <section className="px-6 py-10 sm:py-12">
          <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="hidden lg:block">
              <FilterSidebar
                activeFilterCount={activeFilterCount}
                theme={theme}
                filterOptions={filterOptions}
                filters={filters}
                setFilters={setFilters}
              />
            </div>

            <section className="space-y-5">
              {shopLocked ? (
                <div
                  className={`border px-5 py-4 text-sm leading-6 ${
                    isLightTheme ? "border-black bg-neutral-50 text-neutral-700" : "border-white/12 bg-white/[0.04] text-white/74"
                  }`}
                >
                  Ordering is currently locked. Customers can browse the shop, but checkout is turned off.
                </div>
              ) : null}
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-2">
                  <p className={`text-xs font-medium uppercase tracking-[0.22em] ${isLightTheme ? "text-neutral-500" : "text-white/45"}`}>Products</p>
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsMobileFiltersOpen(true)}
                    className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition lg:hidden ${
                      isLightTheme
                        ? "border-neutral-300 bg-white text-neutral-700 hover:border-black hover:text-black"
                        : "border-white/14 bg-white/[0.04] text-white/72 hover:border-white/24 hover:text-white"
                    }`}
                  >
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </button>
                </div>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ShopProductCard key={product._id || product.slug || product.title} product={product} theme={theme} />
                  ))}
                </div>
              ) : (
                <div
                  className={`rounded-lg border border-dashed p-6 text-sm ${
                    isLightTheme
                      ? "border-neutral-300 bg-neutral-50 text-neutral-600"
                      : "border-white/12 bg-white/[0.02] text-white/65"
                  }`}
                >
                  No products match the selected filters.
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      {isMobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setIsMobileFiltersOpen(false)}
            className={`absolute inset-0 backdrop-blur-sm ${isLightTheme ? "bg-slate-950/32" : "bg-slate-950/72"}`}
          />
          <div
            className={`absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto border-l px-6 py-6 shadow-2xl ${
              isLightTheme ? "border-black bg-white" : "border-white/10 bg-slate-950"
            }`}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "text-black/55" : "text-white/45"}`}>Filters</p>
                <p className={`text-sm ${isLightTheme ? "text-black/70" : "text-white/58"}`}>
                  {activeFilterCount} selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  isLightTheme
                    ? "border-black text-black hover:bg-black hover:text-white"
                    : "border-white/14 text-white/72 hover:border-white/24 hover:text-white"
                }`}
              >
                Close
              </button>
            </div>

            <FilterSidebar
              activeFilterCount={activeFilterCount}
              showHeader={false}
              theme={theme}
              filterOptions={filterOptions}
              filters={filters}
              setFilters={setFilters}
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    audience: [],
                    type: [],
                    size: [],
                    color: [],
                  })
                }
                className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  isLightTheme
                    ? "border-black text-black hover:bg-black hover:text-white"
                    : "border-white/14 text-white/62 hover:border-white/24 hover:text-white"
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  isLightTheme
                    ? "bg-black text-white hover:bg-black/85"
                    : "bg-white text-slate-950 hover:bg-white/90"
                }`}
              >
                View Products
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
