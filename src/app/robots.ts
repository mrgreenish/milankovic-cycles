import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://milankovitchcycles.com/sitemap.xml",
    host: "https://milankovitchcycles.com",
  };
}
