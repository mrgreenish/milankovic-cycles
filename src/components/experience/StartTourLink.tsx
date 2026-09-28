"use client";

import { isPlainLinkClick } from "@/lib/navigation";

import { useExperience } from "./ExperienceProvider";
import { track } from "@vercel/analytics";

export function StartTourLink() {
  const { goToChapter } = useExperience();

  return (
    <a
      className="button button--primary"
      href="#big-idea"
      onClick={(event) => {
        if (!isPlainLinkClick(event)) return;
        event.preventDefault();
        track("tour_start");
        goToChapter("big-idea");
      }}
    >
      Start the tour <span aria-hidden="true">↓</span>
    </a>
  );
}
