import type { Metadata } from "next";
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

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { meta } = getContent(locale).faq;
  return pageMetadata({ locale, path: "/faq", ...meta });
}

export default async function FaqPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const { faq: text } = getContent(locale);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page editorial-page--narrow">
        <header className="page-hero">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="page-lede">{text.lede}</p>
        </header>
        <section className="faq-list" aria-label={text.listLabel}>
          {text.questions.map((item) => (
            <details key={item.id} id={item.id}>
              <summary>
                <span>{item.question}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </section>
        <div className="page-end-cta">
          <p>{text.endText}</p>
          <Link className="button button--primary" href={localePath(locale, "/")}>
            {text.endButton}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
