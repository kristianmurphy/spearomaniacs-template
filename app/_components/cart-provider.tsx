"use client";

import Image from "next/image";
import Link from "next/link";
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { calculateMaxRedeemablePoints, formatRewardsDiscount } from "@/lib/rewards";

const CART_STORAGE_KEY = "spearomaniacs.cart";

export type CartItem = {
  id: string;
  slug: string;
  title: string;
  imageSrc?: string | null;
  priceLabel?: string;
  syncVariantId?: string;
  size?: string;
  color?: string;
  quantity: number;
};

type AddCartItemInput = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  isOpen: boolean;
  shopLocked: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

type AccountSessionState = {
  signedIn: boolean;
  session?: {
    name: string;
    email: string;
  };
  user?: {
    rewardsPoints?: number;
  } | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function CartDrawer({
  items,
  isOpen,
  shopLocked,
  closeCart,
  updateQuantity,
  removeItem,
  clearCart,
}: {
  items: CartItem[];
  isOpen: boolean;
  shopLocked: boolean;
  closeCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [accountSession, setAccountSession] = useState<AccountSessionState>({ signedIn: false });
  const [useRewards, setUseRewards] = useState(false);
  const [requiresCheckoutAcknowledgement, setRequiresCheckoutAcknowledgement] = useState(false);

  const subtotalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const amountMatch = item.priceLabel?.match(/([0-9]+(?:\.[0-9]{1,2})?)/);

      if (!amountMatch) {
        return sum;
      }

      const unitAmount = Math.round(Number.parseFloat(amountMatch[1]) * 100);

      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        return sum;
      }

      return sum + unitAmount * item.quantity;
    }, 0);
  }, [items]);
  const availableRewardsPoints = Math.floor(accountSession.user?.rewardsPoints || 0);
  const maxRedeemableRewardsPoints = calculateMaxRedeemablePoints(availableRewardsPoints, subtotalAmount);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/account/session", {
          cache: "no-store",
        });
        const payload = (await response.json()) as AccountSessionState;

        if (!cancelled) {
          setAccountSession(payload);
        }
      } catch {
        if (!cancelled) {
          setAccountSession({ signedIn: false });
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async () => {
    if (shopLocked) {
      setCheckoutError("Ordering is currently unavailable.");
      return;
    }

    if (items.length === 0 || isCheckingOut) {
      return;
    }

    if (!requiresCheckoutAcknowledgement) {
      setCheckoutError(null);
      setRequiresCheckoutAcknowledgement(true);
      return;
    }

    setCheckoutError(null);
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items, useRewards: accountSession.signedIn && useRewards }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Checkout could not be started.");
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Checkout could not be started.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[70] transition ${isOpen ? "opacity-100" : "opacity-0"}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={closeCart}
        className={`absolute inset-0 bg-black/30 backdrop-blur-xl transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart"
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-hidden border-l border-white/12 bg-neutral-950/98 shadow-2xl transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "pointer-events-auto translate-x-0 opacity-100" : "translate-x-full opacity-0"
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 pb-5 pt-6">
          <div className="space-y-1">
            <p className="text-2xl font-semibold leading-none text-white sm:text-[1.9rem]">Cart</p>
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-white/58">
              {items.length} item{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 text-[1.7rem] leading-none text-white/72 transition hover:border-white/24 hover:text-white"
            aria-label="Close cart"
          >
            <span className="relative -top-[1px]">×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {shopLocked ? (
            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/76">
              Ordering is currently locked. The shop is browse-only right now.
            </div>
          ) : null}
          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-900">
                    {item.imageSrc ? (
                      <Image
                        src={item.imageSrc}
                        alt={item.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_40%),linear-gradient(135deg,_#1e293b,_#020617)]" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="space-y-1">
                      <Link
                        href={`/shop/${item.slug}`}
                        onClick={closeCart}
                        className="block text-sm font-semibold text-white transition hover:text-white/82"
                      >
                        {item.title}
                      </Link>
                      {item.priceLabel ? (
                        <p className="text-[0.72rem] font-medium uppercase tracking-[0.16em] text-white/58">
                          {item.priceLabel}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-white/48">
                        {item.size ? <span>Size {item.size}</span> : null}
                        {item.color ? <span>Color {item.color}</span> : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-white/10 bg-white/[0.03]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-2 text-white/64 transition hover:text-white"
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-sm text-white/78">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-2 text-white/64 transition hover:text-white"
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-white/44 transition hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-white/72">
              <p>It looks like the cart is empty. Let&apos;s fix that!</p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="mt-4 inline-flex rounded-full border border-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/24 hover:text-white"
              >
                Shop
              </Link>
            </div>
          )}
        </div>

        <footer className="space-y-4 border-t border-white/10 px-6 pb-6 pt-5">
          {accountSession.signedIn ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-white/62">
                Signed in as {accountSession.session?.email}
              </p>
              <p className="text-sm text-white/72">
                {availableRewardsPoints} points available
                {maxRedeemableRewardsPoints > 0 ? ` · use up to ${formatRewardsDiscount(maxRedeemableRewardsPoints)}` : ""}
              </p>
              {maxRedeemableRewardsPoints > 0 ? (
                <label className="flex items-center gap-3 text-sm text-white/82">
                  <input
                    type="checkbox"
                    checked={useRewards}
                    onChange={(event) => setUseRewards(event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                  Apply my rewards points to this order
                </label>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-white/78">Checkout as guest, or sign in to use rewards points and saved shipping details.</p>
              <Link
                href="/account"
                onClick={closeCart}
                className="inline-flex border border-white/14 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:border-white/24 hover:text-white"
              >
                Sign In
              </Link>
            </div>
          )}
          {requiresCheckoutAcknowledgement ? (
            <>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-white/82">
                I confirm that I&apos;ve checked the products, sizes, colours, quantities, and shipping
                details for this order.
              </div>
              <p className="text-xs leading-5 text-white/54">
                By continuing, you agree to the{" "}
                <Link href="/returns" onClick={closeCart} className="underline underline-offset-4 hover:text-white">
                  Returns Policy
                </Link>{" "}
                and{" "}
                <Link href="/customer-service" onClick={closeCart} className="underline underline-offset-4 hover:text-white">
                  Customer Service
                </Link>{" "}
                terms.
              </p>
            </>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
              className="inline-flex items-center border border-white/14 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/62 transition hover:border-white/24 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={startCheckout}
              disabled={shopLocked || items.length === 0 || isCheckingOut}
              className="inline-flex items-center bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {shopLocked
                ? "Ordering Locked"
                : isCheckingOut
                  ? "Redirecting..."
                  : requiresCheckoutAcknowledgement
                    ? "Acknowledge Now"
                    : accountSession.signedIn
                      ? "Checkout"
                      : "Checkout as Guest"}
            </button>
          </div>
          {checkoutError ? (
            <p className="text-xs uppercase tracking-[0.16em] text-red-300/90">{checkoutError}</p>
          ) : null}
        </footer>
      </aside>
    </div>
  );
}

export function CartProvider({ children, shopLocked = false }: { children: ReactNode; shopLocked?: boolean }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let frame = 0;
    const applyHydratedState = (nextItems: CartItem[]) => {
      frame = window.requestAnimationFrame(() => {
        startTransition(() => {
          setItems(nextItems);
          setHasHydrated(true);
        });
      });
    };

    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);

      if (!stored) {
        applyHydratedState([]);
      } else {
        const parsed = JSON.parse(stored) as CartItem[];
        applyHydratedState(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      applyHydratedState([]);
    }

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasHydrated, items]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const url = new URL(window.location.href);

    if (url.pathname !== "/shop" || url.searchParams.get("cart") !== "open") {
      return;
    }

    setIsOpen(true);
    url.searchParams.delete("cart");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [hasHydrated]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: AddCartItemInput) => {
    if (shopLocked) {
      return;
    }

    setItems((current) => {
      const quantity = item.quantity ?? 1;
      const existing = current.find((entry) => entry.id === item.id);

      if (existing) {
        return current.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry
        );
      }

      return [...current, { ...item, quantity }];
    });
    setIsOpen(true);
  }, [shopLocked]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      current.flatMap((item) => {
        if (item.id !== id) {
          return [item];
        }

        if (quantity <= 0) {
          return [];
        }

        return [{ ...item, quantity }];
      })
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: hasHydrated ? items.reduce((sum, item) => sum + item.quantity, 0) : 0,
      isOpen,
      shopLocked,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, closeCart, hasHydrated, isOpen, items, openCart, removeItem, shopLocked, updateQuantity]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer
        items={items}
        isOpen={isOpen}
        shopLocked={shopLocked}
        closeCart={closeCart}
        updateQuantity={updateQuantity}
        removeItem={removeItem}
        clearCart={clearCart}
      />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
