"use client";

import {
  aphelionDistanceAu,
  perihelionDistanceAu,
  perihelionToAphelionFluxRatio,
  seasonOfClosestApproach,
} from "@/lib/orbital/geometry";
import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import { useExperience } from "./ExperienceProvider";

export function CycleReadout({ cycle }: { cycle: "shape" | "tilt" | "direction" }) {
  const { parameters } = useExperience();
  const reading = calculateSummerInsolation(parameters);

  if (cycle === "shape") {
    const contrast = (perihelionToAphelionFluxRatio(parameters.eccentricity) - 1) * 100;
    return (
      <div className="mini-readout" aria-label="Orbit shape reading">
        <div><span>Closest</span><strong>{perihelionDistanceAu(parameters.eccentricity).toFixed(3)} AU</strong></div>
        <div><span>Farthest</span><strong>{aphelionDistanceAu(parameters.eccentricity).toFixed(3)} AU</strong></div>
        <div><span>Sunlight contrast</span><strong>{contrast.toFixed(1)}%</strong></div>
      </div>
    );
  }

  if (cycle === "tilt") {
    return (
      <div className="mini-readout" aria-label="Axis tilt reading">
        <div><span>Axis tilt</span><strong>{parameters.obliquityDeg.toFixed(2)}°</strong></div>
        <div><span>65°N daylight</span><strong>{reading.daylightHours.toFixed(1)} h</strong></div>
        <div><span>Summer sunlight</span><strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)} W/m²</strong></div>
      </div>
    );
  }

  return (
    <div className="mini-readout" aria-label="Axis direction reading">
      <div><span>Closest approach</span><strong>{seasonOfClosestApproach(parameters)}</strong></div>
      <div><span>Perihelion angle</span><strong>{parameters.earthPerihelionLongitudeDeg.toFixed(0)}°</strong></div>
      <div><span>Summer sunlight</span><strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)} W/m²</strong></div>
    </div>
  );
}

