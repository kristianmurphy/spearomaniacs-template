import { NextResponse } from "next/server";
import { submitSanityOrderToPrintful } from "@/lib/order-fulfillment";

function isAllowedOrigin(origin?: string | null) {
  if (!origin) {
    return false;
  }

  try {
    const url = new URL(origin);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      (url.hostname === "localhost" || /^127(?:\.\d{1,3}){3}$/.test(url.hostname))
    );
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
  let payload: { orderId?: string } = {};

  try {
    payload = (await request.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid approval payload." }, { status: 400, headers: corsHeaders });
  }

  if (!payload.orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400, headers: corsHeaders });
  }

  try {
    const printfulOrder = await submitSanityOrderToPrintful(payload.orderId);

    return NextResponse.json(
      {
        ok: true,
        printfulOrderId: printfulOrder.id,
        printfulStatus: printfulOrder.status,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Printful submission failed.";

    return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders });
  }
}
