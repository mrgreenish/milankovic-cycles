import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LEARN_TOPICS, TOPIC_BY_SLUG } from "@/lib/learn/topics";

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return LEARN_TOPICS.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = TOPIC_BY_SLUG[slug];

  if (!topic) return {};

  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: `/learn/${topic.slug}` },
    openGraph: {
      title: `${topic.title} · Milanković Cycles`,
      description: topic.description,
      type: "article",
      url: `/learn/${topic.slug}`,
    },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = TOPIC_BY_SLUG[slug];

  if (!topic) notFound();

  const relatedTopics = LEARN_TOPICS.filter((item) => item.slug !== topic.slug);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.description,
    mainEntityOfPage: `https://milankovitchcycles.com/learn/${topic.slug}`,
    author: {
      "@type": "Person",
      name: "Filip van Harreveld",
      url: "https://milankovitchcycles.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "Milanković Cycles",
      url: "https://milankovitchcycles.com",
    },
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page topic-page">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/learn">Learn</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{topic.shortTitle}</span>
        </nav>

        <article>
          <header className="page-hero topic-hero">
            <p className="eyebrow">{topic.eyebrow}</p>
            <h1>{topic.title}</h1>
            <p className="page-lede">{topic.answer}</p>
            <p className="topic-period">{topic.period}</p>
          </header>

          <section className="topic-facts" aria-label="Key facts">
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
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </section>
            ))}
          </div>

          <section className="topic-action">
            <div>
              <p className="eyebrow">See the Geometry Move</p>
              <h2>Test real orbital configurations</h2>
              <p>Change eccentricity, tilt, and precession, then compare summer sunlight at 65°N.</p>
            </div>
            <Link className="button button--primary" href="/lab">Open the Orbital Lab</Link>
          </section>

          <section className="topic-faq" aria-labelledby="topic-faq-title">
            <p className="eyebrow">Quick Answers</p>
            <h2 id="topic-faq-title">Common questions</h2>
            {topic.questions.map((item) => (
              <details key={item.question}>
                <summary><span>{item.question}</span><span aria-hidden="true">+</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </section>

          <aside className="article-author" aria-label="About the author">
            <p className="eyebrow">About This Project</p>
            <h2>Created by Milutin Milanković’s great-grandson</h2>
            <p>
              Filip van Harreveld combines design, software, and his family connection to make
              Milutin Milanković’s scientific legacy clear, visual, and useful to curious beginners.
            </p>
            <Link href="/about">Read Filip’s story →</Link>
          </aside>
        </article>

        <section className="related-topics" aria-labelledby="related-title">
          <p className="eyebrow">Keep Exploring</p>
          <h2 id="related-title">Related guides</h2>
          <div>
            {relatedTopics.map((item) => (
              <Link href={`/learn/${item.slug}`} key={item.slug}>{item.shortTitle}<span aria-hidden="true">→</span></Link>
            ))}
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
