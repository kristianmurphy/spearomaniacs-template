import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCOUNT_SESSION_COOKIE, readSessionCookieValue } from "@/lib/account-auth";
import { getAccountSnapshot } from "@/lib/account.data";

export async function GET() {
  const cookieStore = await cookies();
  const session = readSessionCookieValue(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value);

  if (!session) {
    return NextResponse.json({ signedIn: false });
  }

  const snapshot = await getAccountSnapshot(session);

  return NextResponse.json({
    signedIn: true,
    session,
    user: snapshot.user
      ? {
          newsletterOptIn: Boolean(snapshot.user.newsletterOptIn),
          rewardsPoints: Math.floor(snapshot.user.rewardsPoints || 0),
          rewardsLifetimePoints: Math.floor(snapshot.user.rewardsLifetimePoints || 0),
          stripeCustomerId: snapshot.user.stripeCustomerId || "",
          defaultShippingAddress: snapshot.user.defaultShippingAddress || null,
        }
      : null,
  });
}
