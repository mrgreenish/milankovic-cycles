"use client";
import { useState } from "react";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type { OrbitalVisualFocus } from "@/lib/orbital/types";
import { isPlainLinkClick } from "@/lib/navigation";
import { OrbitalPoster } from "./OrbitalPoster";
import { useExperience, type TourChapterId } from "./ExperienceProvider";

const previews: {
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
    detail: "Orbit shape",
    period: "~100,000 years",
  },
  {
    id: "axis-tilt",
    focus: "tilt",
    label: "Lean",
    detail: "Axis tilt",
    period: "~41,000 years",
  },
  {
    id: "axis-direction",
    focus: "direction",
    label: "Wobble",
    detail: "Precession",
    period: "~23,000 years",
  },
];
export function HeroVisual() {
  const [focus, setFocus] = useState<OrbitalVisualFocus>("combined");
  const { goToChapter } = useExperience();
  return (
    <div className="hero-visual">
      <div className="hero-visual__art" aria-hidden="true">
        <span className="hero-visual__coordinate">EARTH / SUN</span>
        <OrbitalPoster
          parameters={PRESENT_PARAMETERS}
          scale="5x"
          focus={focus}
        />
        <span className="hero-visual__note">
          Orbit shape enlarged 5× to show the change.
        </span>
      </div>
      <nav
        className="cycle-previews"
        aria-label="Explore a cycle"
        onMouseLeave={() => setFocus("combined")}
      >
        {previews.map((preview) => (
          <a
            key={preview.id}
            href={`#${preview.id}`}
            onMouseEnter={() => setFocus(preview.focus)}
            onFocus={() => setFocus(preview.focus)}
            onClick={(event) => {
              if (!isPlainLinkClick(event)) return;
              event.preventDefault();
              goToChapter(preview.id);
            }}
          >
            <svg viewBox="0 0 60 42" aria-hidden="true">
              {preview.focus === "shape" ? (
                <>
                  <ellipse cx="30" cy="21" rx="25" ry="13" />
                  <circle
                    cx="21"
                    cy="21"
                    r="3"
                    className="cycle-previews__sun"
                  />
                </>
              ) : (
                <>
                  <circle cx="30" cy="21" r="12" />
                  <path d="M22 3 38 39" />
                  {preview.focus === "direction" ? (
                    <ellipse
                      cx="30"
                      cy="6"
                      rx="11"
                      ry="4"
                      strokeDasharray="3 3"
                    />
                  ) : (
                    <path d="M30 3v36" strokeDasharray="2 3" opacity=".4" />
                  )}
                </>
              )}
            </svg>
            <strong>
              {preview.label}
              <span aria-hidden="true">↗</span>
            </strong>
            <span>{preview.detail}</span>
            <small>{preview.period}</small>
          </a>
        ))}
      </nav>
    </div>
  );
}
