"use client";

import { useEffect, useMemo, useState } from "react";
import { climateAt } from "@/lib/orbital/climate";
import { ORBITAL_CONTROLS } from "@/lib/orbital/controls";
import type { OrbitalParameters, OrbitalVisualFocus } from "@/lib/orbital/types";
import { CHAPTER_FOCUS, useExperience } from "./ExperienceProvider";
import { Stage, type StageDrag } from "./Stage";
import { TimelinePanel } from "./TimelinePanel";
import { stageDragFor } from "./stageDrag";
import { useMediaQuery } from "./useMediaQuery";
import { TourProgress } from "./TourProgress";

/** While a title button is hovered, the scene performs that motion on loop. */
function usePreviewParameters(
  base: OrbitalParameters,
  preview: OrbitalVisualFocus | null,
) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!preview) return;
    const start = performance.now();
    const id = window.setInterval(
      () => setSeconds((performance.now() - start) / 1000),
      1000 / 30,
    );
    return () => window.clearInterval(id);
  }, [preview]);
  return useMemo(() => {
    if (!preview) return base;
    const wave = 0.5 - 0.5 * Math.cos((seconds / 4.5) * Math.PI * 2);
    const { eccentricity, obliquityDeg } = ORBITAL_CONTROLS;
    if (preview === "shape")
      return {
        ...base,
        eccentricity:
          base.eccentricity + (eccentricity.max - base.eccentricity) * wave,
      };
    if (preview === "tilt")
      return {
        ...base,
        obliquityDeg:
          obliquityDeg.min + (obliquityDeg.max - obliquityDeg.min) * wave,
      };
    if (preview === "direction")
      return {
        ...base,
        earthPerihelionLongitudeDeg:
          (base.earthPerihelionLongitudeDeg + seconds * 80) % 360,
      };
    return base;
  }, [base, preview, seconds]);
}

export function TourStage() {
  const ex = useExperience();
  const focus: OrbitalVisualFocus =
    ex.preview ?? (ex.inHero ? "hero" : CHAPTER_FOCUS[ex.activeChapter]);
  const parameters = usePreviewParameters(ex.parameters, ex.preview);
  const { nudgeParameter, nudgeTime } = ex;

  const drag = useMemo<StageDrag>(
    () =>
      ex.preview ? null : stageDragFor(focus, { nudgeParameter, nudgeTime }),
    [focus, ex.preview, nudgeParameter, nudgeTime],
  );

  const rate = ex.playing?.kind === "time" ? 24 : ex.playing ? 14 : 7;
  const ice = focus === "idea" || focus === "timeline" ? ex.ice : 0;
  // Only the clock chapter lets the scene run its own clock and show the
  // climate globe; elsewhere a time change is just a change of orbit.
  const clock = focus === "timeline";
  const wide = useMediaQuery("(min-width: 981px)");
  const climate = climateAt(ex.timeKyr, ex.parameters);
  const globe =
    clock && wide
      ? { iceShare: climate.iceShare, deltaTempC: climate.deltaTempC }
      : null;

  return (
    <Stage
      variant="tour"
      focus={focus}
      parameters={parameters}
      scale={ex.scale}
      ice={ice}
      timeKyr={clock ? ex.timeKyr : null}
      iceFollowsClock={clock}
      globe={globe}
      reducedMotion={ex.reducedMotion}
      live={ex.live}
      rate={rate}
      drag={drag}
      onScale={ex.setScale}
    >
      <TourProgress />
      <TimelinePanel placement="dock" />
    </Stage>
  );
}
