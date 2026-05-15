type PrintfulSyncProduct = {
  id: number;
  external_id?: string | null;
  name?: string | null;
  thumbnail_url?: string | null;
  variants?: number;
  synced?: number;
};

type PrintfulSyncVariantFile = {
  type?: string | null;
  preview_url?: string | null;
  thumbnail_url?: string | null;
  visible?: boolean | null;
};

type PrintfulSyncVariant = {
  id: number;
  external_id?: string | null;
  name?: string | null;
  synced?: boolean;
  variant_id?: number | null;
  retail_price?: string | null;
  currency?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  availability_status?: string | null;
  product?: {
    image?: string | null;
  } | null;
  files?: PrintfulSyncVariantFile[];
};

type PrintfulProductDetails = {
  sync_product?: PrintfulSyncProduct;
  sync_variants?: PrintfulSyncVariant[];
};

type PrintfulListResponse = {
  result?: PrintfulSyncProduct[];
  paging?: {
    total?: number;
    offset?: number;
    limit?: number;
  };
};

type PrintfulDetailResponse = {
  result?: PrintfulProductDetails;
};

type PrintfulOrder = {
  id?: number | null;
  external_id?: string | null;
  status?: string | null;
};

const PRINTFUL_API_BASE = "https://api.printful.com";

export type ImportedPrintfulVariant = {
  syncVariantId: number;
  externalId: string;
  name: string;
  catalogVariantId: number | null;
  retailPrice: string;
  currency: string;
  sku: string;
  size: string;
  color: string;
  availabilityStatus: string;
};

export type ImportedPrintfulMockup = {
  url: string;
  thumbnailUrl: string;
  type: string;
  label: string;
  isVisible: boolean;
  syncVariantIds: number[];
};

export type ImportedPrintfulProduct = {
  id: number;
  externalId: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  baseImageUrl: string;
  variantCount: number;
  priceLabel: string;
  productType: string;
  audienceTags: string[];
  availableSizes: string[];
  availableColors: string[];
  variants: ImportedPrintfulVariant[];
  mockups: ImportedPrintfulMockup[];
};

export type PrintfulOrderSubmissionInput = {
  externalId: string;
  shipping?: string;
  recipient: {
    name: string;
    email?: string;
    phone?: string;
    address1: string;
    address2?: string;
    city: string;
    stateCode?: string;
    countryCode: string;
    zip: string;
  };
  items: Array<{
    syncVariantId: number;
    quantity: number;
    retailPrice?: string;
    externalId?: string;
    name?: string;
  }>;
};

export type SubmittedPrintfulOrder = {
  id: string;
  externalId: string;
  status: string;
};

function getPrintfulToken() {
  return process.env.PRINTFUL_API_TOKEN ?? "";
}

function getShopCurrencyCode() {
  return (process.env.SHOP_CURRENCY_CODE ?? "AUD").toUpperCase();
}

async function printfulFetch<T>(path: string) {
  return printfulRequest<T>(path);
}

async function printfulRequest<T>(
  path: string,
  init?: {
    method?: "GET" | "POST";
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }
) {
  const token = getPrintfulToken();

  if (!token) {
    throw new Error("Missing PRINTFUL_API_TOKEN.");
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(init?.query || {})) {
    if (value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const response = await fetch(`${PRINTFUL_API_BASE}${path}${searchParams.size ? `?${searchParams.toString()}` : ""}`, {
    method: init?.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Printful request failed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as T;
}

function collectUnique(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );
}

function collectUniqueNumbers(values: number[]) {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value))));
}

function deriveProductType(title: string, variantNames: string[]) {
  const haystack = `${title} ${variantNames.join(" ")}`.toLowerCase();

  if (haystack.includes("tee") || haystack.includes("t-shirt") || haystack.includes("shirt")) {
    return "Tee";
  }
  if (haystack.includes("hoodie")) {
    return "Hoodie";
  }
  if (haystack.includes("tank")) {
    return "Tank";
  }
  if (haystack.includes("hat") || haystack.includes("cap")) {
    return "Hat";
  }
  if (haystack.includes("sticker")) {
    return "Sticker";
  }
  if (haystack.includes("poster")) {
    return "Poster";
  }

  return "Other";
}

function deriveAudienceTags(title: string, variantNames: string[]) {
  const haystack = `${title} ${variantNames.join(" ")}`.toLowerCase();
  const tags: string[] = [];

  if (haystack.includes("women") || haystack.includes("female") || haystack.includes("ladies")) {
    tags.push("Female");
  }
  if (haystack.includes("men") || haystack.includes("male")) {
    tags.push("Male");
  }
  if (haystack.includes("unisex")) {
    tags.push("Unisex");
  }
  if (haystack.includes("youth") || haystack.includes("kids")) {
    tags.push("Kids");
  }

  return tags;
}

