import { Suspense } from "react";
import { PageBanner } from "@/app/_components/page-banner";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { ResetPasswordClient } from "@/app/account/reset-password/reset-password-client";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getSiteData } from "@/lib/site.data";

export async function generateMetadata() {
  return buildPageMetadata({
    pageTabTitle: "Reset Password",
    description: "Reset your account password.",
  });
}

export default async function ResetPasswordPage() {
  const siteData = await getSiteData();

  return (
    <SitePageShell siteData={siteData}>
      <main className="bg-white pb-16 text-neutral-950">
        <PageBanner title="Reset Password" intro="Get back into your account." />
        <div className="mx-auto max-w-4xl px-4 pt-2 sm:px-6">
          <Suspense fallback={<div className="border border-black bg-white p-6">Loading...</div>}>
            <ResetPasswordClient />
          </Suspense>
        </div>
      </main>
    </SitePageShell>
  );
}
