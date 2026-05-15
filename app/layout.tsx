import type { Viewport } from "next";
import { CartProvider } from "@/app/_components/cart-provider";
import { getSiteData } from "@/lib/sanity.page";
import { getRootMetadata } from "@/lib/site.metadata";
import "./globals.css";

export const generateMetadata = getRootMetadata;
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSiteData();

  return (
    <html lang="en">
      <body className="antialiased">
        <CartProvider shopLocked={site.shopLocked}>
          <div className="min-h-screen bg-black text-neutral-950">{children}</div>
        </CartProvider>
      </body>
    </html>
  );
}
