import type { CmsProduct } from "@/lib/site.data";
import { imageUrl } from "@/lib/sanity.image";

export type ProductVariantRecord = {
  syncVariantId: string;
  externalId: string;
  name: string;
  catalogVariantId: string;
  retailPrice: string;
  currency: string;
  sku: string;
  size: string;
  color: string;
  availabilityStatus: string;
};

export function isAvailabilityPurchasable(status?: string) {
  return (status || "").trim().toLowerCase() === "active";
}

export function getProductVariants(product: CmsProduct) {
  return (product.printfulVariants || [])
    .map(
      (variant) =>
        ({
          syncVariantId: variant.syncVariantId || "",
          externalId: variant.externalId || "",
          name: variant.name || "",
          catalogVariantId: variant.catalogVariantId || "",
          retailPrice: variant.retailPrice || "",
          currency: variant.currency || "",
          sku: variant.sku || "",
          size: variant.size || "",
          color: variant.color || "",
          availabilityStatus: (variant.availabilityStatus || "").trim().toLowerCase(),
        }) satisfies ProductVariantRecord
    )
    .filter((variant) => Boolean(variant.syncVariantId));
}

export function getFirstPurchasableVariant(product: CmsProduct) {
  const variants = getProductVariants(product);

  return variants.find((variant) => isAvailabilityPurchasable(variant.availabilityStatus)) || variants[0] || null;
}

export function getVariantBySelection(product: CmsProduct, size: string, color: string) {
  return (
    getProductVariants(product).find(
      (variant) => variant.size === size && variant.color === color
    ) || null
  );
}

