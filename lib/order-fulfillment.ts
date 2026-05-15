import { buildPrintfulOrderExternalId, buildPrintfulOrderItemExternalId } from "@/lib/order-identifiers";
import { submitPrintfulOrder } from "@/lib/printful";
import { sanityWriteClient } from "@/lib/sanity.write.client";

type FulfillmentOrderItem = {
  _key?: string;
  title?: string;
  syncVariantId?: string;
  quantity?: number;
  unitAmount?: number;
};

type FulfillmentOrderDocument = {
  _id: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  stripeSessionId?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  printfulOrderId?: string;
  items?: FulfillmentOrderItem[];
};

function formatAmount(amount?: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return undefined;
  }

  return (amount / 100).toFixed(2);
}

async function fetchOrderForFulfillment(orderId: string) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  return sanityWriteClient.fetch<FulfillmentOrderDocument | null>(
    `*[_type == "order" && _id == $orderId][0]{
      _id,
      paymentStatus,
      fulfillmentStatus,
      stripeSessionId,
      customerEmail,
      customerPhone,
      shippingName,
      shippingPhone,
      shippingAddress,
      printfulOrderId,
      items[]{
        _key,
        title,
        syncVariantId,
        quantity,
        unitAmount
      }
    }`,
    { orderId }
  );
}

export async function submitSanityOrderToPrintful(orderId: string) {
  if (!sanityWriteClient) {
    throw new Error("Missing Sanity write access.");
  }

  const order = await fetchOrderForFulfillment(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.paymentStatus !== "paid") {
    throw new Error("Only paid orders can be submitted to Printful.");
  }

  if (order.printfulOrderId) {
    throw new Error("This order has already been submitted to Printful.");
  }

  const recipientName = order.shippingName || "";
  const shippingAddress = order.shippingAddress;

  if (
    !recipientName ||
    !shippingAddress?.line1 ||
    !shippingAddress.city ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    throw new Error("This order is missing required shipping details.");
  }

  const items = (order.items || []).map((item, index) => {
    const syncVariantId = Number(item.syncVariantId);

    if (!Number.isInteger(syncVariantId) || syncVariantId <= 0) {
      throw new Error(`Order item ${index + 1} is missing a valid Printful sync variant ID.`);
    }

    return {
      syncVariantId,
      quantity: item.quantity ?? 0,
      retailPrice: formatAmount(item.unitAmount),
      externalId: `${order.stripeSessionId || order._id}-${index + 1}`,
      name: item.title || `Order item ${index + 1}`,
    };
  });

  const orderExternalId = buildPrintfulOrderExternalId(order.stripeSessionId || order._id);

  if (items.length === 0 || items.some((item) => item.quantity <= 0)) {
    throw new Error("This order does not contain valid shippable items.");
  }

  try {
    const printfulOrder = await submitPrintfulOrder({
      externalId: orderExternalId,
      recipient: {
        name: recipientName,
        email: order.customerEmail || undefined,
        phone: order.shippingPhone || order.customerPhone || undefined,
        address1: shippingAddress.line1,
        address2: shippingAddress.line2 || undefined,
        city: shippingAddress.city,
        stateCode: shippingAddress.state || undefined,
        countryCode: shippingAddress.country,
        zip: shippingAddress.postalCode,
      },
      items: items.map((item, index) => ({
        ...item,
        externalId: buildPrintfulOrderItemExternalId(orderExternalId, index),
      })),
    });

    await sanityWriteClient
      .patch(order._id)
      .set({
        fulfillmentStatus: "submitted_to_printful",
        printfulOrderId: printfulOrder.id,
        printfulExternalId: orderExternalId,
        printfulStatus: printfulOrder.status,
        printfulSubmittedAt: new Date().toISOString(),
        printfulSubmissionError: "",
      })
      .commit();

    return printfulOrder;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Printful submission failed.";

    await sanityWriteClient
      .patch(order._id)
      .set({
        fulfillmentStatus: "submission_failed",
        printfulSubmissionError: message,
      })
      .commit();

    throw new Error(message);
  }
}
