"use client";

import type { OrbitalVisualFocus } from "@/lib/orbital/types";
import { isPlainLinkClick } from "@/lib/navigation";
import { useExperience, type TourChapterId } from "./ExperienceProvider";

const cycles: {
  id: TourChapterId;
  focus: OrbitalVisualFocus;
  label: string;
  detail: string;
  period: string;
}[] = [
  {
    id: "orbit-shape",
    focus: "shape",
    label: "Stretch",
    detail: "The orbit changes shape",
    period: "every 100,000 years",
  },
  {
    id: "axis-tilt",
    focus: "tilt",
    label: "Lean",
    detail: "The axis tilts more or less",
    period: "every 41,000 years",
  },
  {
    id: "axis-direction",
    focus: "direction",
    label: "Wobble",
    detail: "The axis turns like a top",
    period: "every 23,000 years",
  },
];

/** Three cards under the title. Pointing at one makes the scene perform it. */
export function HeroCycles() {
  const { goToChapter, setPreview } = useExperience();
  return (
    <nav
      className="cycle-previews"
      aria-label="Explore a cycle"
      onMouseLeave={() => setPreview(null)}
    >
      {cycles.map((cycle) => (
        <a
          key={cycle.id}
          href={`#${cycle.id}`}
          onMouseEnter={() => setPreview(cycle.focus)}
          onFocus={() => setPreview(cycle.focus)}
          onBlur={() => setPreview(null)}
          onClick={(event) => {
            if (!isPlainLinkClick(event)) return;
            event.preventDefault();
            setPreview(null);
            goToChapter(cycle.id);
          }}
        >
          <strong>
            {cycle.label}
            <span aria-hidden="true">↗</span>
          </strong>
          <span>{cycle.detail}</span>
          <small>{cycle.period}</small>
        </a>
      ))}
    </nav>
  );
}
