import type { Metadata } from "next";
import { QuietLink } from "@/components/site/QuietLink";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
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
  const { meta } = getContent(locale).educators;
  return pageMetadata({ locale, path: "/educators", ...meta });
}

const useLinks = ["/", "/lab", "/learn", "/sources"] as const;

export default async function EducatorsPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const { educators: text } = getContent(locale);
  const path = (href: string) => localePath(locale, href);
  const contact = (
    <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>
  );
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page educators-page">
        <header className="page-hero">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="page-lede">{text.lede}</p>
          <div className="button-row">
            <QuietLink className="button button--primary" href={path("/")}>
              {text.startTour}
            </QuietLink>
            <QuietLink className="button button--secondary" href={path("/sources")}>
              {text.reviewSources}
            </QuietLink>
          </div>
        </header>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">{text.experimentEyebrow}</p>
            <h2>{text.experimentTitle}</h2>
          </div>
          <div>
            {text.experiment.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="outreach-grid" aria-labelledby="use-title">
          <div className="section-heading">
            <p className="eyebrow">{text.useEyebrow}</p>
            <h2 id="use-title">{text.useTitle}</h2>
          </div>
          <div className="outreach-grid__items">
            {text.uses.map((item, index) => (
              <article key={item.title}>
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <QuietLink href={path(useLinks[index])}>{item.link}</QuietLink>
              </article>
            ))}
          </div>
        </section>

        <section className="citation-panel">
          <p className="eyebrow">{text.citationEyebrow}</p>
          <h2>{text.citationTitle}</h2>
          <p>
            Van Harreveld, Filip. <em>{text.citationTitleOfWork}</em>{" "}
            <a href="https://milankovitchcycles.com">milankovitchcycles.com</a>.
          </p>
          <p className="citation-panel__note">{text.citationNote}</p>
        </section>

        <section className="contact-card">
          <div>
            <p className="eyebrow">{text.contactEyebrow}</p>
            <h2>{text.contactTitle}</h2>
          </div>
          <p>
            <Slots text={text.contactBody} slots={{ link: contact }} />
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
