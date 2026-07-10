import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of Milutin Milanković, his great-grandson Filip van Harreveld, and this visual science project.",
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
            <p className="eyebrow">A Family Thread Through Science</p>
            <h1>Inspired by Milutin Milanković</h1>
            <p className="page-lede">
              Milutin turned patient calculation into a new way of seeing Earth&apos;s climate.
              As his great-grandson, I wanted to make that idea tangible for a new generation.
            </p>
            <p>
              He spent decades calculating how sunlight changes across seasons and latitudes as
              Earth&apos;s orbit and axis slowly shift. His work helped establish the astronomical
              pacing of glacial and interglacial cycles.
            </p>
            <p>
              My own tools are design, software, and interactive storytelling. This project is
              where those skills meet his legacy: not a monument, but an invitation to understand
              the idea by moving it yourself.
            </p>
            <p className="signature-block"><strong>Filip van Harreveld</strong><span>Creative developer &amp; great-grandson of Milutin Milanković</span></p>
          </div>
        </section>

        <section className="editorial-section editorial-grid">
          <div><p className="eyebrow">About the Project</p><h2>Built for curious beginners</h2></div>
          <div>
            <p>
              The guided tour uses plain language first and scientific terminology beside it.
              The Lab uses the La2004 astronomical solution and a transparent summer-insolation
              calculation rather than pretending to predict temperature or ice-sheet size.
            </p>
            <p>
              The scene exaggerates orbit shape when requested because real eccentricity is almost
              impossible to see at screen scale. Every calculation still uses the true value.
            </p>
            <div className="button-row">
              <Link className="button button--primary" href="/">Start the Tour</Link>
              <Link className="button button--secondary" href="/sources">Read the Method</Link>
            </div>
          </div>
        </section>

        <section className="contact-card">
          <div><p className="eyebrow">Questions or Corrections?</p><h2>Help make it better</h2></div>
          <p>
            Scientific clarity matters here. If you notice an inaccuracy or have a useful source,
            contact Filip through <a href="https://filipvanharreveld.com">filipvanharreveld.com</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

