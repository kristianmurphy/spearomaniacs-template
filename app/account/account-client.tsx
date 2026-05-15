"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AccountOrder } from "@/lib/account.data";

type AccountClientProps = {
  session: {
    name: string;
    email: string;
  } | null;
  newsletterOptIn: boolean;
  rewardsPoints: number;
  rewardsLifetimePoints: number;
  stripeCustomerId: string;
  defaultShippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  orders: AccountOrder[];
};

function formatMoney(amount?: number, currency?: string) {
  if (typeof amount !== "number" || !currency) {
    return null;
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

function formatStatus(status?: string) {
  switch (status) {
    case "processing":
      return "Under Review";
    case "submission_failed":
      return "Action Needed";
    case "submitted_to_printful":
      return "In Production";
    case "fulfilled":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status ? status.replaceAll("_", " ") : "Under Review";
  }
}

export function AccountClient({
  session,
  newsletterOptIn,
  rewardsPoints,
  rewardsLifetimePoints,
  stripeCustomerId,
  defaultShippingAddress,
  orders,
}: AccountClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState(newsletterOptIn);
  const [newsletterMessage, setNewsletterMessage] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [shippingName, setShippingName] = useState(session?.name || "");
  const [addressLine1, setAddressLine1] = useState(defaultShippingAddress?.line1 || "");
  const [addressLine2, setAddressLine2] = useState(defaultShippingAddress?.line2 || "");
  const [addressCity, setAddressCity] = useState(defaultShippingAddress?.city || "");
  const [addressState, setAddressState] = useState(defaultShippingAddress?.state || "");
  const [addressPostalCode, setAddressPostalCode] = useState(defaultShippingAddress?.postalCode || "");
  const [addressCountry, setAddressCountry] = useState(defaultShippingAddress?.country || "");
  const [cancelOrderMessage, setCancelOrderMessage] = useState<string | null>(null);
  const [cancelOrderError, setCancelOrderError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>, nextMode: "signin" | "signup") => {
    event.preventDefault();
    setSignInError(null);
    setSignUpError(null);

    const formData = new FormData(event.currentTarget);
    const body =
      nextMode === "signup"
        ? {
            name: String(formData.get("name") || ""),
            email: String(formData.get("email") || ""),
            password: String(formData.get("password") || ""),
            newsletterOptIn: formData.get("newsletterOptIn") === "on",
          }
        : {
            email: String(formData.get("email") || ""),
            password: String(formData.get("password") || ""),
          };

    const response = await fetch(`/api/account/${nextMode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      if (nextMode === "signup") {
        setSignUpError(payload.error || "Could not create account.");
      } else {
        setSignInError(payload.error || "Could not sign in.");
      }
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const handleSignOut = async () => {
    await fetch("/api/account/signout", { method: "POST" });
    startTransition(() => {
      router.refresh();
    });
  };

  const handleNewsletterSave = async () => {
    setNewsletterMessage(null);

    const response = await fetch("/api/account/newsletter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newsletterOptIn: newsletter }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setNewsletterMessage(payload.error || "Could not update newsletter preference.");
      return;
    }

    setNewsletterMessage("Newsletter preference saved.");
    startTransition(() => {
      router.refresh();
    });
  };

  const handleProfileSave = async () => {
    setProfileMessage(null);

    const response = await fetch("/api/account/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: shippingName,
        stripeCustomerId,
        defaultShippingAddress: {
          line1: addressLine1,
          line2: addressLine2,
          city: addressCity,
          state: addressState,
          postalCode: addressPostalCode,
          country: addressCountry,
        },
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setProfileMessage(payload.error || "Could not update saved shipping details.");
      return;
    }

    setProfileMessage("Saved shipping details updated.");
    startTransition(() => {
      router.refresh();
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancelOrderMessage(null);
    setCancelOrderError(null);
    setCancellingOrderId(orderId);

    const response = await fetch("/api/account/orders/cancel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setCancelOrderError(payload.error || "Could not cancel order.");
      setCancellingOrderId(null);
      return;
    }

    setCancelOrderMessage("Order cancelled.");
    setCancellingOrderId(null);
    startTransition(() => {
      router.refresh();
    });
  };

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              mode === "signin" ? "border-black bg-black text-white" : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              mode === "signup" ? "border-black bg-black text-white" : "border-black text-black hover:bg-black hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === "signin" ? (
          <form
            key="signin-form"
            onSubmit={(event) => void handleAuth(event, "signin")}
            className="space-y-4 border border-black bg-white p-6"
          >
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-black/65" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full border border-black px-4 py-3 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-black/65" htmlFor="signin-password">
                Password
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full border border-black px-4 py-3 outline-none"
              />
            </div>
            {signInError ? <p className="text-sm text-red-700">{signInError}</p> : null}
            <div>
              <Link href="/account/reset-password" className="text-sm text-black/72 underline underline-offset-4">
                Forgot your password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black disabled:opacity-60"
            >
              Sign In
            </button>
          </form>
        ) : (
          <form
            key="signup-form"
            onSubmit={(event) => void handleAuth(event, "signup")}
            className="space-y-4 border border-black bg-white p-6"
          >
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-black/65" htmlFor="signup-name">
                Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                className="w-full border border-black px-4 py-3 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-black/65" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full border border-black px-4 py-3 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-black/65" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="w-full border border-black px-4 py-3 outline-none"
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-black/78">
              <input name="newsletterOptIn" type="checkbox" className="h-4 w-4 accent-black" />
              Subscribe to newsletters and updates
            </label>
            {signUpError ? <p className="text-sm text-red-700">{signUpError}</p> : null}
            <button
              type="submit"
              disabled={isPending}
              className="border border-black bg-black px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black disabled:opacity-60"
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 border border-black bg-white p-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-black">Signed in</h2>
          <p className="text-sm text-black/72">
            {session.name} · {session.email}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 border border-black p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/65">Rewards Balance</p>
            <p className="text-3xl font-semibold text-black">{rewardsPoints}</p>
          </div>
          <div className="space-y-1 border border-black p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/65">Lifetime Points</p>
            <p className="text-3xl font-semibold text-black">{rewardsLifetimePoints}</p>
            <p className="text-sm text-black/72">Earn 1 point per $1 spent.</p>
          </div>
        </div>
        <div className="space-y-3 border border-black p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/65">Newsletter</p>
          <label className="flex items-center gap-3 text-sm text-black/82">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(event) => setNewsletter(event.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Email me updates and newsletters
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleNewsletterSave}
              className="border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
            >
              Save preference
            </button>
          </div>
          {newsletterMessage ? <p className="text-sm text-black/72">{newsletterMessage}</p> : null}
        </div>
        <div className="space-y-4 border border-black p-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/65">Saved Shipping Details</p>
            <p className="text-sm text-black/62">Used to prefill checkout when you check out while signed in.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={shippingName}
              onChange={(event) => setShippingName(event.target.value)}
              placeholder="Full name"
              className="w-full border border-black px-4 py-3 outline-none"
            />
            <input
              value={addressCountry}
              onChange={(event) => setAddressCountry(event.target.value.toUpperCase())}
              placeholder="Country code"
              className="w-full border border-black px-4 py-3 outline-none"
            />
            <input
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              placeholder="Address line 1"
              className="w-full border border-black px-4 py-3 outline-none sm:col-span-2"
            />
            <input
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              placeholder="Address line 2"
              className="w-full border border-black px-4 py-3 outline-none sm:col-span-2"
            />
            <input
              value={addressCity}
              onChange={(event) => setAddressCity(event.target.value)}
              placeholder="City"
              className="w-full border border-black px-4 py-3 outline-none"
            />
            <input
              value={addressState}
              onChange={(event) => setAddressState(event.target.value)}
              placeholder="State / Region"
              className="w-full border border-black px-4 py-3 outline-none"
            />
            <input
              value={addressPostalCode}
              onChange={(event) => setAddressPostalCode(event.target.value)}
              placeholder="Postal code"
              className="w-full border border-black px-4 py-3 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleProfileSave()}
              className="border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white"
            >
              Save shipping
            </button>
            {profileMessage ? <p className="text-sm text-black/72">{profileMessage}</p> : null}
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={handleSignOut}
            className="border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black"
          >
            Sign Out
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-black">Order status</h2>
          <p className="text-sm text-black/72">Paid orders tied to this email show up here with their fulfillment progress.</p>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order._id} className="space-y-4 border border-black bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
                      {order.stripeCreatedAt
                        ? new Date(order.stripeCreatedAt).toLocaleDateString("en-AU", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Order"}
                    </p>
                    <h3 className="text-lg font-semibold text-black">
                      {formatMoney(order.amountTotal, order.currency)}
                    </h3>
                  </div>
                  <div className="border border-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black">
                    {formatStatus(order.fulfillmentStatus)}
                  </div>
                </div>
                <div className="space-y-3 border-t border-black pt-4">
                  {(order.fulfillmentStatus === "processing" || order.fulfillmentStatus === "submission_failed" || order.fulfillmentStatus === "pending_review") ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void handleCancelOrder(order._id)}
                        disabled={cancellingOrderId === order._id}
                        className="border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                      >
                        {cancellingOrderId === order._id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    </div>
                  ) : null}
                  {order.printfulSubmissionError ? (
                    <p className="text-sm text-red-700">{order.printfulSubmissionError}</p>
                  ) : null}
                  {order.printfulOrderId || order.printfulStatus ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-black/58">
                      {order.printfulOrderId ? `Printful ${order.printfulOrderId}` : "Printful"}
                      {order.printfulStatus ? ` · ${formatStatus(order.printfulStatus)}` : ""}
                    </p>
                  ) : null}
                  {order.cardLast4 ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-black/58">
                      {order.cardBrand || "Card"} ·•••• {order.cardLast4}
                    </p>
                  ) : null}
                  {(order.rewardsPointsEarned || order.rewardsPointsRedeemed) ? (
                    <p className="text-xs uppercase tracking-[0.16em] text-black/58">
                      {order.rewardsPointsEarned ? `+${order.rewardsPointsEarned} pts` : null}
                      {order.rewardsPointsEarned && order.rewardsPointsRedeemed ? " · " : null}
                      {order.rewardsPointsRedeemed ? `-${order.rewardsPointsRedeemed} pts used` : null}
                    </p>
                  ) : null}
                  {(order.items || []).map((item) => (
                    <div key={item._key} className="flex items-start justify-between gap-4 text-sm text-black/82">
                      <div className="space-y-1">
                        <p className="font-semibold text-black">{item.title}</p>
                        <p className="text-black/62">{item.description}</p>
                        <p className="text-black/62">
                          {item.size ? `Size ${item.size}` : null}
                          {item.size && item.color ? " · " : null}
                          {item.color ? `Color ${item.color}` : null}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-black/72">
                        <p>Qty {item.quantity}</p>
                        <p>{formatMoney(item.totalAmount, item.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
            {cancelOrderMessage ? <p className="text-sm text-black/72">{cancelOrderMessage}</p> : null}
            {cancelOrderError ? <p className="text-sm text-red-700">{cancelOrderError}</p> : null}
          </div>
        ) : (
          <div className="border border-black bg-white p-6 text-sm text-black/72">
            No orders found for this account yet.
          </div>
        )}
      </section>
    </div>
  );
}
