import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A second build directory lets a production server run beside `next dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
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
    // Large, rarely changing files: textures, the texture decoder and the
    // loading globe. A week of caching makes repeat visits start at once.
    const cached = (source: string, seconds: number) => ({
      source,
      headers: [
        {
          key: "Cache-Control",
          value: `public, max-age=${seconds}, stale-while-revalidate=86400`,
        },
      ],
    });
    return [
      cached("/textures/space/:file*", 604800),
      cached("/decoders/basis/:file*", 604800),
      cached("/images/:file*", 86400),
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
