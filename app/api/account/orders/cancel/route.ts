import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_SESSION_COOKIE, readSessionCookieValue } from "@/lib/account-auth";
import { cancelOrderForEmail } from "@/lib/account.data";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSessionCookieValue(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let payload: { orderId?: string } = {};

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid cancel order payload." }, { status: 400 });
  }

  const orderId = payload.orderId?.trim() || "";

  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
  }

  try {
    await cancelOrderForEmail(orderId, session.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not cancel order." },
      { status: 400 }
    );
  }
}
