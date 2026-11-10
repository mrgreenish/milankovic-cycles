import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  CARD_SIZE,
  CARD_TYPE,
  cardForPath,
  cardUrl,
  pageCard,
} from "@/lib/social/cards";
import {
  OG_LOCALE,
  isLocale,
  languageAlternates,
  localePath,
  type Locale,
} from "./config";
import { getContent } from "./content";

export type LocaleParams = { params: Promise<{ locale: string }> };

/** The language of the page being rendered; an unknown one is a 404. */
export async function resolveLocale({ params }: LocaleParams): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

/**
 * The tags a chat app, school platform or social site reads to preview a
 * link. Next.js replaces a layout's `openGraph` with a page's instead of
 * merging the two, so every page states all of it, the image included.
 */
export function previewMetadata({
  locale,
  url,
  title,
  description,
  type = "website",
  card,
  alt,
}: {
  locale: Locale;
  /** The address the preview stands for, already in the page's language. */
  url: string;
  title: string;
  description: string;
  type?: "website" | "article";
  /** A card name served by `app/[locale]/card/[card]`, with its description. */
  card: string;
  alt: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = { url: cardUrl(locale, card), ...CARD_SIZE, alt };
  return {
    openGraph: {
      title,
      description,
      url,
      siteName: getContent(locale).site.name,
      locale: OG_LOCALE[locale],
      type,
      images: [{ ...image, type: CARD_TYPE }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/** Title, description, canonical address, language alternates and preview for a page. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  type,
  share,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  type?: "article";
  /**
   * A preview of its own for one state of the page, such as a shared lab
   * setup. The page's title, description and canonical address stay as they
   * are; only what a link preview shows changes.
   */
  share?: {
    /** The shared address, without the language prefix. */
    path: string;
    title: string;
    description: string;
    card: string;
    alt: string;
  };
}): Metadata {
  const { site } = getContent(locale);
  const card = cardForPath(path);
  return {
    title,
    description,
    alternates: {
      canonical: localePath(locale, path),
      languages: languageAlternates(path),
    },
    ...previewMetadata({
      locale,
      url: localePath(locale, share?.path ?? path),
      title: `${share?.title ?? title} · ${site.name}`,
      description: share?.description ?? description,
      type,
      card: share?.card ?? card,
      // Every page has a card; the title stands in if one is ever missing.
      alt: share?.alt ?? pageCard(locale, card)?.alt ?? title,
    }),
  };
}
