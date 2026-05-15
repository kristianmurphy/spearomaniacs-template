import Link from "next/link";
import { PageBanner } from "@/app/_components/page-banner";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getSiteData } from "@/lib/sanity.page";

export async function generateMetadata() {
  return buildPageMetadata({
    pageTabTitle: "Returns",
    description: "Returns, damage claims, and cancellation information for custom-made orders.",
  });
}

export default async function ReturnsPage() {
  const site = await getSiteData();

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <main className="bg-white pb-16 text-neutral-950">
        <PageBanner
          title="Returns"
          intro="Custom-made order policies, damage claims, and cancellation requests."
        />

        <section className="mx-auto max-w-4xl space-y-8 px-6 pt-2">
          <article className="space-y-5 border border-black/12 bg-white p-6 sm:p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Custom-made items</h2>
              <p className="text-neutral-700">
                All apparel and printed products are made to order for each customer. Because of
                that, we do not accept returns or exchanges for change of mind, incorrect size
                selection, incorrect colour selection, or ordering the wrong quantity once
                production has started.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Damaged, defective, or misprinted items</h2>
              <p className="text-neutral-700">
                If your order arrives damaged, defective, or misprinted, contact us within 30 days
                of delivery with clear photo evidence showing the full item and the issue. We will
                review the claim and work with our production and payment providers to request a
                replacement or refund where approved.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Order cancellations</h2>
              <p className="text-neutral-700">
                Orders may only be cancelled before they have been manually approved and submitted
                to production. Once an order has been approved for fulfillment, it is treated as a
                custom production order and can no longer be cancelled.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Address issues and delivery problems</h2>
              <p className="text-neutral-700">
                Customers are responsible for entering the correct shipping address at checkout.
                If you notice an error, contact us immediately. We may be able to correct the
                address before the order ships, but once it has left production we cannot guarantee
                changes.
              </p>
              <p className="text-neutral-700">
                If a parcel is lost in transit, damaged in transit, or returned before delivery,
                contact us as soon as possible so we can review the order with the relevant
                fulfillment and shipping providers.
              </p>
            </div>

            <div className="space-y-3 border-t border-black/10 pt-6">
              <p className="text-neutral-700">
                If there are any issues with your order, please{" "}
                <Link href="/explore#contact" className="font-medium underline underline-offset-4">
                  contact us directly
                </Link>{" "}
                and we&apos;ll do our best to get you sorted out. Thank you.
              </p>
            </div>
          </article>
        </section>
      </main>
    </SitePageShell>
  );
}
