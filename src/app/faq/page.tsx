import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Clear answers about Milanković cycles, ice ages, 65°N, and modern warming.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions · Milanković Cycles",
    description: "Clear answers about Milanković cycles, ice ages, 65°N, and modern warming.",
    url: "/faq",
  },
};

const questions = [
  {
    id: "what-are-milankovic-cycles",
    question: "What are Milanković cycles?",
    answer:
      "They are slow, predictable changes in Earth’s orbit shape, axis tilt, and axis direction. Together they redistribute incoming sunlight by season and latitude over tens of thousands of years.",
  },
  {
    id: "why-65-north",
    question: "Why does the experience focus on 65° North?",
    answer:
      "Large Northern Hemisphere ice sheets grew around high northern latitudes. If summer there is cool enough that winter snow does not fully melt, snow can accumulate over many years. That makes northern summer sunlight near 65°N a classic indicator of orbital forcing.",
  },
  {
    id: "does-eccentricity-cause-ice-ages",
    question: "Does the 100,000-year eccentricity cycle cause ice ages by itself?",
    answer:
      "No. Eccentricity changes Earth–Sun distance contrast and modulates precession, but its effect on global annual sunlight is small. Ice-age timing emerges from the combined orbital signal and a climate system with ice, ocean, carbon, and other feedbacks.",
  },
  {
    id: "precession-period",
    question: "Is precession a 26,000-year or 23,000-year cycle?",
    answer:
      "Earth’s axial precession alone is about 25,772 years. The orbital ellipse also rotates. Their combined climatic precession signal averages about 23,000 years, with important components near 19,000 and 23,000 years.",
  },
  {
    id: "is-the-orbit-to-scale",
    question: "Is the orbit shown to scale?",
    answer:
      "The Lab defaults to a clearly labeled 5× exaggeration because real changes in eccentricity are nearly invisible on a screen. Choose Actual Scale to see the physical geometry. All numerical calculations always use the real eccentricity.",
  },
  {
    id: "is-this-a-climate-prediction",
    question: "Does the Lab predict temperature or future ice sheets?",
    answer:
      "No. It calculates daily-mean sunlight at the top of the atmosphere for a specific latitude and season. The snow-survival wording is a conditional orbital tendency, not a temperature, ice-volume, or future-climate prediction.",
  },
  {
    id: "modern-warming",
    question: "Do Milanković cycles explain modern climate change?",
    answer:
      "No. Orbital cycles work over tens of thousands of years and cannot explain the speed or pattern of current warming. Today’s rapid warming is driven primarily by human greenhouse-gas emissions.",
  },
  {
    id: "data-sources",
    question: "Where do the historical orbital values come from?",
    answer:
      "The four presets use exact nodes from the peer-reviewed La2004 astronomical solution. The Sources page lists the input files, equations, reference values, and limitations.",
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page editorial-page--narrow">
        <header className="page-hero">
          <p className="eyebrow">Deeper Questions</p>
          <h1>Frequently Asked Questions</h1>
          <p className="page-lede">
            The short version is in the tour. Here are the details people usually ask next.
          </p>
        </header>
        <section className="faq-list" aria-label="Milanković cycle questions">
          {questions.map((item) => (
            <details key={item.id} id={item.id}>
              <summary><span>{item.question}</span><span aria-hidden="true">+</span></summary>
              <div><p>{item.answer}</p></div>
            </details>
          ))}
        </section>
        <div className="page-end-cta">
          <p>Want to see the answer move?</p>
          <Link className="button button--primary" href="/">Return to the Tour</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
