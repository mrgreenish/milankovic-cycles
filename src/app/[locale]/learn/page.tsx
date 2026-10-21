import type { Metadata } from "next";
import { QuietLink } from "@/components/site/QuietLink";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { localePath } from "@/i18n/config";
import { getContent, getTopics } from "@/i18n/content";
import {
  pageMetadata,
  resolveLocale,
  type LocaleParams,
} from "@/i18n/page";
import { Slots } from "@/i18n/rich";

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { meta } = getContent(locale).learn;
  return {
    ...pageMetadata({ locale, path: "/learn", ...meta }),
  };
}

export default async function LearnPage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const { learn: text } = getContent(locale);
  const path = (href: string) => localePath(locale, href);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page learn-hub">
        <header className="page-hero">
          <p className="eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p className="page-lede">{text.lede}</p>
        </header>

        <section className="topic-grid" aria-labelledby="topic-grid-title">
          <div className="section-heading">
            <p className="eyebrow">{text.gridEyebrow}</p>
            <h2 id="topic-grid-title">{text.gridTitle}</h2>
          </div>
          <div className="topic-grid__items">
            {getTopics(locale).map((topic, index) => (
              <QuietLink
                className="topic-card"
                href={path(`/learn/${topic.slug}`)}
                key={topic.slug}
              >
                <span>0{index + 1}</span>
                <div>
                  <h3>{topic.shortTitle}</h3>
                  <p>{topic.description}</p>
                </div>
                <b aria-hidden="true">→</b>
              </QuietLink>
            ))}
          </div>
        </section>

        <aside className="article-author">
          <p>
            <Slots
              text={text.authorLine}
              slots={{
                link: <QuietLink href={path("/about")}>{text.authorName}</QuietLink>,
              }}
            />
          </p>
          <QuietLink href={path("/educators")}>{text.educatorsLink}</QuietLink>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
