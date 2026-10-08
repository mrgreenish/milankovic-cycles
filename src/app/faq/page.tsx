import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about Milanković cycles, the ice ages, 65°N and modern warming.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently asked questions · Milanković Cycles",
    description:
      "Answers about Milanković cycles, the ice ages, 65°N and modern warming.",
    url: "/faq",
  },
};

const questions = [
  {
    id: "what-are-milankovic-cycles",
    question: "What are Milanković cycles?",
    answer:
      "Slow, regular changes in the shape of Earth’s orbit, the tilt of its axis and the direction the axis points. Over tens of thousands of years they change how much sunlight reaches each latitude in each season.",
  },
  {
    id: "why-65-north",
    question: "Why 65° North?",
    answer:
      "Big ice sheets grew at high northern latitudes. If summer there is cool enough, winter snow survives and piles up year after year. Midsummer sunlight at 65°N is the usual yardstick for that.",
  },
  {
    id: "does-eccentricity-cause-ice-ages",
    question: "Does the 100,000-year cycle cause ice ages by itself?",
    answer:
      "No. Eccentricity hardly changes the sunlight Earth gets over a year. Mainly it sets how much the wobble matters. The 100,000-year rhythm in the ice record comes from the whole climate system, with its ice sheets, oceans and carbon dioxide, responding to all three cycles. Exactly how is still debated.",
  },
  {
    id: "precession-period",
    question: "Is precession 26,000 or 23,000 years?",
    answer:
      "The axis alone takes about 25,800 years to turn once. The orbit’s ellipse turns too, so the seasons return to the same place on the orbit about every 21,000 years. The climate record shows peaks near 19,000 and 23,000 years.",
  },
  {
    id: "is-the-orbit-to-scale",
    question: "Is the scene to scale?",
    answer:
      "No. The orbit’s shape is drawn five times too stretched by default, because the real orbit looks like a circle at screen size. Choose “True shape” to see it as it is. Earth, the Sun and their distances are not to scale either. Calculations always use the real values.",
  },
  {
    id: "where-does-the-history-come-from",
    question: "Where does the 800,000-year history come from?",
    answer:
      "The orbit comes from the La2004 solution by Jacques Laskar and colleagues, sampled every 1,000 years. The ice line is the LR04 stack of 57 seabed sediment records (Lisiecki and Raymo, 2005), which tracks ice volume through the oxygen isotopes in tiny fossils.",
  },
  {
    id: "is-the-ice-real",
    question: "Is the ice on the globe real?",
    answer:
      "It is an illustration. The amount of ice follows the measured record, but the outline is drawn by hand to resemble the last ice age. Use it for scale, not for geography.",
  },
  {
    id: "is-this-a-climate-prediction",
    question: "Does the lab predict temperature or future ice sheets?",
    answer:
      "No, but it gives a rough estimate. At a past date it shows the measured ice record and the temperature that goes with it. For an orbit you set by hand it asks what would happen if that orbit lasted about 15,000 years, using the link between sunlight and ice over the last 800,000 years. It leaves out carbon dioxide, oceans and the ice already there, and it is not a forecast.",
  },
  {
    id: "how-is-temperature-estimated",
    question: "How does the lab get a temperature?",
    answer:
      "From ice. In the sea-floor record, ice and global temperature move together, and the last ice age was about 6.1 °C colder than before industry. The lab scales the ice share to that figure. It is the orbit’s share only, and it does not include today’s warming, which is about 1.2 °C above that baseline.",
  },
  {
    id: "modern-warming",
    question: "Do Milanković cycles explain modern climate change?",
    answer:
      "No. The orbit changes over tens of thousands of years and cannot explain the speed or pattern of today’s warming. That comes mainly from greenhouse gases released by human activity.",
  },
];

export default function FaqPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="editorial-page editorial-page--narrow">
        <header className="page-hero">
          <p className="eyebrow">FAQ</p>
          <h1>Frequently asked questions</h1>
          <p className="page-lede">
            The short version is in the tour. These are the questions people
            ask next.
          </p>
        </header>
        <section className="faq-list" aria-label="Milanković cycle questions">
          {questions.map((item) => (
            <details key={item.id} id={item.id}>
              <summary>
                <span>{item.question}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <div>
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </section>
        <div className="page-end-cta">
          <p>Try it yourself.</p>
          <Link className="button button--primary" href="/">
            Back to the tour
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
