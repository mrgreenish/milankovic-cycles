"use client";

import type { ReactNode } from "react";
import { useExperience } from "./ExperienceProvider";
import { SceneLoader } from "./SceneLoader";
import { TourProgress } from "./TourProgress";
import type { OrbitalVisualFocus } from "@/lib/orbital/types";

export function TourFrame({ children }: { children: ReactNode }) {
  const { parameters, scale, activeChapter, reducedMotion } = useExperience();
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
          </div>
        </aside>
        <div className="tour-content">{children}</div>
      </div>
    </>
  );
}
