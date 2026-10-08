import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Why I built this",
  description:
    "Filip van Harreveld on his great-grandfather Milutin Milanković, and why he built a 3D way to explore his work.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Why I built this · Milanković Cycles",
    description:
      "Filip van Harreveld on his great-grandfather Milutin Milanković, and why he built a 3D way to explore his work.",
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
            <p className="eyebrow">My great-grandfather’s work</p>
            <h1>Why I built this</h1>
            <p className="page-lede">
              Milutin Milanković was my great-grandfather. I built this site so
              people can see what he spent decades calculating: how small
              changes in Earth’s orbit shift the sunlight reaching the far
              north, and how that paced the ice ages.
            </p>
            <p>
              He did the work by hand, with pen and paper, working out the
              sunlight at every latitude through the seasons. He published the
              full theory in 1941. It stayed disputed for decades. In 1976,
              seabed sediment showed the same rhythms he had calculated. He had
              died in 1958.
            </p>
            <p>
              I work in design and software. This is how I wanted to explain
              his work: you stretch the orbit, lean the axis and wobble it
              yourself, and watch what happens to summer sunlight at 65°N.
            </p>
            <p className="signature-block">
              <strong>Filip van Harreveld</strong>
              <span>Creative developer · Great-grandson of Milutin Milanković</span>
            </p>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div>
            <p className="eyebrow">About the project</p>
            <h2>How it works</h2>
          </div>
          <div>
            <p>
              The tour introduces the three motions one at a time and then runs
              them together over 800,000 years. The lab lets you set them
              yourself, or jump to dates from the La2004 orbit solution. It
              calculates sunlight at 65°N and adds a rough estimate of ice and
              global temperature. The estimate is not a forecast.
            </p>
            <p>
              The scene draws the orbit’s shape five times too stretched by
              default, because the real orbit looks like a circle at screen
              size. Every calculation uses the true values.
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
            <p className="eyebrow">Corrections</p>
            <h2>Found a mistake?</h2>
          </div>
          <p>
            If you spot an error, know a better source, or want to talk about
            the project, write to me through{" "}
            <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
