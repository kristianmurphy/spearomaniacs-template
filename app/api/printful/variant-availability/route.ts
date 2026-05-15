import { NextResponse } from "next/server";
import { fetchPrintfulSyncVariant } from "@/lib/printful";
import { isAvailabilityPurchasable } from "@/lib/product-variants";

export async function POST(request: Request) {
  let payload: { syncVariantId?: string | number } = {};

  try {
    payload = (await request.json()) as { syncVariantId?: string | number };
  } catch {
    return NextResponse.json({ error: "Invalid availability payload." }, { status: 400 });
  }

  const syncVariantId = Number(payload.syncVariantId);

  if (!Number.isInteger(syncVariantId) || syncVariantId <= 0) {
    return NextResponse.json({ error: "A valid syncVariantId is required." }, { status: 400 });
  }

  try {
    const variant = await fetchPrintfulSyncVariant(syncVariantId);

    return NextResponse.json({
      syncVariantId: variant.syncVariantId,
      availabilityStatus: variant.availabilityStatus,
      available: isAvailabilityPurchasable(variant.availabilityStatus),
      size: variant.size,
      color: variant.color,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Availability check failed.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
