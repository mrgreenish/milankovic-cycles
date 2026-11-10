import { describe, expect, it, vi } from "vitest";
import { LOCALES } from "@/i18n/config";
import { pageCard } from "@/lib/social/cards";

// Fonts are prepared by the Next.js build; the metadata under test needs none.
vi.mock("next/font/google", () => ({
  Fraunces: () => ({ variable: "" }),
  JetBrains_Mono: () => ({ variable: "" }),
}));
vi.mock("next/font/local", () => ({ default: () => ({ variable: "" }) }));

describe("site-wide preview", () => {
  it.each(LOCALES)(
    "%s falls back to the tour's card, not the portrait",
    async (locale) => {
      const { generateMetadata } = await import("./layout");
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale }),
      });
      const prefix = locale === "en" ? "" : `/${locale}`;
      const image = {
        url: `${prefix}/card/home.jpg`,
        width: 1200,
        height: 630,
        alt: pageCard(locale, "home")!.alt,
      };
      expect(metadata.openGraph).toMatchObject({ images: [image] });
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        images: [image],
      });
    },
  );
});
