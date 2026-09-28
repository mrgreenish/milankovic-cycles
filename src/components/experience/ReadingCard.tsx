"use client";

import {
  calculateSummerInsolation,
  getMeltPressureCopy,
  getOrbitalMeltPressure,
} from "@/lib/orbital/insolation";
import { formatSunlightDelta } from "@/lib/orbital/controls";
import { useExperience } from "./ExperienceProvider";

export function ReadingCard() {
  const { parameters } = useExperience();
  const reading = calculateSummerInsolation(parameters);
  const pressure = getOrbitalMeltPressure(reading.deltaFromPresentWm2);
  const delta = reading.deltaFromPresentWm2;

  return (
    <aside
      className="reading-card"
      aria-label="Northern summer sunlight reading"
    >
      <p className="eyebrow">Your combined settings</p>
      <h3>Summer sunlight at 65°N</h3>
      <p className="reading-card__definition">
        Daily average at 65°N on the summer solstice, at the top of the
        atmosphere.
      </p>
      <div className="reading-card__value">
        <strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)}</strong>
        <span>W/m²</span>
      </div>
      <p className="reading-card__delta">{formatSunlightDelta(delta)}</p>
      <p className="reading-card__interpretation">
        {getMeltPressureCopy(pressure)}
      </p>
      <p className="reading-card__caveat">
        This measures sunlight, not temperature or ice-sheet size. The
        comparison uses the J2000 reference, for the year 2000.
      </p>
    </aside>
  );
}
