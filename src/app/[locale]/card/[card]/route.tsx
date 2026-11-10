import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { LOCALES, isLocale } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import { getUi } from "@/i18n/ui";
import { LabCardArt, PageCardArt } from "@/lib/social/cardArt";
import {
  cardFonts,
  globePicture,
  portraitPicture,
  toJpeg,
} from "@/lib/social/cardAssets";
import { CARD_SIZE, CARD_TYPE, PAGE_CARDS, pageCard } from "@/lib/social/cards";
import { labReading, parseLabCard } from "@/lib/social/labShare";

/**
 * Preview cards, at `/card/home.jpg`, `/nl/card/learn-precession.jpg` and so
 * on. The page cards are drawn when the site is built. A card for a shared
 * lab setup (`lab-t-21.jpg`, `lab-own-503.jpg`) is drawn the first time
 * someone asks for it and kept, so each one costs a single function run.
 */
export const dynamic = "force-static";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    PAGE_CARDS.map((card) => ({ locale, card: `${card}.jpg` })),
  );
}

const missing = () => new Response(null, { status: 404 });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string; card: string }> },
) {
  const { locale, card: file } = await params;
  if (!isLocale(locale) || !file.endsWith(".jpg")) return missing();
  const card = file.slice(0, -".jpg".length);
  const siteName = getContent(locale).site.name;

  let art: ReactElement;
  const page = pageCard(locale, card);
  const setup = page ? null : parseLabCard(card);
  if (page) {
    const picture =
      page.picture === "portrait" ? portraitPicture() : globePicture();
    art = (
      <PageCardArt card={page} siteName={siteName} picture={await picture} />
    );
  } else if (setup) {
    const ui = getUi(locale);
    art = (
      <LabCardArt
        setup={setup}
        reading={labReading(setup, ui)}
        siteName={siteName}
        ui={ui}
      />
    );
  } else return missing();

  const png = await new ImageResponse(art, {
    ...CARD_SIZE,
    fonts: await cardFonts(),
  }).arrayBuffer();
  return new Response(new Uint8Array(await toJpeg(png)), {
    headers: {
      "Content-Type": CARD_TYPE,
      // The same day of caching as the site's other images. The address does
      // not change when a card's words or the globe do, so no longer than that.
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=86400",
    },
  });
}
