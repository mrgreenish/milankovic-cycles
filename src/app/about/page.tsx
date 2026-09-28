import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Why I built this",
  description:
    "Filip van Harreveld on his great-grandfather Milutin Milanković and building a way to explore his work.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Why I built this · Milanković Cycles",
    description:
      "Filip van Harreveld on his great-grandfather Milutin Milanković and the idea behind this project.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page">
        <section className="about-hero">
          <div className="about-portrait">
            <Image
              src="/miltin-milankovic.jpg"
              alt="Portrait of Milutin Milanković"
              width={537}
              height={776}
              sizes="(max-width: 760px) 88vw, 38vw"
              priority
            />
            <p>Milutin Milanković · 1879–1958</p>
          </div>
          <div>
            <p className="eyebrow">A family connection</p>
            <h1>Why I built this</h1>
            <p className="page-lede">
              Milutin Milanković was my great-grandfather. I built this site to
              share an idea he spent much of his life working on: how changes in
              Earth&apos;s orbit affect its climate.
            </p>
            <p>
              He spent decades calculating how sunlight changes across seasons
              and latitudes as Earth&apos;s orbit and axis slowly shift. His
              work helped establish the astronomical pacing of glacial and
              interglacial cycles.
            </p>
            <p>
              I work with design and software. Here, you can change the orbit
              and tilt yourself, and see how the amount of summer sunlight
              changes. That is how I wanted to explain his work.
            </p>
            <p className="signature-block">
              <strong>Filip van Harreveld</strong>
              <span>
                Creative developer &amp; great-grandson of Milutin Milanković
              </span>
            </p>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">About the project</p>
            <h2>Built for curious beginners</h2>
          </div>
          <div>
            <p>
              The tour introduces the three orbital motions. The lab lets you
              combine them and compare dates from the La2004 astronomical
              solution. It calculates summer sunlight; it does not predict
              temperature or ice-sheet size.
            </p>
            <p>
              The scene exaggerates orbit shape when requested because real
              eccentricity is almost impossible to see at screen scale. Every
              calculation still uses the true value.
            </p>
            <div className="button-row">
              <Link className="button button--primary" href="/">
                Start the tour
              </Link>
              <Link className="button button--secondary" href="/sources">
                Read the method
              </Link>
            </div>
          </div>
        </section>

        <section className="contact-card">
          <div>
            <p className="eyebrow">Questions or corrections?</p>
            <h2>Help make it better</h2>
          </div>
          <p>
            If you notice an inaccuracy, have a useful source, or want to get in
            touch, you can reach me through{" "}
            <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
