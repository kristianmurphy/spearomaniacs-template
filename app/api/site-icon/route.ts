import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/site.data";

export const revalidate = 60;

export async function GET(request: Request) {
  const site = await getSiteData();
  const iconUrl = site.siteIcon?.asset?.url;
  const iconType = site.siteIcon?.asset?.mimeType || "image/png";

  if (!iconUrl) {
    return NextResponse.redirect(new URL("/favicon.ico", request.url), 307);
  }

  const response = await fetch(iconUrl, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    return NextResponse.redirect(new URL("/favicon.ico", request.url), 307);
  }

  const arrayBuffer = await response.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": iconType,
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
