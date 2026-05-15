import type { CartItem } from "@/app/_components/cart-provider";

export type CheckoutLineItem = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  syncVariantId?: string;
  size?: string;
  color?: string;
  quantity: number;
  unitAmount: number;
  currency: string;
};

function parseCurrency(value?: string) {
  const match = value?.match(/\b([A-Z]{3})\b/);
  return (match?.[1] || process.env.SHOP_CURRENCY_CODE || "AUD").toLowerCase();
}

function parseUnitAmountFromLabel(label?: string) {
  if (!label) {
    return null;
  }

  const amountMatch = label.match(/([0-9]+(?:\.[0-9]{1,2})?)/);

  if (!amountMatch) {
    return null;
  }

  const amount = Number.parseFloat(amountMatch[1]);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

export function cartItemsToCheckoutLineItems(items: CartItem[]): CheckoutLineItem[] {
  return items.flatMap((item) => {
    const unitAmount = parseUnitAmountFromLabel(item.priceLabel);

    if (!unitAmount) {
      return [];
    }

    const detailParts = [item.size ? `Size ${item.size}` : null, item.color ? `Color ${item.color}` : null].filter(Boolean);

    return [
      {
        id: item.id,
        slug: item.slug,
        title: item.title,
        description: detailParts.length > 0 ? detailParts.join(" • ") : undefined,
        imageUrl: item.imageSrc || undefined,
        syncVariantId: item.syncVariantId || undefined,
        size: item.size || undefined,
        color: item.color || undefined,
        quantity: item.quantity,
        unitAmount,
        currency: parseCurrency(item.priceLabel),
      },
    ];
  });
}
