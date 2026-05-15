import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
      <div className="space-y-5 border border-black bg-white px-8 py-10 text-neutral-950">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-black/55">Checkout</p>
        <h1 className="text-3xl font-semibold">No pressure!</h1>
        <p className="text-neutral-700">
          Nothing was charged. Come back to checkout if you want to give it another shot!
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/shop" className="inline-flex border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white">
            Return to Shop
          </Link>
        </div>
      </div>
    </main>
  );
}
