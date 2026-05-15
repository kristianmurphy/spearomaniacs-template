import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "files.cdn.printful.com",
      },
      {
        protocol: "https",
        hostname: "images.printful.com",
      },
      {
        protocol: "https",
        hostname: "img.printful.com",
      },
    ],
  },
};

export default nextConfig;
