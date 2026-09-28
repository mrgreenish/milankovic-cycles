import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ExperienceProvider } from "@/components/experience/ExperienceProvider";
import { TourFrame } from "@/components/experience/TourFrame";
import { TourParameterSlider } from "@/components/experience/TourParameterSlider";
import { CycleReadout } from "@/components/experience/CycleReadout";
import { ReadingCard } from "@/components/experience/ReadingCard";
import { ChapterNav } from "@/components/experience/ChapterNav";
import { StartTourLink } from "@/components/experience/StartTourLink";
import { HeroVisual } from "@/components/experience/HeroVisual";
import { LabLink } from "@/components/experience/LabLink";
import { LEARN_TOPICS } from "@/lib/learn/topics";
import type { ParameterKey } from "@/lib/orbital/controls";

const cycles: {
  id: string;
  title: string;
  term: string;
  period: string;
  parameter: ParameterKey;
  focus: "shape" | "tilt" | "direction";
  intro: string;
  explanation: string;
  detail: string;
}[] = [
  {
    id: "orbit-shape",
    title: "Stretch the orbit",
    term: "Eccentricity",
    period: "~100,000 years",
    parameter: "eccentricity",
    focus: "shape",
    intro:
      "Earth’s orbit changes from nearly circular to slightly more elliptical. Try both ends of the range and watch the distances change.",
    explanation:
      "Sunlight is stronger when Earth is closer to the Sun. A more elliptical orbit increases the difference between the closest and farthest points.",
    detail:
      "The Sun stays at one focus of the ellipse. Eccentricity has only a small effect on total annual sunlight, but it strengthens the seasonal effect of precession. The diagram enlarges eccentricity 5×; every calculation uses the real value.",
  },
  {
    id: "axis-tilt",
    title: "Lean Earth’s axis",
    term: "Obliquity",
    period: "~41,000 years",
    parameter: "obliquityDeg",
    focus: "tilt",
    intro:
      "Earth’s tilt varies from about 22.1° to 24.5°. Increase it and see how northern summer daylight and sunlight respond.",
    explanation:
      "More tilt brings longer, brighter summers to high northern latitudes. Those summers can melt more of the previous winter’s snow.",
    detail:
      "The angle is measured from a line perpendicular to Earth’s orbital plane. The blue reference shows today’s tilt with your other settings held fixed. Tilt strengthens seasons in both hemispheres, which have their summers six months apart.",
  },
  {
    id: "axis-direction",
    title: "Change when summer falls",
    term: "Precession",
    period: "~23,000 years",
    parameter: "earthPerihelionLongitudeDeg",
    focus: "direction",
    intro:
      "Earth’s axis slowly changes direction. Together with the turning orbital ellipse, this shifts the seasons around the orbit.",
    explanation:
      "A northern summer near the Sun receives more sunlight than one at the far end of the orbit. The effect is reversed for southern summers.",
    detail:
      "Axial precession takes about 26,000 years. Climate responds to its combination with the rotating orbital ellipse, with cycles near 19,000 and 23,000 years. The blue reference shows today’s season angle while your orbit shape and tilt stay fixed.",
  },
];

