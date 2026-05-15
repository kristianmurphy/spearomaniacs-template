import Image from "next/image";
import Link from "next/link";
import { CheckoutSuccessClient } from "@/app/checkout/success/checkout-success-client";
import { SitePageShell } from "@/app/_components/site-page-shell";
import { imageUrl } from "@/lib/sanity.image";
import { getSiteData } from "@/lib/site.data";

export default async function CheckoutSuccessPage() {
  const siteData = await getSiteData();
  const successImageSrc = imageUrl(siteData.checkoutSuccessImage, 2200);

  return (
    <SitePageShell siteData={siteData}>
      <CheckoutSuccessClient />
      <main className="bg-white px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto w-full max-w-6xl overflow-hidden bg-black text-white">
          <div className="space-y-6 px-6 py-8 sm:px-8 sm:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              Successful Checkout - Payment Recieved
            </p>
            <div className="max-w-3xl space-y-4">
              <h1 className="text-3xl font-semibold sm:text-4xl">Thank you for your order!</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                I&apos;d love to be the sorta company to give you free stickers with your order,
                but just don&apos;t have the resources yet. Maybe one day soon!
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex border border-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
              >
                Back to Shop
              </Link>
              <Link
                href="/"
                className="inline-flex border border-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
              >
                Home
              </Link>
            </div>
          </div>
          <div className="w-full bg-black">
            {successImageSrc ? (
              <Image
                src={successImageSrc}
                alt="Successful checkout"
                width={2200}
                height={1100}
                className="h-auto w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="h-56 w-full bg-black sm:h-72" />
            )}
          </div>
        </section>
      </main>
    </SitePageShell>
  );
}
