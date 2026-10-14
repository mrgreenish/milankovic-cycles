"use client";

import { fill } from "@/i18n/format";
import { useUi } from "@/i18n/LocaleProvider";
import { isPlainLinkClick } from "@/lib/navigation";

import {
  TOUR_CHAPTERS,
  useExperience,
  type TourChapterId,
} from "./ExperienceProvider";

export function TourProgress() {
  const { activeChapter, goToChapter, inHero } = useExperience();
  const ui = useUi();
  const activeIndex = TOUR_CHAPTERS.findIndex(
    (chapter) => chapter.id === activeChapter,
  );

  return (
    <nav
      className="tour-progress"
      aria-label={ui.tour.progress}
      data-hidden={inHero ? "true" : "false"}
    >
      <div className="tour-progress__mobile">
        <span>
          {fill(ui.tour.step, {
            n: activeIndex + 1,
            total: TOUR_CHAPTERS.length,
          })}
        </span>
        <label className="sr-only" htmlFor="chapter-select">
          {ui.tour.jump}
        </label>
        <select
          id="chapter-select"
          name="chapter"
          value={activeChapter}
          onChange={(event) => goToChapter(event.target.value as TourChapterId)}
        >
          {TOUR_CHAPTERS.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {ui.chapters[chapter.id]}
            </option>
          ))}
        </select>
        <div className="tour-progress__track" aria-hidden="true">
          <span
            style={{
              width: `${((activeIndex + 1) / TOUR_CHAPTERS.length) * 100}%`,
            }}
          />
        </div>
      </div>
      <ol className="tour-progress__desktop">
        {TOUR_CHAPTERS.map((chapter, index) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              aria-current={chapter.id === activeChapter ? "step" : undefined}
              onClick={(event) => {
                if (!isPlainLinkClick(event)) return;
                event.preventDefault();
                goToChapter(chapter.id);
              }}
            >
              <span>{index + 1}</span>
              <em>{ui.chapters[chapter.id]}</em>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
