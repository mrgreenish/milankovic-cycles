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
  // English lives at the root and the other languages under /nl and /sr. All
  // pages sit in the [locale] folder, so root addresses are served from /en,
  // and a visitor who types /en/... is sent to the same page without it.
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    // A shared lab link carries its setup in the query: `/lab?t=-21` for a
    // date, `/lab?e=…&o=…&p=…` for an orbit set by hand. `/lab` is one static
    // page for all of them, so on its own it cannot preview a setup. These
    // rules serve such a link from src/app/[locale]/lab/setup instead, a copy
    // of the lab page built once per setup with its own preview card. Only
    // whole page loads are sent there. Moves inside the site (marked by the
    // `rsc` header) never show a preview and keep using the static page.
    const number = "\\d{1,3}(?:\\.\\d{1,6})?";
    const query = (key: string, value: string) => ({
      type: "query" as const,
      key,
      value: `(?<${key}>${value})`,
    });
    const setups = [
      // Dates are written to one decimal at most; a valid date wins over e, o and p.
      { has: [query("t", "-?\\d{1,3}(?:\\.\\d)?")], path: "t/:t" },
      {
        has: [query("e", number), query("o", number), query("p", number)],
        path: "o/:e/:o/:p",
      },
    ];
    const missing = [{ type: "header" as const, key: "rsc" }];
    return {
      beforeFiles: setups.flatMap(({ has, path }) => [
        { source: "/lab", has, missing, destination: `/en/lab/setup/${path}` },
        {
          source: "/:locale(nl|sr)/lab",
          has,
          missing,
          destination: `/:locale/lab/setup/${path}`,
        },
      ]),
      afterFiles: [
        { source: "/", destination: "/en" },
        {
          source: "/:path((?!nl$|nl/|sr$|sr/|en$|en/).+)",
          destination: "/en/:path",
        },
      ],
      fallback: [],
    };
  },
  async headers() {
    // Large, rarely changing files: textures, the texture decoder and the
    // loading globe. A week of caching makes repeat visits start at once.
    // Small root files like the icon and manifest have no hashed name, so
    // without a lifetime the browser asks the edge again on every page load.
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
      cached("/favicon.ico", 86400),
      cached("/manifest.json", 86400),
      cached("/miltin-milankovic.jpg", 86400),
      cached("/miltin-milankovic.png", 86400),
      {
        // Manifest icons are named by content hash.
        source: "/images/icons/:file",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
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
