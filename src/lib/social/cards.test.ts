import type { Metadata } from "next";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { LOCALES, localeFromPathname, stripLocale } from "@/i18n/config";
import { getContent, getTopics } from "@/i18n/content";
import { pageMetadata, previewMetadata } from "@/i18n/page";
import { SITE_URL } from "@/lib/site";
import { PAGE_CARDS, cardForPath, pageCard } from "./cards";

/** Every page of the site in every language, taken from the sitemap. */
const pages = sitemap().map(({ url }) => {
  const pathname = url.slice(SITE_URL.length) || "/";
  return { locale: localeFromPathname(pathname), path: stripLocale(pathname) };
});

/** The preview tags of a page, in the shape Next.js writes them to the head. */
function preview(metadata: Pick<Metadata, "openGraph" | "twitter">) {
  const og = metadata.openGraph as {
    url: string;
    images: { url: string; width: number; height: number; alt: string }[];
  };
  const twitter = metadata.twitter as {
    card: string;
    images: { url: string; alt: string }[];
  };
  return { url: og.url, image: og.images[0], twitter };
}

describe("page cards", () => {
  it("exist for every page in the sitemap, and for nothing else", () => {
    expect(pages).toHaveLength(PAGE_CARDS.length * LOCALES.length);
    expect(new Set(pages.map(({ path }) => cardForPath(path)))).toEqual(
      new Set(PAGE_CARDS),
    );
    for (const locale of LOCALES)
      for (const card of PAGE_CARDS)
        expect(pageCard(locale, card), `${locale} ${card}`).not.toBeNull();
    expect(pageCard("en", "learn-no-such-guide")).toBeNull();
  });

  it("show the page's own title in its language", () => {
    expect(pageCard("en", "home")).toMatchObject({
      title: "Why do ice ages come and go?",
      alt: "Earth seen from space, with the words “Why do ice ages come and go?”",
    });
    expect(pageCard("nl", "home")!.title).toBe(
      getContent("nl").home.hero.title,
    );
    expect(pageCard("sr", "learn-precession")!.title).toBe(
      getTopics("sr").find((topic) => topic.slug === "precession")!.title,
    );
    // The portrait stays with the page about Milanković and its author.
    expect(
      PAGE_CARDS.filter((card) => pageCard("en", card)!.picture === "portrait"),
    ).toEqual(["about"]);
  });
});

describe("preview tags", () => {
  it.each(pages)(
    "$locale $path has a full-size card with a description",
    ({ locale, path }) => {
      const card = pageCard(locale, cardForPath(path))!;
      const { url, image, twitter } = preview(
        pageMetadata({ locale, path, title: "Title", description: "Text" }),
      );
      const prefix = locale === "en" ? "" : `/${locale}`;
      expect(url).toBe(path === "/" ? prefix || "/" : `${prefix}${path}`);
      expect(image).toMatchObject({
        url: `${prefix}/card/${cardForPath(path)}.jpg`,
        width: 1200,
        height: 630,
        alt: card.alt,
      });
      expect(image.alt).toContain(card.title);
      expect(twitter.card).toBe("summary_large_image");
      expect(twitter.images[0]).toMatchObject({
        url: image.url,
        alt: image.alt,
      });
    },
  );

  it("describe a shared state of a page without moving its canonical address", () => {
    const metadata = pageMetadata({
      locale: "nl",
      path: "/lab",
      title: "Baanlab",
      description: "Tekst",
      share: {
        path: "/lab?t=-21",
        title: "Baanlab: 21.000 jaar geleden",
        description: "470 W/m²",
        card: "lab-t-21",
        alt: "Kaart",
      },
    });
    expect(metadata.title).toBe("Baanlab");
    expect(metadata.alternates?.canonical).toBe("/nl/lab");
    expect(preview(metadata)).toMatchObject({
      url: "/nl/lab?t=-21",
      image: {
        url: "/nl/card/lab-t-21.jpg",
        width: 1200,
        height: 630,
        alt: "Kaart",
      },
      twitter: { card: "summary_large_image" },
    });
    expect(metadata.openGraph).toMatchObject({
      title: "Baanlab: 21.000 jaar geleden · Milanković-cycli",
      description: "470 W/m²",
    });
  });

  it("carry the site name, language and kind of page", () => {
    expect(
      previewMetadata({
        locale: "sr",
        url: "/sr",
        title: "Naslov",
        description: "Tekst",
        card: "home",
        alt: "Opis",
      }).openGraph,
    ).toMatchObject({
      siteName: "Milankovićevi ciklusi",
      locale: "sr_RS",
      type: "website",
    });
  });
});
