import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Playwright drives the dev server via 127.0.0.1; without this, Next 16
  // blocks its client-side router fetches as cross-origin dev requests.
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
  async headers() {
    return [
      {
        // Vercel deployment aliases (including the production
        // <project>.vercel.app alias) serve the same content as the custom
        // domain. Keep them out of search indexes so Google never picks one
        // of them as canonical over milankovitchcycles.com.
        source: "/:path*",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
