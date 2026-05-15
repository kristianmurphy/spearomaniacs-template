import crypto from "node:crypto";

function normalizeIdentifier(value: string) {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-");
}

export function buildPrintfulOrderExternalId(source: string) {
  const normalized = normalizeIdentifier(source);
  const hash = crypto.createHash("sha256").update(source).digest("hex").slice(0, 16);
  const prefix = normalized.slice(0, 11).replace(/^-+|-+$/g, "") || "order";

  return `${prefix}-${hash}`.slice(0, 32);
}

export function buildPrintfulOrderItemExternalId(orderExternalId: string, index: number) {
  return `${orderExternalId}-${index + 1}`.slice(0, 32);
}
