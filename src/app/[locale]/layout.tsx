import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import {
  HTML_LANG,
  LOCALES,
  isLocale,
  languageAlternates,
  localePath,
} from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { previewMetadata } from "@/i18n/page";
import { getUi } from "@/i18n/ui";
import { SITE_URL } from "@/lib/site";
import { pageCard } from "@/lib/social/cards";
import "../globals.css";
import "../experience.css";

const switzer = localFont({
  src: "../../../public/font/Switzer-Variable.woff2",
  variable: "--font-switzer",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
  display: "swap",
});

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const { site } = getContent(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: site.title, template: site.template },
    description: site.description,
    manifest: "/manifest.json",
    alternates: {
      canonical: localePath(locale, "/"),
      languages: languageAlternates("/"),
    },
    // The tour's preview, and the one any page without its own falls back to.
    ...previewMetadata({
      locale,
      url: localePath(locale, "/"),
      title: site.title,
      description: site.ogDescription,
      card: "home",
      alt: pageCard(locale, "home")?.alt ?? site.title,
    }),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#070A12",
};

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${switzer.variable} ${fraunces.variable} ${mono.variable}`}
    >
      <body>
        <LocaleProvider locale={locale} ui={getUi(locale)}>
          {children}
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
