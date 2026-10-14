"use client";

import type { OrbitalVisualFocus } from "@/lib/orbital/types";
import { fill } from "@/i18n/format";
import { useUi } from "@/i18n/LocaleProvider";
import { isPlainLinkClick } from "@/lib/navigation";
import { useExperience, type TourChapterId } from "./ExperienceProvider";

const cycles: { id: TourChapterId; focus: OrbitalVisualFocus }[] = [
  { id: "orbit-shape", focus: "shape" },
  { id: "axis-tilt", focus: "tilt" },
  { id: "axis-direction", focus: "direction" },
];

/** Three cards under the title. Pointing at one makes the scene perform it. */
export function HeroCycles() {
  const { goToChapter, setPreview } = useExperience();
  const ui = useUi();
  return (
    <nav
      className="cycle-previews"
      aria-label={ui.tour.exploreCycle}
      onMouseLeave={() => setPreview(null)}
    >
      {cycles.map((cycle) => {
        const text = ui.tour.cycles[cycle.id as keyof typeof ui.tour.cycles];
        return (
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
              {text.label}
              <span aria-hidden="true">↗</span>
            </strong>
            <span>{text.detail}</span>
            <small>{fill(ui.tour.every, { period: text.period })}</small>
          </a>
        );
      })}
    </nav>
  );
}
