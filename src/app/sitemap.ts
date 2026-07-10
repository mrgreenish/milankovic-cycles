import type { MetadataRoute } from "next";
import { LEARN_TOPICS } from "@/lib/learn/topics";

const baseUrl = "https://milankovitchcycles.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/lab`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/learn`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/educators`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/sources`, changeFrequency: "monthly", priority: 0.7 },
  ];

  return [
    ...corePages,
    ...LEARN_TOPICS.map((topic) => ({
      url: `${baseUrl}/learn/${topic.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
