"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/app/_components/cart-provider";

type NavigationLink = {
  href: string;
  label: string;
};

type SocialLink = {
  platform?: string;
  url?: string;
};

function NavLink({
  href,
  label,
  className = "",
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group inline-flex items-center text-white/80 transition hover:text-white ${className}`}
    >
      <span className="relative inline-flex pb-2">
        <span>{label}</span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2 origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100">
          <span className="absolute left-0 right-[4px] top-[4px] h-px bg-white/90" />
          <span className="absolute right-[6px] top-[4px] h-[6px] w-px origin-top rotate-[35deg] bg-white/90" />
          <span className="absolute right-px top-[3.5px] h-0 w-0 border-y-[1px] border-y-transparent border-l-[3px] border-l-white/90" />
        </span>
      </span>
    </Link>
  );
}

function SocialIcon({ platform }: { platform?: string }) {
  const value = platform?.toLowerCase() || "";

  if (value.includes("youtube")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M23 12s0-3.2-.4-4.7a3 3 0 0 0-2.1-2.1C19 4.8 12 4.8 12 4.8s-7 0-8.5.4A3 3 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a3 3 0 0 0 2.1 2.1c1.5.4 8.5.4 8.5.4s7 0 8.5-.4a3 3 0 0 0 2.1-2.1C23 15.2 23 12 23 12ZM10 15.5v-7l6 3.5-6 3.5Z" />
      </svg>
    );
  }

  if (value.includes("instagram")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current">
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="4" strokeWidth="1.8" />
        <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (value.includes("tiktok")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M14.6 3c.4 2.2 1.7 3.8 3.9 4.2v2.7a7.1 7.1 0 0 1-3.5-1V15a5 5 0 1 1-5-5c.3 0 .6 0 .9.1v2.9a2.2 2.2 0 1 0 1.4 2V3h2.3Z" />
      </svg>
    );
  }

  if (value.includes("facebook")) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
        <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.2V11H8v3h2.4v8h3.1Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function BagIcon({ count }: { count: number }) {
  return (
    <span className="relative inline-flex h-6 w-6 items-center justify-center">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.7]">
        <path d="M6.5 9h11l-1 10H7.5l-1-10Z" />
        <path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-white px-1.5 py-0.5 text-center text-[10px] font-semibold text-black">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </span>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.7]">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function SiteHeader({
  logoSrc,
  logoAlt,
  longLogoSrc,
  longLogoAlt,
  invertLogo = false,
  invertWordmark = true,
  socialLinks,
  mainLinks,
  exploreLinks,
}: {
  theme?: "brand" | "light";
  logoSrc: string | null;
  logoAlt: string;
  longLogoSrc: string | null;
  longLogoAlt: string;
  invertLogo?: boolean;
  invertWordmark?: boolean;
  oversizeLongLogo?: boolean;
  socialLinks: SocialLink[];
  mainLinks: NavigationLink[];
  exploreLinks: NavigationLink[];
}) {
  const pathname = usePathname();
  const { itemCount, openCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(74);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const measure = () => {
      if (headerRef.current) {
        const nextHeight = Math.round(headerRef.current.getBoundingClientRect().height);
        setHeaderHeight(nextHeight);
        document.documentElement.style.setProperty("--site-header-height", `${nextHeight}px`);
      }
    };

    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, [pathname, isMobileMenuOpen, mainLinks.length, socialLinks.length]);

  const headerBody = (
    <div ref={headerRef} className="mx-auto max-w-6xl px-3 sm:px-6">
      <div className="relative grid min-h-[4.5rem] grid-cols-[auto_1fr_auto] items-center gap-2 py-1.5 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/85 hover:border-white hover:text-white md:hidden"
          >
            <span className="relative top-px block h-5 w-5">
              <span
                className={`absolute left-0 top-0 h-[1.5px] w-5 bg-current transition ${
                  isMobileMenuOpen ? "translate-y-[8px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[8px] h-[1.5px] w-5 bg-current transition ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[16px] h-[1.5px] w-5 bg-current transition ${
                  isMobileMenuOpen ? "-translate-y-[8px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          <div className="hidden items-center gap-4 text-sm md:flex lg:gap-5">
            {socialLinks.map((link) =>
              link.url ? (
                <a
                  key={`${link.platform}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-white/80 hover:text-white"
                  aria-label={link.platform || "Social"}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ) : null,
            )}
          </div>
        </div>

        <Link href="/" className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 justify-center pt-1 leading-none md:static md:translate-x-0 md:translate-y-0">
          {longLogoSrc ? (
            <Image
              src={longLogoSrc}
              alt={longLogoAlt}
              width={520}
              height={140}
              priority
              className={`h-auto max-h-[3rem] w-auto max-w-[10.5rem] object-contain sm:max-h-[3.5rem] sm:max-w-[14rem] md:max-h-[5rem] md:max-w-[24rem] lg:max-w-[28rem] ${
                invertWordmark ? "invert" : ""
              } transition group-hover:invert`}
            />
          ) : (
            <span className="text-xl font-semibold tracking-wide">{longLogoAlt || "Your Brand"}</span>
          )}
        </Link>

        <div className="flex items-center justify-end gap-2">
          <Link
            href="/account"
            aria-label="User"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/85 hover:border-white hover:text-white"
          >
            <UserIcon />
          </Link>
          <button
            type="button"
            onClick={openCart}
            aria-label={itemCount > 0 ? `Open cart with ${itemCount} items` : "Open cart"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white/85 hover:border-white hover:text-white"
          >
            <BagIcon count={itemCount} />
          </button>
        </div>
      </div>
      <div className="hidden items-center justify-center gap-6 py-2 text-sm uppercase tracking-[0.2em] md:flex md:gap-8">
        <nav className="flex flex-wrap items-center justify-end gap-5 md:min-w-[18rem] md:gap-7">
          {mainLinks.slice(0, 2).map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="flex shrink-0 justify-center">
          {logoSrc ? (
            <Link href="/shop" className="group inline-flex items-center gap-2 text-white/85 hover:text-white">
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={56}
                height={56}
                className={`h-[2.7rem] w-[2.7rem] object-contain ${invertLogo ? "invert" : ""} transition group-hover:invert`}
              />
            </Link>
          ) : null}
        </div>

        <nav className="flex flex-wrap items-center justify-start gap-5 md:min-w-[18rem] md:gap-7">
          {mainLinks.slice(2).map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
          {exploreLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/15 bg-black text-white"
      >
        {headerBody}
      </header>

      <div
        style={{ top: `${headerHeight}px` }}
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 transition md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${
            isMobileMenuOpen ? "pointer-events-auto opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`absolute inset-x-0 top-0 z-10 w-full overflow-hidden border-b border-white/12 bg-neutral-950 px-5 py-5 text-white shadow-2xl transition-all duration-300 ${
            isMobileMenuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-4 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-4 text-sm uppercase tracking-[0.2em]">
            {mainLinks.map((link) => (
              <NavLink
                key={`${link.href}-mobile`}
                href={link.href}
                label={link.label}
                className="rounded-xl border border-white/10 px-4 py-3 text-white/85 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            ))}
          </nav>

          {socialLinks.length > 0 ? (
            <div className="mt-5 flex items-center gap-5 border-t border-white/10 pt-4">
              {socialLinks.map((link) =>
                link.url ? (
                  <a
                    key={`${link.platform}-${link.url}-mobile`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-white/80 hover:text-white"
                    aria-label={link.platform || "Social"}
                  >
                    <SocialIcon platform={link.platform} />
                  </a>
                ) : null,
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
