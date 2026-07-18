import type { MetadataRoute } from "next";
import { LEARN_TOPICS } from "@/lib/learn/topics";
import { SITE_URL } from "@/lib/site";

// Bump when page content meaningfully changes so crawlers can prioritize.
const lastModified = new Date("2026-07-10");

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/lab`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/learn`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/educators`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/sources`, lastModified, changeFrequency: "monthly", priority: 0.7 },
  ];

  return [
    ...corePages,
    ...LEARN_TOPICS.map((topic) => ({
      url: `${SITE_URL}/learn/${topic.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
