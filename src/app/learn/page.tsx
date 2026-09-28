import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LEARN_TOPICS } from "@/lib/learn/topics";

const description =
  "How orbit shape, tilt, and precession affect summer sunlight, and why they do not explain modern warming.";

export const metadata: Metadata = {
  title: "Learn the Milanković Cycles",
  description,
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Learn the Milanković Cycles",
    description,
    url: "/learn",
  },
};

export default function LearnPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page learn-hub">
        <header className="page-hero">
          <p className="eyebrow">Go a little further</p>
          <h1>How the cycles work</h1>
          <p className="page-lede">
            Explore one motion at a time, find out why northern summers matter
            for ice, or read how orbital cycles differ from modern warming.
          </p>
        </header>

        <section className="topic-grid" aria-labelledby="topic-grid-title">
          <div className="section-heading">
            <p className="eyebrow">Five guides</p>
            <h2 id="topic-grid-title">Choose a question</h2>
          </div>
          <div className="topic-grid__items">
            {LEARN_TOPICS.map((topic, index) => (
              <Link
                className="topic-card"
                href={`/learn/${topic.slug}`}
                key={topic.slug}
              >
                <span>0{index + 1}</span>
                <div>
                  <h3>{topic.shortTitle}</h3>
                  <p>{topic.description}</p>
                </div>
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </div>
        </section>

        <aside className="article-author">
          <p>
            By <Link href="/about">Filip van Harreveld</Link>, great-grandson of
            Milutin Milanković.
          </p>
          <Link href="/educators">Teaching ideas and citation →</Link>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