export function getSelectableSizes(product: CmsProduct, color?: string) {
  const variants = getProductVariants(product);
  const matches = color ? variants.filter((variant) => variant.color === color) : variants;

  return Array.from(new Set(matches.map((variant) => variant.size).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

export function getSelectableColors(product: CmsProduct, size?: string) {
  const variants = getProductVariants(product);
  const matches = size ? variants.filter((variant) => variant.size === size) : variants;

  return Array.from(new Set(matches.map((variant) => variant.color).filter(Boolean))).sort();
}

export function getPurchasableSizes(product: CmsProduct, color?: string) {
  const variants = getProductVariants(product);
  const matches = variants.filter(
    (variant) =>
      isAvailabilityPurchasable(variant.availabilityStatus) && (!color || variant.color === color)
  );

  return Array.from(new Set(matches.map((variant) => variant.size).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
}

export function getPurchasableColors(product: CmsProduct, size?: string) {
  const variants = getProductVariants(product);
  const matches = variants.filter(
    (variant) =>
      isAvailabilityPurchasable(variant.availabilityStatus) && (!size || variant.size === size)
  );

  return Array.from(new Set(matches.map((variant) => variant.color).filter(Boolean))).sort();
}

function getMockupTypeRank(type?: string) {
  const normalized = (type || "").trim().toLowerCase();

  if (normalized === "mockup") {
    return 0;
  }

  if (normalized === "front_large") {
    return 1;
  }

  if (normalized === "front") {
    return 2;
  }

  if (normalized.includes("front")) {
    return 3;
  }

  if (normalized === "preview") {
    return 4;
  }

  if (normalized.includes("preview")) {
    return 5;
  }

  if (normalized.includes("back")) {
    return 8;
  }

  return 6;
}

function normalizeOptionValue(value?: string) {
  return (value || "").trim().toLowerCase();
}

type ManualMockupImage = {
  src: string;
  label: string;
};

function toManualMockupImage(
  item?: {
    image?: CmsProduct["image"];
    label?: string;
  },
  fallbackLabel?: string
) {
  const src = imageUrl(item?.image, 1600);

  if (!src) {
    return null;
  }

  return {
    src,
    label: item?.label || fallbackLabel || "Mockup",
  } satisfies ManualMockupImage;
}

export function getManualMockupImages(product: CmsProduct, color?: string) {
  const normalizedColor = normalizeOptionValue(color);
  const colorSpecific =
    product.colorMockupGroups?.find(
      (group) => normalizeOptionValue(group.color) === normalizedColor
    )?.images || [];

  return colorSpecific
    .map((item) => toManualMockupImage(item, color ? `${color} mockup` : "Color mockup"))
    .filter((item): item is ManualMockupImage => Boolean(item));
}

export function getAdditionalMockupImages(product: CmsProduct) {
  return (product.additionalMockupImages || [])
    .map((item) => toManualMockupImage(item, "Additional mockup"))
    .filter((item): item is ManualMockupImage => Boolean(item));
}

export function getStorefrontGalleryImages(product: CmsProduct) {
  const orderedGallery = (product.storefrontMockupGallery || [])
    .map((item) => toManualMockupImage(item, "Storefront image"))
    .filter((item): item is ManualMockupImage => Boolean(item));

  if (orderedGallery.length > 0) {
    return orderedGallery;
  }

  const legacyGallery: ManualMockupImage[] = [];
  const seen = new Set<string>();
  const pushImage = (image: ManualMockupImage | null) => {
    if (!image || seen.has(image.src)) {
      return;
    }

    seen.add(image.src);
    legacyGallery.push(image);
  };

  pushImage(toManualMockupImage({ image: product.image }, "Primary"));
  pushImage(toManualMockupImage({ image: product.hoverImage }, "Hover"));

  for (const image of getAdditionalMockupImages(product)) {
    pushImage(image);
  }

  return legacyGallery;
}

function getVariantSyncIds(product: CmsProduct, size?: string, color?: string) {
  return getProductVariants(product)
    .filter(
      (variant) =>
        (!size || variant.size === size) &&
        (!color || variant.color === color)
    )
    .map((variant) => variant.syncVariantId);
}

function getSortedMockupsForSelection(product: CmsProduct, size?: string, color?: string) {
  const syncVariantIds = new Set(getVariantSyncIds(product, size, color));

  return (product.printfulMockups || [])
    .filter((mockup) => {
      const linkedIds = mockup.syncVariantIds || [];

      if (syncVariantIds.size === 0) {
        return true;
      }

      return linkedIds.some((id) => syncVariantIds.has(id));
    })
    .filter((mockup): mockup is NonNullable<typeof mockup> & { url: string } => Boolean(mockup.url));
}

export function getMockupUrlsForSelection(product: CmsProduct, size?: string, color?: string) {
  return getSortedMockupsForSelection(product, size, color)
    .sort((left, right) => {
      const leftRank = getMockupTypeRank(left.type);
      const rightRank = getMockupTypeRank(right.type);

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      if ((left.isVisible || false) !== (right.isVisible || false)) {
        return left.isVisible ? -1 : 1;
      }

      return (left.label || left.url || "").localeCompare(right.label || right.url || "");
    })
    .map((mockup) => mockup.url);
}

export function getOrderedMockupUrlsForSelection(product: CmsProduct, size?: string, color?: string) {
  const selectedUrls = getMockupUrlsForSelection(product, size, color);
  const selectedUrlSet = new Set(selectedUrls);
  const remainingUrls = (product.printfulMockups || [])
    .flatMap((mockup) => {
      const url = mockup.url;

      if (!url || selectedUrlSet.has(url)) {
        return [];
      }

      return [url];
    });

  return [...selectedUrls, ...remainingUrls];
}

export function getPreferredProductPreviewImage(
  product: CmsProduct,
  options?: {
    preferredSize?: string;
    preferredColor?: string;
  }
) {
  const storefrontGallery = getStorefrontGalleryImages(product);

  if (storefrontGallery[0]?.src) {
    return storefrontGallery[0].src;
  }

  if (product.printfulThumbnailUrl) {
    return product.printfulThumbnailUrl;
  }

  const preferredSize = options?.preferredSize || "L";
  const preferredColor = options?.preferredColor;
  const sizeSpecific = getMockupUrlsForSelection(product, preferredSize, preferredColor);

  if (sizeSpecific[0]) {
    return sizeSpecific[0];
  }

  const firstPurchasableVariant = getFirstPurchasableVariant(product);

  if (firstPurchasableVariant) {
    const firstVariantMockup = getMockupUrlsForSelection(
      product,
      firstPurchasableVariant.size,
      firstPurchasableVariant.color
    )[0];

    if (firstVariantMockup) {
      return firstVariantMockup;
    }
  }

  return (
    (product.printfulMockups || []).find((mockup) => mockup.url)?.url ||
    product.printfulThumbnailUrl ||
    null
  );
}

export function getPreferredHoverPreviewImage(
  product: CmsProduct,
  options?: {
    preferredSize?: string;
    preferredColor?: string;
  }
) {
  const storefrontGallery = getStorefrontGalleryImages(product);

  if (storefrontGallery[1]?.src) {
    return storefrontGallery[1].src;
  }

  return null;
}
