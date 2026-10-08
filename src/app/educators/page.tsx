import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

const description =
  "Classroom experiments, background reading and citation details for teaching Milanković cycles.";

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
            Ask learners to predict, move a slider, then explain what
            happened. The tour and the lab are free to use in lessons on
            seasons, sunlight and ice ages.
          </p>
          <div className="button-row">
            <Link className="button button--primary" href="/">
              Start the tour
            </Link>
            <Link className="button button--secondary" href="/sources">
              Review the sources
            </Link>
          </div>
        </header>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">A first experiment</p>
            <h2>Predict, then test</h2>
          </div>
          <div>
            <p>
              Start with today’s settings. Ask whether a bigger tilt gives 65°N
              more or less sunlight in summer, then try both tilt buttons and
              write down the numbers. Discuss why: longer days and a higher Sun.
            </p>
            <p>
              Next, keep the tilt fixed and change where summer falls on the
              orbit, so learners isolate the effect of distance. Copy a link for
              each setup to share it. Remind them that the number is sunlight,
              and that ice also depends on oceans and greenhouse gases.
            </p>
            <p>
              Then press play on the clock in the lab. Ask learners to compare
              the sunlight curve with the ice line and describe the delay.
            </p>
          </div>
        </section>

        <section className="outreach-grid" aria-labelledby="use-title">
          <div className="section-heading">
            <p className="eyebrow">In the classroom</p>
            <h2 id="use-title">Ways to use it</h2>
          </div>
          <div className="outreach-grid__items">
            <article>
              <span>01</span>
              <h3>Introduce the topic</h3>
              <p>
                Run the tour before students compare the three motions.
              </p>
              <Link href="/">Open the tour →</Link>
            </article>
            <article>
              <span>02</span>
              <h3>Investigate</h3>
              <p>
                Let learners change real orbital values, or travel in time,
                and discuss what the 65°N number does and does not show.
              </p>
              <Link href="/lab">Open the lab →</Link>
            </article>
            <article>
              <span>03</span>
              <h3>Read further</h3>
              <p>
                Assign one guide: orbit shape, tilt, precession, the 65°N
                yardstick or modern warming.
              </p>
              <Link href="/learn">Browse the guides →</Link>
            </article>
            <article>
              <span>04</span>
              <h3>Check the method</h3>
              <p>
                Every figure comes with its equations, data sources and limits.
              </p>
              <Link href="/sources">Read the method →</Link>
            </article>
          </div>
        </section>

        <section className="citation-panel">
          <p className="eyebrow">Citation</p>
          <h2>How to cite</h2>
          <p>
            Van Harreveld, Filip.{" "}
            <em>Milanković Cycles: Why Ice Ages Come and Go.</em>{" "}
            <a href="https://milankovitchcycles.com">milankovitchcycles.com</a>.
          </p>
          <p className="citation-panel__note">
            Links to a single guide are welcome when it fits your lesson,
            article, newsletter or reading list better.
          </p>
        </section>

        <section className="contact-card">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>Questions or feedback?</h2>
          </div>
          <p>
            For questions about using the project, corrections or interviews,
            write to Filip through{" "}
            <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
