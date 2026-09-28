import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

const description =
  "Classroom experiments, background reading, and citation information for teaching Milanković cycles.";

export const metadata: Metadata = {
  title: "For educators and publishers",
  description,
  alternates: { canonical: "/educators" },
  openGraph: {
    title: "For educators and publishers · Milanković Cycles",
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
          <p className="eyebrow">For educators</p>
          <h1>Teach the cycles by changing them</h1>
          <p className="page-lede">
            Ask learners to predict a change, move a slider, and explain the
            result. The tour and lab are free to use in lessons about seasons,
            sunlight, and ice ages.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/">
              Start the visual tour
            </Link>
            <Link className="button button--secondary" href="/sources">
              Review the sources
            </Link>
          </div>
        </header>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">A classroom experiment</p>
            <h2>Predict, change, compare</h2>
          </div>
          <div>
            <p>
              Start with today’s settings. Ask whether increasing Earth’s tilt
              will give 65°N more or less sunlight in summer. Try both tilt
              buttons, record the results, and discuss how longer days and a
              higher Sun affect the answer.
            </p>
            <p>
              Next, change when summer falls along the orbit. Keep tilt fixed so
              learners can isolate the effect of distance. Copy a link to share
              each setup. Explain that the result measures sunlight, while
              climate also depends on ice, oceans, and greenhouse gases.
            </p>
          </div>
        </section>

        <section className="outreach-grid" aria-labelledby="use-title">
          <div className="section-heading">
            <p className="eyebrow">In the classroom</p>
            <h2 id="use-title">Ways to use the project</h2>
          </div>
          <div className="outreach-grid__items">
            <article>
              <span>01</span>
              <h3>Classroom introduction</h3>
              <p>
                Use the guided tour before asking students to compare the three
                orbital motions.
              </p>
              <Link href="/">Open the tour →</Link>
            </article>
            <article>
              <span>02</span>
              <h3>Interactive investigation</h3>
              <p>
                Let learners change real orbital inputs and discuss what the
                65°N result can—and cannot—show.
              </p>
              <Link href="/lab">Open the lab →</Link>
            </article>
            <article>
              <span>03</span>
              <h3>Background reading</h3>
              <p>
                Assign one focused guide on eccentricity, obliquity, precession,
                insolation, or modern warming.
              </p>
              <Link href="/learn">Browse the guides →</Link>
            </article>
            <article>
              <span>04</span>
              <h3>Science communication</h3>
              <p>
                Link directly to a visual explanation backed by equations,
                limitations, and primary references.
              </p>
              <Link href="/sources">Review the method →</Link>
            </article>
          </div>
        </section>

        <section className="citation-panel">
          <p className="eyebrow">Suggested citation</p>
          <h2>Link to the most useful page</h2>
          <p>
            Van Harreveld, Filip.{" "}
            <em>Milanković Cycles: Why Ice Ages Come and Go.</em>{" "}
            <a href="https://milankovitchcycles.com">milankovitchcycles.com</a>.
          </p>
          <p className="citation-panel__note">
            Deep links to individual Learn guides are encouraged when they
            better match your lesson, article, newsletter, or resource list.
          </p>
        </section>

        <section className="contact-card">
          <div>
            <p className="eyebrow">Get in touch</p>
            <h2>Questions, interviews, or classroom feedback?</h2>
          </div>
          <p>
            For questions about using the project, corrections, or interviews,
            contact Filip through{" "}
            <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
