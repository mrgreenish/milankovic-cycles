import type { Metadata } from "next";
import { QuietLink } from "@/components/site/QuietLink";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LOCALES, localePath } from "@/i18n/config";
import { getContent, getTopic, getTopics } from "@/i18n/content";
import { pageMetadata, resolveLocale } from "@/i18n/page";
import { Slots } from "@/i18n/rich";
import { TOPIC_SLUGS } from "@/lib/learn/topics";
import { SITE_URL } from "@/lib/site";

type TopicPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    TOPIC_SLUGS.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata(
  props: TopicPageProps,
): Promise<Metadata> {
  const locale = await resolveLocale(props);
  const { slug } = await props.params;
  const topic = getTopic(locale, slug);

  if (!topic) return {};

  return pageMetadata({
    locale,
    path: `/learn/${topic.slug}`,
    title: topic.title,
    description: topic.description,
    type: "article",
  });
}

export default async function TopicPage(props: TopicPageProps) {
  const locale = await resolveLocale(props);
  const { slug } = await props.params;
  const topic = getTopic(locale, slug);

  if (!topic) notFound();

  const { topicPage: text, learn, site } = getContent(locale);
  const path = (href: string) => localePath(locale, href);
  const relatedTopics = getTopics(locale).filter(
    (item) => item.slug !== topic.slug,
  );
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.description,
    inLanguage: locale === "sr" ? "sr-Latn" : locale,
    mainEntityOfPage: `${SITE_URL}${path(`/learn/${topic.slug}`)}`,
    author: {
      "@type": "Person",
      name: "Filip van Harreveld",
      url: `${SITE_URL}${path("/about")}`,
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: SITE_URL,
    },
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page topic-page">
        <nav className="breadcrumbs" aria-label={text.breadcrumb}>
          <QuietLink href={path("/")}>{text.home}</QuietLink>
          <span aria-hidden="true">/</span>
          <QuietLink href={path("/learn")}>{text.learn}</QuietLink>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{topic.shortTitle}</span>
        </nav>

        <article>
          <header className="page-hero topic-hero">
            <p className="eyebrow">{topic.eyebrow}</p>
            <h1>{topic.title}</h1>
            <p className="page-lede">{topic.answer}</p>
            <p className="topic-period">{topic.period}</p>
          </header>

          <section className="topic-facts" aria-label={text.factsLabel}>
            {topic.facts.map((fact) => (
              <div key={fact.title}>
                <span>{fact.label}</span>
                <h2>{fact.title}</h2>
                <p>{fact.copy}</p>
              </div>
            ))}
          </section>

          <div className="topic-body">
            {topic.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>

          <section className="topic-action">
            <div>
              <p className="eyebrow">{text.actionEyebrow}</p>
              <h2>{text.actionTitle}</h2>
              <p>{text.actionBody}</p>
            </div>
            <QuietLink className="button button--primary" href={path("/lab")}>
              {text.actionButton}
            </QuietLink>
          </section>

          <section className="topic-faq" aria-labelledby="topic-faq-title">
            <p className="eyebrow">{text.faqEyebrow}</p>
            <h2 id="topic-faq-title">{text.faqTitle}</h2>
            {topic.questions.map((item) => (
              <details key={item.question}>
                <summary>
                  <span>{item.question}</span>
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>

          <aside className="article-author" aria-label={text.authorLabel}>
            <p>
              <Slots
                text={learn.authorLine}
                slots={{
                  link: <QuietLink href={path("/about")}>{learn.authorName}</QuietLink>,
                }}
              />
            </p>
            <QuietLink href={path("/sources")}>{text.sourcesLink}</QuietLink>
          </aside>
        </article>

        <section className="related-topics" aria-labelledby="related-title">
          <p className="eyebrow">{text.relatedEyebrow}</p>
          <h2 id="related-title">{text.relatedTitle}</h2>
          <div>
            {relatedTopics.map((item) => (
              <QuietLink href={path(`/learn/${item.slug}`)} key={item.slug}>
                {item.shortTitle}
                <span aria-hidden="true">→</span>
              </QuietLink>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
