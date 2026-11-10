import { localePath, type Locale } from "@/i18n/config";
import { getContent, getTopic } from "@/i18n/content";
import { fill } from "@/i18n/format";
import { getUi } from "@/i18n/ui";
import { TOPIC_SLUGS } from "@/lib/learn/topics";

/**
 * Preview cards: the image a chat app, school platform or search result shows
 * beside a link to the site. Every page has one, drawn by the route in
 * `app/[locale]/card/[card]`. This file says what each card shows.
 */
export const CARD_SIZE = { width: 1200, height: 630 } as const;
export const CARD_TYPE = "image/jpeg";

/** One card per page. These are drawn when the site is built. */
export const PAGE_CARDS = [
  "home",
  "lab",
  "learn",
  ...TOPIC_SLUGS.map((slug) => `learn-${slug}`),
  "about",
  "educators",
  "faq",
  "sources",
] as const;

export type PageCard = {
  picture: "globe" | "portrait";
  eyebrow?: string;
  title: string;
  /** A line under the title. */
  note?: string;
  alt: string;
};

/** The card for a site path: `/` is `home`, `/learn/precession` is `learn-precession`. */
export function cardForPath(path: string) {
  return path === "/" ? "home" : path.slice(1).replaceAll("/", "-");
}

/** Where a card is served, in the page's language. */
export function cardUrl(locale: Locale, card: string) {
  return localePath(locale, `/card/${card}.jpg`);
}

export function pageCard(locale: Locale, card: string): PageCard | null {
  const { site, home, about, educators, faq, learn, sources } =
    getContent(locale);
  const ui = getUi(locale);
  const globe = (
    title: string,
    rest: Pick<PageCard, "eyebrow" | "note"> = {},
  ): PageCard => ({
    picture: "globe",
    title,
    alt: fill(site.cardAlt, { picture: site.globeAlt, title }),
    ...rest,
  });
  switch (card) {
    case "home":
      return globe(home.hero.title);
    case "lab":
      return globe(ui.lab.title, {
        eyebrow: ui.lab.eyebrow,
        note: ui.lab.intro,
      });
    case "learn":
      return globe(learn.title, { eyebrow: learn.eyebrow });
    case "about":
      return {
        picture: "portrait",
        eyebrow: about.eyebrow,
        title: about.title,
        note: about.portraitCaption,
        alt: fill(site.cardAlt, {
          picture: site.portraitAlt,
          title: about.title,
        }),
      };
    case "educators":
      return globe(educators.title, { eyebrow: educators.eyebrow });
    case "faq":
      return globe(faq.title, { eyebrow: faq.eyebrow });
    case "sources":
      return globe(sources.title, { eyebrow: sources.eyebrow });
  }
  const topic = card.startsWith("learn-")
    ? getTopic(locale, card.slice("learn-".length))
    : undefined;
  return topic ? globe(topic.title, { eyebrow: topic.eyebrow }) : null;
}
