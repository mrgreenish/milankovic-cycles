"use client";

import { TOUR_CHAPTERS, useExperience } from "./ExperienceProvider";

export function TourProgress() {
  const { activeChapter, goToChapter } = useExperience();
  const activeIndex = TOUR_CHAPTERS.findIndex(
    (chapter) => chapter.id === activeChapter,
  );
  const active = TOUR_CHAPTERS[activeIndex] ?? TOUR_CHAPTERS[0];

  return (
    <nav className="tour-progress" aria-label="Tour progress">
      <div className="tour-progress__mobile">
        <span>
          Step {activeIndex + 1} of {TOUR_CHAPTERS.length}
        </span>
        <strong>{active.label}</strong>
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

