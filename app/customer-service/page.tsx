import Link from "next/link";
import { PageBanner } from "@/app/_components/page-banner";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { buildPageMetadata } from "@/lib/site.metadata";
import { getSiteData } from "@/lib/sanity.page";

export async function generateMetadata() {
  return buildPageMetadata({
    pageTabTitle: "Customer Service",
    description: "Customer service, support, cancellation, and order issue information.",
  });
}

export default async function CustomerServicePage() {
  const site = await getSiteData();

  return (
    <SitePageShell pageTheme="interior" siteData={site}>
      <main className="bg-white pb-16 text-neutral-950">
        <PageBanner
          title="Customer Service"
          intro="Support information for orders, product issues, and cancellations."
        />

        <section className="mx-auto max-w-4xl space-y-8 px-6 pt-2">
          <article className="space-y-6 border border-black/12 bg-white p-6 sm:p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Before you checkout</h2>
              <p className="text-neutral-700">
                Please double-check the product, size, colour, quantity, and shipping address
                before completing your order. Each item is produced specifically for that order,
                so changes become limited once production begins.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">If you need help with an order</h2>
              <p className="text-neutral-700">
                If something doesn&apos;t look right, or if your order arrives damaged or
                misprinted, contact us with your order details and clear photos of the issue. We
                will review the problem and escalate it with the relevant fulfillment or payment
                provider where needed.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Cancellations</h2>
              <p className="text-neutral-700">
                Cancellation requests must be made quickly. We can only cancel an order if it has
                not yet been manually approved and sent to production. After that point, the order
                is considered in production and cannot be cancelled as a standard return.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold">Returns and exchanges</h2>
              <p className="text-neutral-700">
                We do not accept returns or exchanges for change of mind or incorrect
                size/quantity choices on made-to-order products. If you believe an item qualifies
                for a defect or damage claim, contact us first and we&apos;ll guide you through the
                next step.
              </p>
            </div>

            <div className="space-y-3 border-t border-black/10 pt-6">
              <p className="text-neutral-700">
                Need help now?{" "}
                <Link href="/explore#contact" className="font-medium underline underline-offset-4">
                  Contact us directly
                </Link>
                .
              </p>
              <p className="text-sm text-neutral-600">
                Payment processing outcomes such as card authorization, refunds, and chargebacks
                are handled through the applicable payment provider.
              </p>
            </div>
          </article>
        </section>
      </main>
    </SitePageShell>
  );
}
