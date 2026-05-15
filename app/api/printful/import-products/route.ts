import { NextResponse } from "next/server";
import { fetchPrintfulProductsForImport } from "@/lib/printful";
import { hasSanityWriteAccess, sanityWriteClient } from "@/lib/sanity.write.client";

type ExistingProductDocument = {
  _id: string;
  title?: string;
  slug?: {
    current?: string;
  };
  isVisible?: boolean;
  printfulSyncProductId?: string;
  printfulExternalId?: string;
  printfulMockups?: Array<{
    url?: string;
  }>;
  lastImportedAt?: string;
  _updatedAt?: string;
};

function buildDocumentId(syncProductId: number) {
  return `product.printful.${syncProductId}`;
}

function buildKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}

function isAllowedOrigin(origin?: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isLocalhost =
      url.hostname === "localhost" || /^127(?:\.\d{1,3}){3}$/.test(url.hostname);

    return isHttp && isLocalhost;
  } catch {
    return false;
  }
}

function buildCorsHeaders(origin?: string | null) {
  const allowedOrigin = isAllowedOrigin(origin) && origin ? origin : "http://localhost:3333";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  } satisfies Record<string, string>;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(request.headers.get("origin")),
  });
}

export async function POST(request: Request) {
  const corsHeaders = buildCorsHeaders(request.headers.get("origin"));

  if (!process.env.PRINTFUL_API_TOKEN) {
    return NextResponse.json(
      { error: "Missing PRINTFUL_API_TOKEN in .env.local." },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!hasSanityWriteAccess() || !sanityWriteClient) {
    return NextResponse.json(
      {
        error:
          "Missing SANITY_API_WRITE_TOKEN in .env.local. Create a Sanity API token with write access before importing.",
      },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const importedAt = new Date().toISOString();
    const products = await fetchPrintfulProductsForImport();
    const existingProducts = await sanityWriteClient.fetch<ExistingProductDocument[]>(
      `*[_type == "product"]{
        _id,
        title,
        slug,
        isVisible,
        printfulSyncProductId,
        printfulExternalId,
        printfulMockups,
        lastImportedAt,
        _updatedAt
      }`
    );

    const transaction = sanityWriteClient.transaction();

    for (const product of products) {
      const documentId = buildDocumentId(product.id);
      const matchedProducts = existingProducts.filter((existingProduct) => {
        const existingSlug = existingProduct.slug?.current || "";

        return (
          existingProduct.printfulSyncProductId === String(product.id) ||
          existingProduct.printfulExternalId === product.externalId ||
          (Boolean(existingProduct.printfulSyncProductId) && existingSlug === product.slug)
        );
      });
      const primaryProduct =
        matchedProducts.find((existingProduct) => existingProduct.printfulSyncProductId === String(product.id)) ||
        matchedProducts.find((existingProduct) => existingProduct.printfulExternalId === product.externalId) ||
        [...matchedProducts].sort((left, right) => {
          const leftDate = Date.parse(left.lastImportedAt || left._updatedAt || "");
          const rightDate = Date.parse(right.lastImportedAt || right._updatedAt || "");

          return rightDate - leftDate;
        })[0];
      const resolvedDocumentId = primaryProduct?._id || documentId;
      const shouldImportMockups = !primaryProduct || (primaryProduct.printfulMockups?.length || 0) === 0;
      const importedMockups = product.mockups.map((mockup) => ({
        _key: buildKey(`${mockup.type}-${mockup.url}`),
        url: mockup.url,
        thumbnailUrl: mockup.thumbnailUrl,
        type: mockup.type,
        label: mockup.label,
        isVisible: mockup.isVisible,
        syncVariantIds: mockup.syncVariantIds.map(String),
      }));

      transaction.createIfNotExists({
        _id: resolvedDocumentId,
        _type: "product",
        isVisible: true,
        isFeatured: false,
        sortOrder: 10,
      });

      transaction.patch(resolvedDocumentId, {
        set: {
          title: product.title,
          slug: {
            _type: "slug",
            current: product.slug,
          },
          priceLabel: product.priceLabel,
          printfulSyncProductId: String(product.id),
          printfulExternalId: product.externalId,
          printfulThumbnailUrl: product.thumbnailUrl || "",
          printfulBaseImageUrl: product.baseImageUrl || "",
          printfulVariantCount: product.variantCount,
          printfulPriceLabel: product.priceLabel,
          productType: product.productType,
          audienceTags: product.audienceTags,
          availableSizes: product.availableSizes,
          availableColors: product.availableColors,
          printfulVariants: product.variants.map((variant) => ({
            _key: `variant-${variant.syncVariantId}`,
            syncVariantId: String(variant.syncVariantId),
            externalId: variant.externalId,
            name: variant.name,
            catalogVariantId:
              typeof variant.catalogVariantId === "number" ? String(variant.catalogVariantId) : "",
            retailPrice: variant.retailPrice,
            currency: variant.currency,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            availabilityStatus: variant.availabilityStatus,
          })),
          ...(shouldImportMockups ? { printfulMockups: importedMockups } : {}),
          lastImportedAt: importedAt,
        },
        setIfMissing: {
          isVisible: true,
          isFeatured: false,
          sortOrder: 10,
        },
      });

      for (const matchedProduct of matchedProducts) {
        if (matchedProduct._id === resolvedDocumentId) {
          continue;
        }

        transaction.patch(matchedProduct._id, {
          set: {
            isVisible: false,
          },
        });
      }
    }

    await transaction.commit();

    return NextResponse.json(
      {
        imported: products.length,
        products: products.map((product) => ({
          id: product.id,
          title: product.title,
          slug: product.slug,
        })),
      },
      {headers: corsHeaders}
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error."
    return NextResponse.json({error: message}, {status: 500, headers: corsHeaders})
  }
}
