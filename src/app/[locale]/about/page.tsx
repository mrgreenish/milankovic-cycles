import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { localePath } from "@/i18n/config";
import { getContent } from "@/i18n/content";
import {
  pageMetadata,
  resolveLocale,
  type LocaleParams,
} from "@/i18n/page";
import { Slots } from "@/i18n/rich";

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { meta } = getContent(locale).about;
  return pageMetadata({ locale, path: "/about", ...meta });
}

export default async function AboutPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const { about: text, site } = getContent(locale);
  const path = (href: string) => localePath(locale, href);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page">
        <section className="about-hero">
          <div className="about-portrait">
            <Image
              src="/miltin-milankovic.jpg"
              alt={site.portraitAlt}
              width={537}
              height={776}
              sizes="(max-width: 760px) 88vw, 38vw"
              priority
            />
            <p>{text.portraitCaption}</p>
          </div>
          <div>
            <p className="eyebrow">{text.eyebrow}</p>
            <h1>{text.title}</h1>
            <p className="page-lede">{text.lede}</p>
            {text.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="signature-block">
              <strong>{text.signatureName}</strong>
              <span>{text.signatureRole}</span>
            </p>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">{text.projectEyebrow}</p>
            <h2>{text.projectTitle}</h2>
          </div>
          <div>
            {text.projectParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="button-row">
              <Link className="button button--primary" href={path("/")}>
                {text.startTour}
              </Link>
              <Link className="button button--secondary" href={path("/sources")}>
                {text.readMethod}
              </Link>
            </div>
          </div>
        </section>

        <section className="contact-card">
          <div>
            <p className="eyebrow">{text.contactEyebrow}</p>
            <h2>{text.contactTitle}</h2>
          </div>
          <p>
            <Slots
              text={text.contactBody}
              slots={{
                link: (
                  <a href="https://filipvanharreveld.com">
                    filipvanharreveld.com
                  </a>
                ),
              }}
            />
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
