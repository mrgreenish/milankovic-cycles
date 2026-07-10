import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

const description =
  "A source-backed, interactive Milanković cycles resource for teachers, science communicators, journalists, and educational publishers.";

export const metadata: Metadata = {
  title: "For Educators & Publishers",
  description,
  alternates: { canonical: "/educators" },
  openGraph: {
    title: "For Educators & Publishers · Milanković Cycles",
    description,
    url: "/educators",
  },
};

export default function EducatorsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page educators-page">
        <header className="page-hero">
          <p className="eyebrow">Teach · Cite · Share</p>
          <h1>A Living Guide to Milutin Milanković’s Climate Legacy</h1>
          <p className="page-lede">
            Built by his great-grandson Filip van Harreveld, this free visual project helps
            learners move from “three orbital cycles” to a physically accurate understanding of
            seasonal sunlight, ice sheets, and modern climate change.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/">Start the visual tour</Link>
            <Link className="button button--secondary" href="/sources">Review the sources</Link>
          </div>
        </header>

        <section className="editorial-section editorial-grid">
          <div><p className="eyebrow">Why It Is Different</p><h2>Family history meets transparent science</h2></div>
          <div>
            <p>
              Milutin Milanković spent decades calculating how Earth’s orbit and axis redistribute
              sunlight. Filip’s tools are design and software. This project brings those threads
              together without turning a family story into a substitute for evidence.
            </p>
            <p>
              Every calculation is separated from climate prediction, the orbital presets trace
              to the peer-reviewed La2004 astronomical solution, and the project states clearly
              that orbital cycles do not explain today’s rapid human-caused warming.
            </p>
          </div>
        </section>

        <section className="outreach-grid" aria-labelledby="use-title">
          <div className="section-heading">
            <p className="eyebrow">Ready to Use</p>
            <h2 id="use-title">Ways to use the project</h2>
          </div>
          <div className="outreach-grid__items">
            <article><span>01</span><h3>Classroom introduction</h3><p>Use the guided tour before asking students to compare the three orbital motions.</p><Link href="/">Open the tour →</Link></article>
            <article><span>02</span><h3>Interactive investigation</h3><p>Let learners change real orbital inputs and discuss what the 65°N result can—and cannot—show.</p><Link href="/lab">Open the lab →</Link></article>
            <article><span>03</span><h3>Background reading</h3><p>Assign one focused guide on eccentricity, obliquity, precession, insolation, or modern warming.</p><Link href="/learn">Browse the guides →</Link></article>
            <article><span>04</span><h3>Science communication</h3><p>Link directly to a visual explanation backed by equations, limitations, and primary references.</p><Link href="/sources">Review the method →</Link></article>
          </div>
        </section>

        <section className="citation-panel">
          <p className="eyebrow">Suggested Citation</p>
          <h2>Link to the most useful page</h2>
          <p>
            Van Harreveld, Filip. <em>Milanković Cycles: Why Ice Ages Come and Go.</em>{" "}
            <a href="https://milankovitchcycles.com">milankovitchcycles.com</a>.
          </p>
          <p className="citation-panel__note">
            Deep links to individual Learn guides are encouraged when they better match your
            lesson, article, newsletter, or resource list.
          </p>
        </section>

        <section className="contact-card">
          <div><p className="eyebrow">Invite a Conversation</p><h2>Questions, interviews, or classroom feedback?</h2></div>
          <p>
            Filip welcomes thoughtful educational use, corrections, and conversations about
            making Milanković’s work accessible. Contact him through{" "}
            <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
