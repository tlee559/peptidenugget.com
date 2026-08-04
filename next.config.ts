import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Product art is our own copy under /public, so it's same-origin and the
  // tier-list PNG export never hits a tainted canvas.
  images: { unoptimized: true },
};

export default nextConfig;