export default function HomePage() {
  return (
    <ExperienceProvider>
      <SiteHeader />
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__content">
            <p className="eyebrow">Milanković cycles</p>
            <h1 id="hero-title">Why do ice ages come and go?</h1>
            <p className="hero__summary">
              Earth’s orbit and tilt change slowly. They alter summer sunlight
              in the far north, where cooler summers can help winter snow
              survive.
            </p>
            <div className="button-row">
              <StartTourLink />
              <LabLink className="button button--secondary">
                Open the lab <span aria-hidden="true">↗</span>
              </LabLink>
            </div>
            <p className="hero__signature">
              <Link href="/about">
                By Filip van Harreveld
                <span>Milutin Milanković’s great-grandson</span>
              </Link>
            </p>
          </div>
          <HeroVisual />
        </section>
        <TourFrame>
          <section className="tour-chapter" id="big-idea" data-tour-step>
            <div className="chapter-heading">
              <p className="eyebrow">01 / The idea</p>
              <h2 tabIndex={-1}>How summer sunlight affects ice</h2>
              <p className="chapter-lede">
                For an ice sheet to grow, some winter snow must survive the
                summer. Small changes in sunlight can help that happen, year
                after year.
              </p>
            </div>
            <ol className="cause-chain">
              <li>
                <span>01</span>
                <div>
                  <h3>Earth’s orbit and axis change</h3>
                  <p>
                    These slow motions shift where and when sunlight arrives.
                  </p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Cooler summers leave snow behind</h3>
                  <p>Over many years, surviving snow can build into ice.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Ice and climate affect each other</h3>
                  <p>
                    Reflective ice, oceans, and greenhouse gases can amplify the
                    change.
                  </p>
                </div>
              </li>
            </ol>
            <details className="science-detail">
              <summary>Why measure sunlight at 65° north?</summary>
              <p>
                This latitude crosses northern Canada and Scandinavia, near the
                regions where large ice sheets grew. Summer sunlight here is a
                useful benchmark for comparing orbital changes. Scientists call
                incoming solar energy <em>insolation</em>.
              </p>
            </details>
            <ChapterNav chapterId="big-idea" />
          </section>
          {cycles.map((cycle, index) => (
            <section
              className="tour-chapter"
              id={cycle.id}
              data-tour-step
              key={cycle.id}
            >
              <div className="chapter-heading">
                <div className="chapter-heading__meta">
                  <p className="eyebrow">
                    0{index + 2} / {cycle.term}
                  </p>
                  <span className="period-pill">{cycle.period}</span>
                </div>
                <h2 tabIndex={-1}>{cycle.title}</h2>
                <p className="chapter-lede">{cycle.intro}</p>
              </div>
              <TourParameterSlider parameter={cycle.parameter} />
              <CycleReadout cycle={cycle.focus} />
              <div className="chapter-explanation">
                <h3>Effect on summer sunlight</h3>
                <p>{cycle.explanation}</p>
              </div>
              <details className="science-detail">
                <summary>About this comparison</summary>
                <p>{cycle.detail}</p>
                <p>
                  “Today” uses the J2000 reference, for the year 2000. The
                  sunlight comparison uses all three present-day reference
                  values.
                </p>
              </details>
              <ChapterNav chapterId={cycle.id} />
            </section>
          ))}
          <section className="tour-chapter" id="together" data-tour-step>
            <div className="chapter-heading">
              <p className="eyebrow">05 / Together</p>
              <h2 tabIndex={-1}>Your changes add up</h2>
              <p className="chapter-lede">
                This is the summer sunlight produced by the settings you tried.
                Each motion contributes; the climate response also depends on
                ice, oceans, snowfall, and greenhouse gases.
              </p>
            </div>
            <ReadingCard />
            <p className="chapter-explanation">
              Weaker summers can help snow survive. As ice grows, it reflects
              more sunlight and can reinforce cooling. These responses unfold
              over thousands of years.
            </p>
            <ChapterNav chapterId="together" />
          </section>
          <section
            className="tour-chapter tour-chapter--recap"
            id="recap"
            data-tour-step
          >
            <div className="chapter-heading">
              <p className="eyebrow">06 / Recap</p>
              <h2 tabIndex={-1}>The seasons change the balance</h2>
            </div>
            <ol className="takeaways">
              <li>
                <span>1</span>
                <p>
                  Orbit shape changes the difference between Earth’s closest and
                  farthest distances from the Sun.
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  Tilt changes the strength of the seasons. Precession shifts
                  their position along the orbit.
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  Together, they change summer sunlight. The rest of the climate
                  system determines how much ice grows or melts.
                </p>
              </li>
            </ol>
            <div className="modern-warming-note">
              <h3>What about today’s warming?</h3>
              <p>
                Orbital cycles unfold over tens of thousands of years. Today’s
                rapid warming is driven primarily by human greenhouse-gas
                emissions.
              </p>
              <Link href="/learn/modern-climate-change">
                Read the explanation →
              </Link>
            </div>
            <div className="recap-cta">
              <div>
                <p className="eyebrow">Keep experimenting</p>
                <h3>Take your settings to the lab</h3>
              </div>
              <LabLink className="button button--primary">
                Continue in the lab <span aria-hidden="true">↗</span>
              </LabLink>
            </div>
            <ChapterNav chapterId="recap" />
          </section>
        </TourFrame>
        <section className="home-topics" aria-labelledby="home-topics-title">
          <div>
            <p className="eyebrow">Further reading</p>
            <h2 id="home-topics-title">A closer look at the science</h2>
            <p>
              Read about each motion, the 65°N measurement, and modern warming.
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
