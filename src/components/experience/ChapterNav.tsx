"use client";

import { TOUR_CHAPTERS, useExperience } from "./ExperienceProvider";

export function ChapterNav({ chapterId }: { chapterId: string }) {
  const { goToChapter } = useExperience();
  const index = TOUR_CHAPTERS.findIndex((chapter) => chapter.id === chapterId);
  const previous = index > 0 ? TOUR_CHAPTERS[index - 1] : null;
  const next = index < TOUR_CHAPTERS.length - 1 ? TOUR_CHAPTERS[index + 1] : null;

  return (
    <nav className="chapter-nav" aria-label="Chapter navigation">
      {previous ? (
        <a
          href={`#${previous.id}`}
          onClick={(event) => {
            event.preventDefault();
            goToChapter(previous.id);
          }}
        >
          <span aria-hidden="true">←</span> {previous.label}
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a
          className="chapter-nav__next"
          href={`#${next.id}`}
          onClick={(event) => {
            event.preventDefault();
            goToChapter(next.id);
          }}
        >
          {next.label} <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </nav>
  );
}

