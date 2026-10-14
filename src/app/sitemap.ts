import type { MetadataRoute } from "next";
import { LOCALES, HTML_LANG, localePath } from "@/i18n/config";
import { TOPIC_SLUGS } from "@/lib/learn/topics";
import { SITE_URL } from "@/lib/site";

// Bump when page content meaningfully changes so crawlers can prioritize.
const lastModified = new Date("2026-10-08");

type Page = {
  path: string;
  changeFrequency: "monthly" | "yearly";
  priority: number;
};

const corePages: Page[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/lab", changeFrequency: "monthly", priority: 0.9 },
  { path: "/learn", changeFrequency: "monthly", priority: 0.9 },
  { path: "/educators", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "yearly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sources", changeFrequency: "monthly", priority: 0.7 },
  ...TOPIC_SLUGS.map((slug) => ({
    path: `/learn/${slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  })),
];

/** Every page in every language, each pointing at its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  return corePages.flatMap(({ path, changeFrequency, priority }) => {
    const address = (locale: (typeof LOCALES)[number]) => {
      const url = localePath(locale, path);
      return `${SITE_URL}${url === "/" ? "" : url}`;
    };
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [HTML_LANG[locale], address(locale)]),
    );
    return LOCALES.map((locale) => {
      return {
        url: address(locale),
        lastModified,
        changeFrequency,
        priority,
        alternates: { languages },
      };
    });
  });
}
