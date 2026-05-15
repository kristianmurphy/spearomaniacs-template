import { cookies } from "next/headers";
import { PageBanner } from "@/app/_components/page-banner";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { AccountClient } from "@/app/account/account-client";
import { ACCOUNT_SESSION_COOKIE, readSessionCookieValue } from "@/lib/account-auth";
import { getAccountSnapshot } from "@/lib/account.data";
import { getSiteData } from "@/lib/site.data";

export default async function AccountPage() {
  const [siteData, cookieStore] = await Promise.all([getSiteData(), cookies()]);
  const session = readSessionCookieValue(cookieStore.get(ACCOUNT_SESSION_COOKIE)?.value);
  const snapshot = session ? await getAccountSnapshot(session) : { user: null, orders: [] };

  return (
    <SitePageShell siteData={siteData}>
      <main className="bg-white pb-16 text-neutral-950">
        <PageBanner title="Account" intro="Manage notifications & orders" />

        <section className="mx-auto w-full max-w-4xl space-y-6 px-4 pt-2 sm:px-6">
          <AccountClient
            session={session}
            newsletterOptIn={Boolean(snapshot.user?.newsletterOptIn)}
            rewardsPoints={Math.floor(snapshot.user?.rewardsPoints || 0)}
            rewardsLifetimePoints={Math.floor(snapshot.user?.rewardsLifetimePoints || 0)}
            defaultShippingAddress={snapshot.user?.defaultShippingAddress || null}
            stripeCustomerId={snapshot.user?.stripeCustomerId || ""}
            orders={snapshot.orders}
          />
        </section>
      </main>
    </SitePageShell>
  );
}
