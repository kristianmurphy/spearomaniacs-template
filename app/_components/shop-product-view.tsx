"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/app/_components/cart-provider";
import {
  getFirstPurchasableVariant,
  getProductVariants,
  getPurchasableColors,
  getPurchasableSizes,
  getSelectableColors,
  getSelectableSizes,
  getStorefrontGalleryImages,
  getVariantBySelection,
  getPreferredProductPreviewImage,
  isAvailabilityPurchasable,
} from "@/lib/product-variants";
import type { CmsProduct } from "@/lib/site.data";
import { imageUrl } from "@/lib/sanity.image";

type ProductImageOption = {
  src: string;
  alt: string;
  label: string;
};

function ProductOptionGroup({
  label,
  options,
  selected,
  onSelect,
  disabledOptions,
  theme = "brand",
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  disabledOptions?: Set<string>;
  theme?: "brand" | "light";
}) {
  if (options.length === 0) {
    return null;
  }

  const isLightTheme = theme === "light";

  return (
    <section className="space-y-3">
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "text-black/55" : "text-white/45"}`}>{label}</p>
      <div className="flex flex-wrap gap-2.5">
        {options.map((option) => {
          const isSelected = selected === option;
          const isDisabled = disabledOptions?.has(option) ?? false;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              disabled={isDisabled}
              className={`border px-4 py-2 text-sm font-medium uppercase tracking-[0.12em] transition ${
                isSelected
                  ? isLightTheme
                    ? "border-black bg-black text-white"
                    : "border-white bg-white text-slate-950"
                  : isLightTheme
                    ? "border-black bg-white text-black hover:bg-black hover:text-white"
                    : "border-white/14 bg-white/[0.03] text-white/74 hover:border-white/24 hover:text-white"
              } ${isDisabled ? "cursor-not-allowed opacity-35 hover:bg-inherit hover:text-inherit" : ""}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function buildProductImages(product: CmsProduct, selectedSize?: string, selectedColor?: string, selectedVariantId?: string) {
  const images: ProductImageOption[] = [];
  const seen = new Set<string>();
  const pushImage = (src?: string | null, label?: string) => {
    if (!src || seen.has(src)) {
      return;
    }

    seen.add(src);
    images.push({
      src,
      alt: product.title || "Product",
      label: label || product.title || "Product image",
    });
  };

  const storefrontGallery = getStorefrontGalleryImages(product);

  for (const image of storefrontGallery) {
    pushImage(image.src, image.label);
  }

  pushImage(getPreferredProductPreviewImage(product, {
    preferredSize: selectedSize || "L",
    preferredColor: selectedColor || undefined,
  }), selectedColor && selectedSize ? `${selectedColor} ${selectedSize}` : "Printful");

  return images;
}

export function ShopProductView({
  product,
  theme = "brand",
}: {
  product: CmsProduct;
  theme?: "brand" | "light";
}) {
  const { addItem, shopLocked } = useCart();
  const isLightTheme = theme === "light";
  const priceLabel = product.priceLabel || product.printfulPriceLabel;
  const variants = useMemo(() => getProductVariants(product), [product]);
  const defaultVariant = useMemo(() => getFirstPurchasableVariant(product), [product]);
  const fallbackSizes = product.availableSizes || [];
  const fallbackColors = product.availableColors || [];
  const [selectedSize, setSelectedSize] = useState(defaultVariant?.size || fallbackSizes[0] || "");
  const [selectedColor, setSelectedColor] = useState(defaultVariant?.color || fallbackColors[0] || "");
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState<string>("");

  const selectedVariant = getVariantBySelection(product, selectedSize, selectedColor);
  const allSizes = variants.length > 0 ? Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean))) : fallbackSizes;
  const allColors = variants.length > 0 ? Array.from(new Set(variants.map((variant) => variant.color).filter(Boolean))) : fallbackColors;
  const selectableSizes = new Set(getSelectableSizes(product, selectedColor || undefined));
  const selectableColors = new Set(getSelectableColors(product, selectedSize || undefined));
  const purchasableSizes = new Set(getPurchasableSizes(product, selectedColor || undefined));
  const purchasableColors = new Set(getPurchasableColors(product, selectedSize || undefined));
  const disabledSizes = new Set(
    allSizes.filter((size) => !selectableSizes.has(size) || !purchasableSizes.has(size))
  );
  const disabledColors = new Set(
    allColors.filter((color) => !selectableColors.has(color) || !purchasableColors.has(color))
  );
  const galleryImages = useMemo(
    () => buildProductImages(product, selectedSize, selectedColor, selectedVariant?.syncVariantId),
    [product, selectedColor, selectedSize, selectedVariant?.syncVariantId]
  );
  const resolvedActiveImage = galleryImages.find((image) => image.src === activeImageSrc)?.src || galleryImages[0]?.src || null;
  const canAddToCart =
    !shopLocked &&
    !isCheckingAvailability &&
    (variants.length === 0 ||
      (Boolean(selectedVariant) && isAvailabilityPurchasable(selectedVariant?.availabilityStatus)));

  useEffect(() => {
    const nextPrimaryImage = galleryImages[0]?.src || "";

    if (!nextPrimaryImage) {
      return;
    }

    setActiveImageSrc((current) => (current === nextPrimaryImage ? current : nextPrimaryImage));
  }, [galleryImages]);

  const selectSize = (nextSize: string) => {
    if (disabledSizes.has(nextSize)) {
      return;
    }

    setSelectedSize(nextSize);
    setCartError(null);

    const exactVariant = getVariantBySelection(product, nextSize, selectedColor);

    if (exactVariant && isAvailabilityPurchasable(exactVariant.availabilityStatus)) {
      return;
    }

    const fallbackColor =
      getPurchasableColors(product, nextSize)[0] ||
      getSelectableColors(product, nextSize)[0] ||
      "";

    if (fallbackColor) {
      setSelectedColor(fallbackColor);
    }
  };

  const selectColor = (nextColor: string) => {
    if (disabledColors.has(nextColor)) {
      return;
    }

    setSelectedColor(nextColor);
    setCartError(null);

    const exactVariant = getVariantBySelection(product, selectedSize, nextColor);

    if (exactVariant && isAvailabilityPurchasable(exactVariant.availabilityStatus)) {
      return;
    }

    const fallbackSize =
      getPurchasableSizes(product, nextColor)[0] ||
      getSelectableSizes(product, nextColor)[0] ||
      "";

    if (fallbackSize) {
      setSelectedSize(fallbackSize);
    }
  };

  const addToCart = async () => {
    if (shopLocked || isCheckingAvailability) {
      return;
    }

    setCartError(null);

    if (variants.length > 0) {
      if (!selectedVariant) {
        setCartError("That size and color combination is not available.");
        return;
      }

      setIsCheckingAvailability(true);

      try {
        const response = await fetch("/api/printful/variant-availability", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ syncVariantId: selectedVariant.syncVariantId }),
        });
        const payload = (await response.json()) as { available?: boolean; error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Availability could not be confirmed.");
        }

        if (!payload.available) {
          throw new Error("That variant is currently unavailable.");
        }
      } catch (error) {
        setCartError(error instanceof Error ? error.message : "Availability could not be confirmed.");
        setIsCheckingAvailability(false);
        return;
      }

      setIsCheckingAvailability(false);
    }

    const variantParts = [selectedSize, selectedColor].filter(Boolean);
    const variantId = selectedVariant?.syncVariantId || (variantParts.length > 0 ? variantParts.join("--") : "default");

    addItem({
      id: `${product.slug || product.title}-${variantId}`,
      slug: product.slug || "shop",
      title: product.title || "Untitled product",
      imageSrc: resolvedActiveImage,
      priceLabel,
      syncVariantId: selectedVariant?.syncVariantId,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      quantity: 1,
    });

    setRecentlyAdded(true);
    window.setTimeout(() => setRecentlyAdded(false), 1800);
  };

  return (
    <main className={`px-6 pb-16 pt-28 sm:pt-36 ${isLightTheme ? "bg-white text-black" : "bg-slate-950 text-white"}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] ${isLightTheme ? "text-black/55" : "text-white/42"}`}>
          <Link href="/shop" className={`transition ${isLightTheme ? "hover:text-black" : "hover:text-white"}`}>
            Shop
          </Link>
          <span>/</span>
          <span className={isLightTheme ? "text-black/72" : "text-white/68"}>{product.title || "Product"}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:gap-12">
          <div className="space-y-4">
            <div
              className={`overflow-hidden border ${
                isLightTheme ? "border-black bg-white" : "border-white/10 bg-white"
              }`}
            >
              <div className="relative aspect-[4/5] bg-white">
                {resolvedActiveImage ? (
                  <Image
                    src={resolvedActiveImage}
                    alt={product.title || "Product"}
                    fill
                    unoptimized
                    className="object-contain p-4"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_40%),linear-gradient(135deg,_#1e293b,_#020617)]" />
                )}
              </div>
            </div>

            {galleryImages.length > 1 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {galleryImages.map((image) => {
                  const isSelected = image.src === resolvedActiveImage;

                  return (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setActiveImageSrc(image.src)}
                      className={`relative aspect-square overflow-hidden border transition ${
                        isSelected
                          ? isLightTheme
                            ? "border-black"
                            : "border-white"
                          : isLightTheme
                            ? "border-black/15 hover:border-black/45"
                            : "border-white/10 hover:border-white/28"
                      }`}
                      aria-label={`Show ${image.label}`}
                    >
                      <Image src={image.src} alt={image.alt} fill unoptimized className="object-contain p-1.5" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <article
            className={`flex min-h-full flex-col gap-6 border p-6 sm:p-8 ${
              isLightTheme ? "border-black bg-white" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <header className={`space-y-4 border-b pb-6 ${isLightTheme ? "border-black/15" : "border-white/10"}`}>
              <div className="space-y-2">
                {product.badge ? (
                  <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${isLightTheme ? "text-black/45" : "text-white/42"}`}>
                    {product.badge}
                  </p>
                ) : null}
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {product.title || "Untitled product"}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {priceLabel ? (
                  <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${isLightTheme ? "text-black/65" : "text-white/72"}`}>
                    {priceLabel}
                  </p>
                ) : null}
                {product.productType ? (
                  <p
                    className={`border px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.2em] ${
                      isLightTheme
                        ? "border-black bg-white text-black/60"
                        : "border-white/10 bg-white/[0.04] text-white/54"
                    }`}
                  >
                    {product.productType}
                  </p>
                ) : null}
                {selectedVariant?.availabilityStatus && !isAvailabilityPurchasable(selectedVariant.availabilityStatus) ? (
                  <p className={`text-[0.68rem] font-medium uppercase tracking-[0.2em] ${isLightTheme ? "text-red-700" : "text-red-300"}`}>
                    {selectedVariant.availabilityStatus.replace(/_/g, " ")}
                  </p>
                ) : null}
              </div>

              {product.summary ? (
                <p className={`max-w-xl text-sm leading-6 sm:text-base ${isLightTheme ? "text-black/68" : "text-white/68"}`}>
                  {product.summary}
                </p>
              ) : null}
            </header>

            <div className="space-y-6">
              <ProductOptionGroup
                label="Size"
                options={allSizes}
                selected={selectedSize}
                onSelect={selectSize}
                disabledOptions={disabledSizes}
                theme={theme}
              />
              <ProductOptionGroup
                label="Color"
                options={allColors}
                selected={selectedColor}
                onSelect={selectColor}
                disabledOptions={disabledColors}
                theme={theme}
              />
            </div>

            <div className={`mt-auto space-y-4 border-t pt-6 ${isLightTheme ? "border-black/15" : "border-white/10"}`}>
              <button
                type="button"
                onClick={addToCart}
                disabled={!canAddToCart}
                className={`inline-flex w-full items-center justify-center border px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition ${
                  isLightTheme
                    ? "border-black bg-black text-white hover:bg-white hover:text-black disabled:border-black/25 disabled:bg-black/15 disabled:text-black/40"
                    : "bg-white text-slate-950 hover:bg-white/92 disabled:bg-white/30 disabled:text-slate-700"
                }`}
              >
                {shopLocked ? "Ordering Locked" : isCheckingAvailability ? "Checking Availability..." : "Add To Cart"}
              </button>
              {shopLocked ? (
                <p className={`text-sm ${isLightTheme ? "text-black/58" : "text-white/54"}`}>
                  Ordering is currently unavailable, but you can still browse the shop.
                </p>
              ) : null}
              {cartError ? (
                <p className={`text-sm ${isLightTheme ? "text-red-700" : "text-red-300"}`}>{cartError}</p>
              ) : null}
              {!cartError && variants.length > 0 && !selectedVariant ? (
                <p className={`text-sm ${isLightTheme ? "text-black/58" : "text-white/54"}`}>
                  Pick a size and color combination that is currently available.
                </p>
              ) : null}
              {recentlyAdded ? (
                <p className={`text-sm ${isLightTheme ? "text-black/58" : "text-white/54"}`}>Added to cart.</p>
              ) : null}
              <div
                className={`space-y-3 border-t pt-4 text-sm leading-6 ${
                  isLightTheme ? "border-black/15 text-black/68" : "border-white/10 text-white/64"
                }`}
              >
                <p>
                  Because each item is custom made to order, returns are not accepted once a product
                  has been approved for production, including for incorrect size, colour, or
                  quantity choices.
                </p>
                <p>
                  If your item arrives misprinted, damaged, or defective,{" "}
                  <Link href="/explore#contact" className={`underline underline-offset-4 ${isLightTheme ? "hover:text-black" : "hover:text-white"}`}>
                    contact us
                  </Link>{" "}
                  with clear photo evidence and we&apos;ll do our best to get you sorted out.
                  Thank you.
                </p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
