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
import { localePath } from "@/i18n/config";
import { getContent, getTopics } from "@/i18n/content";
import { fill } from "@/i18n/format";
import { resolveLocale, type LocaleParams } from "@/i18n/page";
import { Rich } from "@/i18n/rich";
import { getUi } from "@/i18n/ui";
import type { ParameterKey } from "@/lib/orbital/controls";

const cycles: { id: string; parameter: ParameterKey }[] = [
  { id: "orbit-shape", parameter: "eccentricity" },
  { id: "axis-tilt", parameter: "obliquityDeg" },
  { id: "axis-direction", parameter: "earthPerihelionLongitudeDeg" },
];

export default async function HomePage(props: LocaleParams) {
  const locale = await resolveLocale(props);
  const { home: text } = getContent(locale);
  const ui = getUi(locale);
  const topics = getTopics(locale);
  const path = (href: string) => localePath(locale, href);
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
                <p className="eyebrow">{text.hero.eyebrow}</p>
                <h1 id="hero-title">{text.hero.title}</h1>
                <p className="hero__summary">{text.hero.summary}</p>
                <div className="button-row">
                  <StartTourLink />
                  <LabLink className="button button--secondary">
                    {ui.tour.openLab} <span aria-hidden="true">↗</span>
                  </LabLink>
                </div>
                <HeroCycles />
                <p className="hero__signature">
                  <Link href={path("/about")}>
                    {text.hero.signatureName}
                    <span>{text.hero.signatureNote}</span>
                  </Link>
                </p>
              </div>
            </section>

            <section className="story-chapter" id="big-idea" data-tour-step>
              <div className="story-column">
                <div className="chapter-heading">
                  <p className="eyebrow">{text.idea.eyebrow}</p>
                  <h2 tabIndex={-1}>{text.idea.title}</h2>
                  <p className="chapter-lede">{text.idea.lede}</p>
                </div>
                <ol className="cause-chain">
                  {text.idea.steps.map((step, index) => (
                    <li key={step.title}>
                      <span>{index + 1}</span>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <IdeaToggle />
                <details className="science-detail">
                  <summary>{text.goDeeper}</summary>
                  {text.idea.deeper.map((paragraph) => (
                    <p key={paragraph}>
                      <Rich text={paragraph} />
                    </p>
                  ))}
                </details>
                <ChapterNav chapterId="big-idea" />
              </div>
            </section>

            {cycles.map((cycle, index) => {
              const copy = text.cycles[index];
              const control = ui.controls[cycle.parameter];
              return (
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
                          0{index + 2} · {control.term}
                        </p>
                        <span className="period-pill">
                          {fill(ui.tour.every, { period: control.period })}
                        </span>
                      </div>
                      <h2 tabIndex={-1}>{copy.title}</h2>
                      <p className="chapter-lede">{copy.intro}</p>
                    </div>
                    <TourParameterSlider parameter={cycle.parameter} />
                    <div className="chapter-explanation">
                      <h3>{text.whatItDoes}</h3>
                      {copy.effect.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                    <details className="science-detail">
                      <summary>{text.goDeeper}</summary>
                      {copy.deeper.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </details>
                    <ChapterNav chapterId={cycle.id} />
                  </div>
                </section>
              );
            })}

            <section className="story-chapter" id="together" data-tour-step>
              <div className="story-column">
                <div className="chapter-heading">
                  <p className="eyebrow">{text.together.eyebrow}</p>
                  <h2 tabIndex={-1}>{text.together.title}</h2>
                  <p className="chapter-lede">{text.together.lede}</p>
                </div>
                <TimelinePanel placement="inline" />
                <div className="chapter-explanation">
                  <h3>{text.together.lookFor}</h3>
                  <p>{text.together.lookForBody}</p>
                </div>
                <p className="story-note">{text.together.note}</p>
                <details className="science-detail">
                  <summary>{text.goDeeper}</summary>
                  {text.together.deeper.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
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
                  <p className="eyebrow">{text.recap.eyebrow}</p>
                  <h2 tabIndex={-1}>{text.recap.title}</h2>
                </div>
                <ol className="takeaways">
                  {text.recap.items.map((item, index) => (
                    <li key={item.lead}>
                      <span>{index + 1}</span>
                      <p>
                        <strong>{item.lead}</strong> {item.body}
                      </p>
                    </li>
                  ))}
                </ol>
                <p className="chapter-lede">{text.recap.lede}</p>
                <div className="modern-warming-note">
                  <h3>{text.recap.warmingTitle}</h3>
                  <p>{text.recap.warmingBody}</p>
                  <Link href={path("/learn/modern-climate-change")}>
                    {text.recap.warmingLink}
                  </Link>
                </div>
                <div className="recap-cta">
                  <div>
                    <p className="eyebrow">{text.recap.ctaEyebrow}</p>
                    <h3>{text.recap.ctaTitle}</h3>
                  </div>
                  <LabLink className="button button--primary">
                    {text.recap.ctaButton} <span aria-hidden="true">↗</span>
                  </LabLink>
                </div>
                <ChapterNav chapterId="recap" />
              </div>
            </section>
          </div>
        </div>
        <section className="home-topics" aria-labelledby="home-topics-title">
          <div>
            <p className="eyebrow">{text.topics.eyebrow}</p>
            <h2 id="home-topics-title">{text.topics.title}</h2>
            <p>{text.topics.body}</p>
          </div>
          <nav aria-label={text.topics.nav}>
            {topics.map((topic) => (
              <Link key={topic.slug} href={path(`/learn/${topic.slug}`)}>
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
