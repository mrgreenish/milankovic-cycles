"use client";

import { useExperience } from "./ExperienceProvider";
import { track } from "@vercel/analytics";

export function StartTourLink() {
  const { goToChapter } = useExperience();

  return (
    <a
      className="button button--primary"
      href="#big-idea"
      onClick={(event) => {
        event.preventDefault();
        track("tour_start");
        goToChapter("big-idea");
      }}
    >
      Start the 4-Minute Tour <span aria-hidden="true">↓</span>
    </a>
  );
}
