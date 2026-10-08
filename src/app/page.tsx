import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ExperienceProvider } from "@/components/experience/ExperienceProvider";
import { TourStage } from "@/components/experience/TourStage";
import { TourParameterSlider } from "@/components/experience/TourParameterSlider";
import { TimelinePanel } from "@/components/experience/TimelinePanel";
import { ChapterNav } from "@/components/experience/ChapterNav";
import { StartTourLink } from "@/components/experience/StartTourLink";
import { HeroCycles } from "@/components/experience/HeroCycles";
import { IdeaToggle } from "@/components/experience/IdeaToggle";
import { LabLink } from "@/components/experience/LabLink";
import { LEARN_TOPICS } from "@/lib/learn/topics";
import type { ParameterKey } from "@/lib/orbital/controls";

const cycles: {
  id: string;
  title: string;
  term: string;
  period: string;
  parameter: ParameterKey;
  intro: string;
  effect: string[];
  deeper: string[];
}[] = [
  {
    id: "orbit-shape",
    title: "Stretch the orbit",
    term: "Eccentricity",
    period: "100,000 years",
    parameter: "eccentricity",
    intro:
      "Earth’s orbit is almost a circle. Over about 100,000 years it stretches a little, then relaxes. Drag the scene or move the slider.",
    effect: [
      "A stretched orbit puts Earth closer to the Sun at one time of year than at another. Today the gap is 5 million km. At the most stretched it is 17 million km, and the nearest sunlight is 26% stronger than the farthest.",
      "On its own, a stretched orbit hardly changes the sunlight Earth gets over a whole year (under 0.2%). What it does is give the wobble something to work with.",
    ],
    deeper: [
      "The Sun sits at one focus of the ellipse, not at its centre. The scene draws the stretch five times larger than it is, because the real orbit would look like a circle. Choose “True shape” under the scene to see it as it is.",
      "Eccentricity has more than one rhythm. The record shows strong pacing near 100,000 and 405,000 years, so “100,000 years” is a handy label, not an exact clock.",
    ],
  },
  {
    id: "axis-tilt",
    title: "Lean the axis",
    term: "Obliquity",
    period: "41,000 years",
    parameter: "obliquityDeg",
    intro:
      "Earth’s axis leans 23.4° from upright. Over 41,000 years it swings between 22.1° and 24.5°. More lean means stronger seasons, most of all near the poles.",
    effect: [
      "At 22.1° the Sun stays up 20.1 hours on a midsummer day at 65°N. At 24.5° it stays up 22.4 hours and climbs higher. That is 457 W/m² against 496 W/m².",
      "Less lean gives cooler northern summers, and cool summers are when snow survives.",
    ],
    deeper: [
      "Tilt, not distance, makes the seasons. Earth is closest to the Sun in early January, when it is winter in the north.",
      "The dashed grey line in the scene is today’s tilt. The angle is measured from the line that stands upright on the orbit’s plane.",
    ],
  },
  {
    id: "axis-direction",
    title: "Wobble the axis",
    term: "Precession",
    period: "23,000 years",
    parameter: "earthPerihelionLongitudeDeg",
    intro:
      "Earth’s axis slowly turns, like the axis of a spinning top. The orbit turns too. Together they move the seasons around the orbit. Drag to turn the axis.",
    effect: [
      "Today northern summer falls on the far side of the orbit. In about 11,000 years it falls on the near side, and midsummer sunlight at 65°N rises from 478 to about 510 W/m².",
      "That swap matters more when the orbit is stretched. At the most stretched orbit it changes midsummer sunlight by 115 W/m².",
    ],
    deeper: [
      "The axis alone takes about 25,800 years to turn once. The ellipse turns as well, so the seasons meet the orbit’s near point again after about 21,000 years on average. The climate record has peaks near 19,000 and 23,000 years.",
      "The two hemispheres pull in opposite directions. When northern summer is near the Sun, southern summer is far from it.",
    ],
  },
];

