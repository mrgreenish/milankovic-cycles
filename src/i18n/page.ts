import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

/** Title, description, canonical address and language alternates for a page. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  type,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  type?: "article";
}): Metadata {
  const { site } = getContent(locale);
  const url = localePath(locale, path);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      title: `${title} · ${site.name}`,
      description,
      url,
      locale: OG_LOCALE[locale],
      ...(type ? { type } : {}),
    },
  };
}
