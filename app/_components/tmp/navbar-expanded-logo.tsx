import Image from "next/image";
import Link from "next/link";

export function NavbarExpandedLogo({
  longLogoSrc,
  longLogoAlt,
  showExpandedBrand,
  oversizeLongLogo = true,
}: {
  longLogoSrc: string | null;
  longLogoAlt: string;
  showExpandedBrand: boolean;
  oversizeLongLogo?: boolean;
}) {
  const expandedLogoClass = oversizeLongLogo
    ? "h-[2.8rem] w-auto max-w-full object-contain invert"
    : "h-[2.35rem] w-auto max-w-full object-contain invert";

  return (
    <div
      className={`min-w-0 self-stretch overflow-visible transition-[max-width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        showExpandedBrand
          ? "pointer-events-auto flex-1 max-w-[11rem] opacity-100 min-[980px]:max-w-[15rem]"
          : "pointer-events-none max-w-0 opacity-0"
      }`}
    >
      {longLogoSrc ? (
        <Link
          href="/"
          aria-label={`${longLogoAlt} home`}
          className={`flex h-full max-w-full items-center overflow-visible whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            showExpandedBrand ? "translate-x-0" : "-translate-x-4"
          }`}
        >
          <Image
            src={longLogoSrc}
            alt={longLogoAlt}
            width={480}
            height={144}
            className={expandedLogoClass}
          />
        </Link>
      ) : null}
    </div>
  );
}
