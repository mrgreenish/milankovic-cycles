import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  ExperienceProvider,
} from "@/components/experience/ExperienceProvider";
import { TourFrame } from "@/components/experience/TourFrame";
import { TourParameterSlider } from "@/components/experience/TourParameterSlider";
import { CycleReadout } from "@/components/experience/CycleReadout";
import { ReadingCard } from "@/components/experience/ReadingCard";
import { ChapterNav } from "@/components/experience/ChapterNav";
import { StartTourLink } from "@/components/experience/StartTourLink";

const causeSteps = [
  { number: "01", title: "Earth moves", copy: "Its orbit and axis change slowly and predictably." },
  { number: "02", title: "Sunlight shifts", copy: "Different seasons and latitudes receive different amounts." },
  { number: "03", title: "Summer decides", copy: "Cool northern summers leave more winter snow unmelted." },
  { number: "04", title: "Feedbacks amplify", copy: "Ice, oceans, greenhouse gases, and snowfall grow the response." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <ExperienceProvider>
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero__orbit" aria-hidden="true">
              <span className="hero__sun" />
              <span className="hero__earth" />
            </div>
            <div className="hero__content">
              <p className="eyebrow">Milanković Cycles, Explained Visually</p>
              <h1 id="hero-title">Why Do Ice Ages Come and Go?</h1>
              <p className="hero__summary">
                Three slow changes in Earth&apos;s orbit and axis redistribute sunlight.
                Cooler northern summers can let snow survive; climate feedbacks amplify the change.
              </p>
              <div className="button-row">
                <StartTourLink />
                <Link className="button button--secondary" href="/lab">
                  Open the Lab <span aria-hidden="true">↗</span>
                </Link>
              </div>
              <p className="hero__signature">
                Created by Milutin Milanković&apos;s great-grandson.
              </p>
            </div>
            <div className="hero__preview" aria-label="The three Milanković cycles">
              <span><b>Stretch</b><small>Orbit shape · ~100,000 years</small></span>
              <span><b>Lean</b><small>Axis tilt · ~41,000 years</small></span>
              <span><b>Wobble</b><small>Axis direction · ~23,000 years</small></span>
            </div>
          </section>

          <TourFrame>
            <section className="tour-chapter" id="big-idea" data-tour-step>
              <div className="chapter-heading">
                <p className="eyebrow">Step 1 · The Big Idea</p>
                <h2 tabIndex={-1}>The 30-Second Answer</h2>
                <p className="chapter-lede">
                  Milanković cycles do not simply make the whole planet hotter or colder.
                  They redistribute incoming sunlight—<em>insolation</em>—by season and latitude.
                </p>
              </div>
              <ol className="cause-chain">
                {causeSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div><h3>{step.title}</h3><p>{step.copy}</p></div>
                  </li>
                ))}
              </ol>
              <div className="explain-card explain-card--blue">
                <p className="eyebrow">Why 65° North?</p>
                <h3>The latitude where great northern ice sheets grew</h3>
                <p>
                  Around Alaska, northern Canada, and Scandinavia, a cool summer can leave some
                  winter snow behind. Repeat that for many years and ice can accumulate. This is
                  why northern summer sunlight at 65°N became the classic orbital indicator.
                </p>
              </div>
              <ChapterNav chapterId="big-idea" />
            </section>

            <section className="tour-chapter" id="orbit-shape" data-tour-step>
              <div className="chapter-heading">
                <div className="chapter-heading__meta">
                  <p className="eyebrow">Step 2 · The Stretch</p>
                  <span className="period-pill">~100,000 years</span>
                </div>
                <h2 tabIndex={-1}>Orbit Shape <span>· Eccentricity</span></h2>
                <p className="chapter-lede">
                  Earth&apos;s orbit shifts between nearly circular and slightly more elliptical.
                  The Sun remains at one focus—not at the center.
                </p>
              </div>
              <div className="three-facts">
                <article><span>What moves</span><h3>The orbit stretches</h3><p>The difference between closest and farthest approach grows.</p></article>
                <article><span>What changes</span><h3>Distance contrast</h3><p>Sunlight is stronger at perihelion and weaker at aphelion.</p></article>
                <article><span>Why climate cares</span><h3>It amplifies timing</h3><p>Eccentricity strengthens or weakens the seasonal effect of precession.</p></article>
              </div>
              <TourParameterSlider
                parameter="eccentricity"
                label="Stretch the orbit"
                min={0.005}
                max={0.058}
                step={0.0001}
                minLabel="Rounder"
                maxLabel="More elliptical"
                format="eccentricity"
              />
              <CycleReadout cycle="shape" />
              <p className="scale-note">The diagram exaggerates orbit shape 5× so the real, subtle change is visible.</p>
              <ChapterNav chapterId="orbit-shape" />
            </section>

            <section className="tour-chapter" id="axis-tilt" data-tour-step>
              <div className="chapter-heading">
                <div className="chapter-heading__meta">
                  <p className="eyebrow">Step 3 · The Lean</p>
                  <span className="period-pill">~41,000 years</span>
                </div>
                <h2 tabIndex={-1}>Axis Tilt <span>· Obliquity</span></h2>
                <p className="chapter-lede">
                  Earth&apos;s axis leans between about 22.1° and 24.5°. More tilt intensifies
                  seasons—especially at high latitudes.
                </p>
              </div>
              <div className="three-facts">
                <article><span>What moves</span><h3>The axis leans</h3><p>The angle changes by only 2.4°, slowly and continuously.</p></article>
                <article><span>What changes</span><h3>Season strength</h3><p>More tilt brings brighter high-latitude summers and darker winters.</p></article>
                <article><span>Why climate cares</span><h3>Summer melt</h3><p>Stronger northern summers can remove more of the previous winter&apos;s snow.</p></article>
              </div>
              <TourParameterSlider
                parameter="obliquityDeg"
                label="Lean Earth's axis"
                min={22.1}
                max={24.5}
                step={0.01}
                minLabel="Milder seasons"
                maxLabel="Stronger seasons"
                format="degrees"
              />
              <CycleReadout cycle="tilt" />
              <ChapterNav chapterId="axis-tilt" />
            </section>

            <section className="tour-chapter" id="axis-direction" data-tour-step>
              <div className="chapter-heading">
                <div className="chapter-heading__meta">
                  <p className="eyebrow">Step 4 · The Wobble</p>
                  <span className="period-pill">~23,000-year climate cycle</span>
                </div>
                <h2 tabIndex={-1}>Axis Direction <span>· Precession</span></h2>
                <p className="chapter-lede">
                  Earth&apos;s axis traces a slow circle. Together with the rotating orbital ellipse,
                  this changes which season occurs near the Sun.
                </p>
              </div>
              <div className="three-facts">
                <article><span>What moves</span><h3>The axis points elsewhere</h3><p>Like a spinning top, its direction changes while the tilt remains.</p></article>
                <article><span>What changes</span><h3>Season meets distance</h3><p>Northern summer can occur nearer perihelion or aphelion.</p></article>
                <article><span>Why climate cares</span><h3>Opposite hemispheres</h3><p>One hemisphere gets stronger seasonal contrast while the other gets less.</p></article>
              </div>
              <TourParameterSlider
                parameter="earthPerihelionLongitudeDeg"
                label="Move the season of closest approach"
                min={0}
                max={359.9}
                step={0.1}
                minLabel="0°"
                maxLabel="360°"
                format="degrees"
              />
              <CycleReadout cycle="direction" />
              <ChapterNav chapterId="axis-direction" />
            </section>

            <section className="tour-chapter" id="together" data-tour-step>
              <div className="chapter-heading">
                <p className="eyebrow">Step 5 · The Combined Signal</p>
                <h2 tabIndex={-1}>No Single Cycle Is an Ice-Age Switch</h2>
                <p className="chapter-lede">
                  Shape, tilt, and direction combine to change northern summer sunlight.
                  The climate system then responds over thousands of years.
                </p>
              </div>
              <ReadingCard />
              <div className="feedback-grid">
                <article><span aria-hidden="true">❄</span><h3>Weaker northern summers</h3><p>More winter snow may survive, all else equal.</p></article>
                <article><span aria-hidden="true">◌</span><h3>Ice reflects sunlight</h3><p>Growing bright surfaces can reinforce cooling.</p></article>
                <article><span aria-hidden="true">≈</span><h3>Oceans &amp; gases respond</h3><p>Slow feedbacks make the climate response much larger than the orbital nudge.</p></article>
              </div>
              <ChapterNav chapterId="together" />
            </section>

            <section className="tour-chapter tour-chapter--recap" id="recap" data-tour-step>
              <div className="chapter-heading">
                <p className="eyebrow">Step 6 · Recap</p>
                <h2 tabIndex={-1}>Three Motions. One Changing Pattern of Sunlight.</h2>
              </div>
              <ol className="takeaways">
                <li><span>1</span><p>Earth&apos;s orbit and axis change predictably over tens of thousands of years.</p></li>
                <li><span>2</span><p>Those motions redistribute sunlight by season and latitude—especially northern summer.</p></li>
                <li><span>3</span><p>Snow, ice, oceans, greenhouse gases, and time amplify the orbital pacing.</p></li>
              </ol>
              <div className="modern-warming-note">
                <p className="eyebrow">An Important Distinction</p>
                <h3>Milanković cycles do not explain today&apos;s rapid warming</h3>
                <p>
                  Orbital cycles unfold over tens of thousands of years. Modern warming is far
                  faster and is driven primarily by human greenhouse-gas emissions.
                </p>
              </div>
              <div className="recap-cta">
                <div><p className="eyebrow">Now Make the Pattern Yourself</p><h3>Experiment with all three cycles</h3></div>
                <Link className="button button--primary" href="/lab">Open the Orbital Lab <span aria-hidden="true">→</span></Link>
              </div>
              <ChapterNav chapterId="recap" />
            </section>
          </TourFrame>
        </ExperienceProvider>
      </main>
      <SiteFooter />
    </>
  );
}
