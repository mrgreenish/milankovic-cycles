"use client";

import {
  calculateSummerInsolation,
  getMeltPressureCopy,
  getOrbitalMeltPressure,
} from "@/lib/orbital/insolation";
import { useExperience } from "./ExperienceProvider";

export function ReadingCard() {
  const { parameters } = useExperience();
  const reading = calculateSummerInsolation(parameters);
  const pressure = getOrbitalMeltPressure(reading.deltaFromPresentWm2);
  const delta = reading.deltaFromPresentWm2;

  return (
    <aside className="reading-card" aria-label="Northern summer sunlight reading">
      <p className="eyebrow">Classic Northern Ice-Sheet Indicator</p>
      <h3>Northern Summer Sunlight</h3>
      <p className="reading-card__definition">
        Daily average at 65°N on the summer solstice, at the top of the atmosphere.
      </p>
      <div className="reading-card__value">
        <strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)}</strong>
        <span>W/m²</span>
      </div>
      <p className="reading-card__delta">
        {Math.abs(delta) < 0.5
          ? "Present reference"
          : `${Math.abs(delta).toFixed(0)} W/m² ${delta > 0 ? "more" : "less"} than present`}
      </p>
      <p className="reading-card__interpretation">{getMeltPressureCopy(pressure)}</p>
      <p className="reading-card__caveat">
        This is an orbital tendency, not a forecast of ice-sheet size. Greenhouse gases,
        oceans, snowfall, existing ice, and long response times also matter.
      </p>
    </aside>
  );
}

