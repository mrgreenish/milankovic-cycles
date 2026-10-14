export const LOCALES = ["en", "nl", "sr"] as const;
export type Locale = (typeof LOCALES)[number];

/** English is served without a prefix; the other languages live under /nl and /sr. */
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Each language is named in itself, so a reader can find theirs. */
export const LOCALE_NAMES: Record<Locale, { name: string; short: string }> = {
  en: { name: "English", short: "EN" },
  nl: { name: "Nederlands", short: "NL" },
  sr: { name: "Srpski", short: "SR" },
};

/** BCP 47 tags. Serbian is written in Latin script only. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  nl: "nl",
  sr: "sr-Latn",
};

export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  nl: "nl_NL",
  sr: "sr_RS",
};

/** Prefix a site path with its language. `/lab?t=-21` becomes `/nl/lab?t=-21`. */
export function localePath(locale: Locale, path: string) {
  if (locale === DEFAULT_LOCALE) return path;
  if (path === "/") return `/${locale}`;
  return path.startsWith("/?") || path.startsWith("/#")
    ? `/${locale}${path.slice(1)}`
    : `/${locale}${path}`;
}

/** The site path without its language prefix. */
export function stripLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first) && first !== DEFAULT_LOCALE)
    return `/${rest.join("/")}`;
  return pathname;
}

export function localeFromPathname(pathname: string): Locale {
  const first = pathname.split("/")[1];
  return first && isLocale(first) ? first : DEFAULT_LOCALE;
}

/** Alternates for `<link rel="alternate" hreflang>` on a given site path. */
export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(
      LOCALES.map((locale) => [HTML_LANG[locale], localePath(locale, path)]),
    ),
    "x-default": localePath(DEFAULT_LOCALE, path),
  };
}
