"use client";

import { isPlainLinkClick } from "@/lib/navigation";

import {
  TOUR_CHAPTERS,
  useExperience,
  type TourChapterId,
} from "./ExperienceProvider";

export function TourProgress() {
  const { activeChapter, goToChapter } = useExperience();
  const activeIndex = TOUR_CHAPTERS.findIndex(
    (chapter) => chapter.id === activeChapter,
  );

  return (
    <nav className="tour-progress" aria-label="Tour progress">
      <div className="tour-progress__mobile">
        <span>
          Step {activeIndex + 1} of {TOUR_CHAPTERS.length}
        </span>
        <label className="sr-only" htmlFor="chapter-select">
          Jump to chapter
        </label>
        <select
          id="chapter-select"
          name="chapter"
          value={activeChapter}
          onChange={(event) => goToChapter(event.target.value as TourChapterId)}
        >
          {TOUR_CHAPTERS.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.label}
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
              {chapter.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
