"use client";

import type { ReactNode } from "react";
import { useExperience } from "./ExperienceProvider";
import { SceneLoader } from "./SceneLoader";
import { TourProgress } from "./TourProgress";
import type { OrbitalVisualFocus } from "@/lib/orbital/types";

const sceneCopy: Record<string, { eyebrow: string; title: string }> = {
  "big-idea": { eyebrow: "The Big Idea", title: "Sunlight moves before climate does" },
  "orbit-shape": { eyebrow: "The Stretch", title: "Orbit Shape · Eccentricity" },
  "axis-tilt": { eyebrow: "The Lean", title: "Axis Tilt · Obliquity" },
  "axis-direction": { eyebrow: "The Wobble", title: "Axis Direction · Precession" },
  together: { eyebrow: "The Combined Signal", title: "Northern summer at 65°N" },
  recap: { eyebrow: "The Rhythm", title: "Three motions, one changing pattern" },
};

export function TourFrame({ children }: { children: ReactNode }) {
  const { parameters, scale, activeChapter, reducedMotion } = useExperience();
  const copy = sceneCopy[activeChapter] ?? sceneCopy["big-idea"];
  const visualFocus: OrbitalVisualFocus =
    activeChapter === "orbit-shape"
      ? "shape"
      : activeChapter === "axis-tilt"
        ? "tilt"
        : activeChapter === "axis-direction"
          ? "direction"
          : "combined";

  return (
    <>
      <TourProgress />
      <div className="tour-layout">
        <aside className="tour-scene-column" aria-label="Orbital visualization">
          <div className="tour-scene-panel">
            <SceneLoader
              parameters={parameters}
              scale={scale}
              chapter={activeChapter}
              focus={visualFocus}
              reducedMotion={reducedMotion}
            />
            <div className="tour-scene-panel__caption">
              <div>
                <span>{copy.eyebrow}</span>
                <strong>{copy.title}</strong>
              </div>
              <span className="scale-badge">Shape {scale === "5x" ? "×5" : "actual"}</span>
            </div>
          </div>
        </aside>
        <div className="tour-content">{children}</div>
      </div>
    </>
  );
}