export default function HomePage() {
  return (
    <ExperienceProvider>
      <SiteHeader />
      <main id="main-content">
        <div className="story">
          <div className="story-track">
            <div className="story-stage">
              <TourStage />
            </div>
          </div>
          <div className="story-content">
            <section className="story-hero" id="hero" aria-labelledby="hero-title">
              <div className="story-column">
                <p className="eyebrow">Milanković cycles</p>
                <h1 id="hero-title">Why do ice ages come and go?</h1>
                <p className="hero__summary">
                  Three slow changes in Earth’s orbit set the rhythm. They shift
                  how much sunlight reaches the far north each summer, and that
                  has been enough to build ice sheets kilometres thick and melt
                  them again.
                </p>
                <div className="button-row">
                  <StartTourLink />
                  <LabLink className="button button--secondary">
                    Open the lab <span aria-hidden="true">↗</span>
                  </LabLink>
                </div>
                <HeroCycles />
                <p className="hero__signature">
                  <Link href="/about">
                    By Filip van Harreveld
                    <span>Great-grandson of Milutin Milanković</span>
                  </Link>
                </p>
              </div>
            </section>

            <section className="story-chapter" id="big-idea" data-tour-step>
              <div className="story-column">
                <div className="chapter-heading">
                  <p className="eyebrow">01 · The idea</p>
                  <h2 tabIndex={-1}>Summer decides whether ice grows</h2>
                  <p className="chapter-lede">
                    Snow falls every winter in the far north. Whether it turns
                    into ice depends on how much of it survives the summer.
                  </p>
                </div>
                <ol className="cause-chain">
                  <li>
                    <span>1</span>
                    <div>
                      <h3>The orbit shifts slowly</h3>
                      <p>
                        Earth’s distance, tilt and season timing change over tens
                        of thousands of years.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <h3>Summer sunlight at 65°N changes</h3>
                      <p>
                        That latitude crosses northern Canada, Scandinavia and
                        Siberia, where the big ice sheets grew.
                      </p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <h3>Ice and carbon dioxide add to it</h3>
                      <p>
                        White ice reflects sunlight and CO₂ levels fall, so a
                        small push becomes a large one.
                      </p>
                    </div>
                  </li>
                </ol>
                <IdeaToggle />
                <details className="science-detail">
                  <summary>Go deeper</summary>
                  <p>
                    The number in the corner is the daily average sunlight at
                    the top of the atmosphere on the summer solstice at 65°N.
                    Scientists call incoming solar energy <em>insolation</em>.
                    It is the usual yardstick for ice because melting in
                    summer is what limits an ice sheet.
                  </p>
                  <p>
                    The ice on the globe is drawn by hand to follow the measured
                    record. It shows how much ice there was, not its exact
                    outline.
                  </p>
                </details>
                <ChapterNav chapterId="big-idea" />
              </div>
            </section>

            {cycles.map((cycle, index) => (
              <section
                className="story-chapter"
                id={cycle.id}
                data-tour-step
                key={cycle.id}
              >
                <div className="story-column">
                  <div className="chapter-heading">
                    <div className="chapter-heading__meta">
                      <p className="eyebrow">
                        0{index + 2} · {cycle.term}
                      </p>
                      <span className="period-pill">
                        every {cycle.period}
                      </span>
                    </div>
                    <h2 tabIndex={-1}>{cycle.title}</h2>
                    <p className="chapter-lede">{cycle.intro}</p>
                  </div>
                  <TourParameterSlider parameter={cycle.parameter} />
                  <div className="chapter-explanation">
                    <h3>What it does</h3>
                    {cycle.effect.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <details className="science-detail">
                    <summary>Go deeper</summary>
                    {cycle.deeper.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </details>
                  <ChapterNav chapterId={cycle.id} />
                </div>
              </section>
            ))}

            <section className="story-chapter" id="together" data-tour-step>
              <div className="story-column">
                <div className="chapter-heading">
                  <p className="eyebrow">05 · Putting it together</p>
                  <h2 tabIndex={-1}>Run the clock</h2>
                  <p className="chapter-lede">
                    All three motions now run at once, using the orbit
                    calculated by Jacques Laskar’s team (La2004). Press play and
                    800,000 years pass in about a minute. The measured ice
                    record is the bottom line.
                  </p>
                </div>
                <TimelinePanel placement="inline" />
                <div className="chapter-explanation">
                  <h3>What to look for</h3>
                  <p>
                    The ice line follows the sunlight line, but later. Ice
                    builds slowly over tens of thousands of years and goes fast,
                    in around ten thousand.
                  </p>
                </div>
                <p className="story-note">
                  Milutin Milanković worked this out by hand over about thirty
                  years and published it in 1941. Nobody could check it until
                  1976, when seabed sediment showed the same rhythms. He had
                  died 18 years earlier.
                </p>
                <details className="science-detail">
                  <summary>Go deeper</summary>
                  <p>
                    The strongest rhythm in the ice record is 100,000 years, yet
                    the orbit’s direct push at that period is weak. The ice
                    sheets, oceans and carbon dioxide must be amplifying it, and
                    how exactly is still debated.
                  </p>
                  <p>
                    Past 0 on the clock the orbit keeps going and the ice line
                    stops: nothing here predicts future ice. For the next 50,000
                    years the orbit is unusually calm, and midsummer sunlight at
                    65°N stays between 475 and 503 W/m².
                  </p>
                </details>
                <ChapterNav chapterId="together" />
              </div>
            </section>

            <section
              className="story-chapter story-chapter--recap"
              id="recap"
              data-tour-step
            >
              <div className="story-column">
                <div className="chapter-heading">
                  <p className="eyebrow">06 · Recap</p>
                  <h2 tabIndex={-1}>The short version</h2>
                </div>
                <ol className="takeaways">
                  <li>
                    <span>1</span>
                    <p>
                      <strong>Stretch</strong> sets how far apart Earth’s near
                      and far points are, and so how much the wobble can matter.
                    </p>
                  </li>
                  <li>
                    <span>2</span>
                    <p>
                      <strong>Lean</strong> gives high-latitude summers more sun
                      when it grows and less when it shrinks.
                    </p>
                  </li>
                  <li>
                    <span>3</span>
                    <p>
                      <strong>Wobble</strong> decides whether northern summer
                      falls near the Sun or far from it.
                    </p>
                  </li>
                </ol>
                <p className="chapter-lede">
                  Together they swing midsummer sunlight at 65°N between 431 and
                  552 W/m². Ice answers slowly: it takes tens of thousands of
                  years to build and about ten thousand to melt.
                </p>
                <div className="modern-warming-note">
                  <h3>What about today’s warming?</h3>
                  <p>
                    The orbit changes far too slowly to matter in a human
                    lifetime. Today’s warming comes mainly from greenhouse gases
                    released by human activity.
                  </p>
                  <Link href="/learn/modern-climate-change">
                    Read the explanation →
                  </Link>
                </div>
                <div className="recap-cta">
                  <div>
                    <p className="eyebrow">Your turn</p>
                    <h3>Take your settings to the lab</h3>
                  </div>
                  <LabLink className="button button--primary">
                    Continue in the lab <span aria-hidden="true">↗</span>
                  </LabLink>
                </div>
                <ChapterNav chapterId="recap" />
              </div>
            </section>
          </div>
        </div>
        <section className="home-topics" aria-labelledby="home-topics-title">
          <div>
            <p className="eyebrow">Guides</p>
            <h2 id="home-topics-title">Read more</h2>
            <p>
              One guide for each motion, one on why 65°N is the yardstick, and
              one on today’s warming.
            </p>
          </div>
          <nav aria-label="Milanković cycle topic guides">
            {LEARN_TOPICS.map((topic) => (
              <Link key={topic.slug} href={`/learn/${topic.slug}`}>
                {topic.shortTitle}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </section>
      </main>
      <SiteFooter />
    </ExperienceProvider>
  );
}