function formatPriceLabel(variants: PrintfulSyncVariant[]) {
  const prices = variants
    .map((variant) => Number(String(variant.retail_price ?? "").replace(/[^0-9.-]/g, "")))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) {
    return "";
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const currencyCode =
    variants
      .map((variant) => variant.currency?.trim().toUpperCase())
      .find(Boolean) || getShopCurrencyCode();
  const formatAmount = (amount: number) => `$${amount.toFixed(2)} ${currencyCode}`;

  if (min === max) {
    return formatAmount(min);
  }

  return `From ${formatAmount(min)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function buildMockupLabel(type: string) {
  return type
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeAvailabilityStatus(value?: string | null) {
  const normalized = value?.trim().toLowerCase();

  return normalized || "unknown";
}

function mapImportedVariant(variant: PrintfulSyncVariant): ImportedPrintfulVariant {
  return {
    syncVariantId: variant.id,
    externalId: variant.external_id?.trim() || `printful-sync-variant-${variant.id}`,
    name: variant.name?.trim() || `Printful Variant ${variant.id}`,
    catalogVariantId: variant.variant_id ?? null,
    retailPrice: variant.retail_price?.trim() || "",
    currency: variant.currency?.trim().toUpperCase() || getShopCurrencyCode(),
    sku: variant.sku?.trim() || "",
    size: variant.size?.trim() || "",
    color: variant.color?.trim() || "",
    availabilityStatus: normalizeAvailabilityStatus(variant.availability_status),
  };
}

function collectMockups(syncVariants: PrintfulSyncVariant[]) {
  const mockups = new Map<string, ImportedPrintfulMockup>();

  for (const variant of syncVariants) {
    for (const file of variant.files ?? []) {
      const url = file.preview_url?.trim();

      if (!url) {
        continue;
      }

      const existing = mockups.get(url);

      if (existing) {
        existing.syncVariantIds = collectUniqueNumbers([
          ...existing.syncVariantIds,
          variant.id,
        ]);
        continue;
      }

      const type = file.type?.trim() || "preview";

      mockups.set(url, {
        url,
        thumbnailUrl: file.thumbnail_url?.trim() || url,
        type,
        label: buildMockupLabel(type),
        isVisible: Boolean(file.visible),
        syncVariantIds: [variant.id],
      });
    }
  }

  return Array.from(mockups.values()).sort((left, right) => {
    if (left.isVisible !== right.isVisible) {
      return left.isVisible ? -1 : 1;
    }

    if (left.type === right.type) {
      return left.url.localeCompare(right.url);
    }

    if (left.type === "preview") {
      return -1;
    }

    if (right.type === "preview") {
      return 1;
    }

    return left.type.localeCompare(right.type);
  });
}

export async function fetchPrintfulProductsForImport() {
  const list = await printfulFetch<PrintfulListResponse>("/store/products");
  const products = list.result ?? [];

  const detailedProducts = await Promise.all(
    products.map(async (product) => {
      const detail = await printfulFetch<PrintfulDetailResponse>(`/store/products/${product.id}`);
      const syncProduct = detail.result?.sync_product ?? product;
      const syncVariants = detail.result?.sync_variants ?? [];
      const title = syncProduct.name?.trim() || `Printful Product ${product.id}`;
      const externalId =
        syncProduct.external_id?.trim() || `printful-sync-product-${product.id}`;
      const variantNames = collectUnique(syncVariants.map((variant) => variant.name));

      return {
        id: product.id,
        externalId,
        title,
        slug: slugify(title) || `product-${product.id}`,
        thumbnailUrl: syncProduct.thumbnail_url?.trim() || "",
        baseImageUrl:
          syncVariants
            .map((variant) => variant.product?.image?.trim())
            .find((url): url is string => Boolean(url)) || "",
        variantCount: syncVariants.length || product.variants || 0,
        priceLabel: formatPriceLabel(syncVariants),
        productType: deriveProductType(title, variantNames),
        audienceTags: deriveAudienceTags(title, variantNames),
        availableSizes: collectUnique(syncVariants.map((variant) => variant.size)),
        availableColors: collectUnique(syncVariants.map((variant) => variant.color)),
        variants: syncVariants.map(mapImportedVariant),
        mockups: collectMockups(syncVariants),
      } satisfies ImportedPrintfulProduct;
    })
  );

  return detailedProducts;
}

export async function fetchPrintfulSyncVariant(syncVariantId: number) {
  let response: { result?: PrintfulSyncVariant };

  try {
    response = await printfulFetch<{ result?: PrintfulSyncVariant }>(`/store/variants/${syncVariantId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("Printful request failed (404)")) {
      throw new Error(`Printful variant ${syncVariantId} is no longer available.`);
    }

    throw error;
  }

  if (!response.result) {
    throw new Error(`Printful variant ${syncVariantId} was not found.`);
  }

  return mapImportedVariant(response.result);
}

function formatRetailPrice(value?: string) {
  const amount = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));

  if (!Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return amount.toFixed(2);
}

export async function submitPrintfulOrder(input: PrintfulOrderSubmissionInput) {
  const response = await printfulRequest<{ result?: PrintfulOrder }>("/orders", {
    method: "POST",
    query: {
      confirm: true,
      update_existing: true,
    },
    body: {
      external_id: input.externalId,
      shipping: input.shipping || "STANDARD",
      recipient: {
        name: input.recipient.name,
        email: input.recipient.email,
        phone: input.recipient.phone,
        address1: input.recipient.address1,
        address2: input.recipient.address2,
        city: input.recipient.city,
        state_code: input.recipient.stateCode,
        country_code: input.recipient.countryCode,
        zip: input.recipient.zip,
      },
      items: input.items.map((item, index) => ({
        sync_variant_id: item.syncVariantId,
        quantity: item.quantity,
        retail_price: formatRetailPrice(item.retailPrice),
        external_id: item.externalId || `${input.externalId}-${index + 1}`,
        name: item.name,
      })),
    },
  });

  if (!response.result?.id) {
    throw new Error("Printful did not return an order ID.");
  }

  return {
    id: String(response.result.id),
    externalId: response.result.external_id?.trim() || input.externalId,
    status: response.result.status?.trim() || "unknown",
  } satisfies SubmittedPrintfulOrder;
}
