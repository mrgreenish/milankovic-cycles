import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { LEARN_TOPICS } from "@/lib/learn/topics";

const description =
  "Clear, source-backed guides to eccentricity, obliquity, precession, 65°N summer insolation, and modern climate change.";

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
          <p className="eyebrow">The Orbital Climate Guide</p>
          <h1>Understand Each Milanković Cycle</h1>
          <p className="page-lede">
            Start with one motion, then connect the full pattern. These concise guides separate
            astronomical geometry, seasonal sunlight, climate feedbacks, and modern warming.
          </p>
        </header>

        <section className="topic-grid" aria-labelledby="topic-grid-title">
          <div className="section-heading">
            <p className="eyebrow">Five Focused Guides</p>
            <h2 id="topic-grid-title">Choose a question</h2>
          </div>
          <div className="topic-grid__items">
            {LEARN_TOPICS.map((topic, index) => (
              <Link className="topic-card" href={`/learn/${topic.slug}`} key={topic.slug}>
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

        <section className="authority-panel">
          <p className="eyebrow">A Family Thread Through Science</p>
          <h2>Explained by Milutin Milanković’s great-grandson</h2>
          <p>
            Filip van Harreveld built this project to make his great-grandfather’s patient
            calculations tangible for a new generation—combining original scientific sources,
            transparent equations, visual storytelling, and an interactive orbital lab.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/about">Read the family story</Link>
            <Link className="button button--secondary" href="/educators">For educators &amp; publishers</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
