import type { MetadataRoute } from "next";

const baseUrl = "https://milankovic-cycles.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/lab`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/sources`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
