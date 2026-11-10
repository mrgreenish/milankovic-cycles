import { fill } from "@/i18n/format";
import type { Ui } from "@/i18n/ui";
import { climateAt, describeClimate, iceCaption } from "@/lib/orbital/climate";
import { formatSunlightDelta } from "@/lib/orbital/controls";
import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import { LAB_BOUNDS, labPath, type ParsedLabQuery } from "@/lib/orbital/query";
import {
  TIME_END_KYR,
  TIME_START_KYR,
  formatYears,
  orbitalStateAt,
} from "@/lib/orbital/timeline";
import type { OrbitalParameters } from "@/lib/orbital/types";

/**
 * What a shared lab link says about its setup, for the preview card and the
 * text beside it. Everything here is worked out from the orbit; nothing is
 * taken from the link as a finished number except in `parseLabCard`, which
 * only accepts values the lab can reach.
 *
 * A date is drawn for that date. An orbit set by hand is drawn by its
 * sunlight alone, because that is all the card states about it, so every
 * hand-set orbit with the same reading shares one image.
 */
export type LabSetup =
  { kind: "time"; timeKyr: number } | { kind: "own"; sunlightWm2: number };

const sunlight = (parameters: OrbitalParameters) =>
  calculateSummerInsolation(parameters).dailyMeanTopOfAtmosphereWm2;

const atMostStretched = (obliquityDeg: number, perihelionDeg: number) =>
  Math.round(
    sunlight({
      eccentricity: LAB_BOUNDS.eccentricity.max,
      obliquityDeg,
      earthPerihelionLongitudeDeg: perihelionDeg,
    }),
  );

/** The weakest and strongest midsummer sunlight the lab's limits allow. */
export const OWN_SUNLIGHT_RANGE = {
  // Least tilt with summer at the far end of the most stretched orbit.
  min: atMostStretched(LAB_BOUNDS.obliquityDeg.min, 90),
  // Most tilt with summer at the near end.
  max: atMostStretched(LAB_BOUNDS.obliquityDeg.max, 270),
};

/** The setup a link carries, or null for today's orbit and for links with bad values. */
export function labSetup(parsed: ParsedLabQuery): LabSetup | null {
  if (parsed.invalidFields.some((field) => field !== "scale")) return null;
  if (parsed.timeKyr !== null) {
    // Links carry the date to the nearest hundred years.
    const timeKyr = Math.round(parsed.timeKyr * 10) / 10;
    return timeKyr === 0 ? null : { kind: "time", timeKyr };
  }
  if (labPath(parsed.parameters, "5x") === "/lab") return null;
  return { kind: "own", sunlightWm2: Math.round(sunlight(parsed.parameters)) };
}

/** `lab-t-21`, `lab-t50.5` or `lab-own-503`. */
export function labCard(setup: LabSetup) {
  return setup.kind === "time"
    ? `lab-t${setup.timeKyr}`
    : `lab-own-${setup.sunlightWm2}`;
}

/** The setup a card name stands for. Each setup has exactly one name. */
export function parseLabCard(card: string): LabSetup | null {
  const time = /^lab-t(-?\d+(?:\.\d)?)$/.exec(card);
  const own = /^lab-own-(\d+)$/.exec(card);
  const setup: LabSetup | null = time
    ? { kind: "time", timeKyr: Number(time[1]) }
    : own
      ? { kind: "own", sunlightWm2: Number(own[1]) }
      : null;
  if (!setup || labCard(setup) !== card) return null;
  if (setup.kind === "time")
    return setup.timeKyr !== 0 &&
      setup.timeKyr >= TIME_START_KYR &&
      setup.timeKyr <= TIME_END_KYR
      ? setup
      : null;
  return setup.sunlightWm2 >= OWN_SUNLIGHT_RANGE.min &&
    setup.sunlightWm2 <= OWN_SUNLIGHT_RANGE.max
    ? setup
    : null;
}

export type LabReading = {
  /** The date in words, or that the orbit was set by hand. */
  heading: string;
  /** Midsummer sunlight at 65°N, to the nearest W/m². */
  sunlightWm2: number;
  /** Measured ice for a date in the record; null ahead of today and for a hand-set orbit. */
  ice: string | null;
  /** True for a date ahead of today, where only the orbit is known. */
  orbitOnly: boolean;
  alt: string;
};

/** The words and numbers on a setup's card. */
export function labReading(setup: LabSetup, ui: Ui): LabReading {
  const reading = (
    heading: string,
    sunlightWm2: number,
    ice: string | null,
    orbitOnly: boolean,
  ): LabReading => ({
    heading,
    sunlightWm2,
    ice,
    orbitOnly,
    alt: `${ui.lab.title}. ${heading}: ${fill(ui.timeline.reading, { value: sunlightWm2 })}${ice ? `, ${ice}` : ""}.`,
  });
  if (setup.kind === "own")
    return reading(ui.lab.sharedOwn, setup.sunlightWm2, null, false);
  const parameters = orbitalStateAt(setup.timeKyr);
  const climate = climateAt(setup.timeKyr, parameters);
  const measured = climate.source === "record";
  return reading(
    formatYears(setup.timeKyr, ui),
    Math.round(sunlight(parameters)),
    measured ? iceCaption(climate.iceShare, ui) : null,
    !measured,
  );
}

export type LabShare = {
  card: string;
  heading: string;
  alt: string;
  /** A sentence or two for the text beside the card. */
  description: string;
};

/** Everything a shared lab link's preview needs, or null when the plain lab preview fits. */
export function labShare(parsed: ParsedLabQuery, ui: Ui): LabShare | null {
  const setup = labSetup(parsed);
  if (!setup) return null;
  const { heading, sunlightWm2, alt } = labReading(setup, ui);
  const timeKyr = setup.kind === "time" ? setup.timeKyr : null;
  const parameters =
    timeKyr === null ? parsed.parameters : orbitalStateAt(timeKyr);
  const climate = climateAt(timeKyr, parameters);
  const detail =
    climate.source === "record"
      ? describeClimate(climate, timeKyr, ui)
      : `${formatSunlightDelta(calculateSummerInsolation(parameters).deltaFromPresentWm2, ui)}.`;
  return {
    card: labCard(setup),
    heading,
    alt,
    description: `${ui.lab.sunlightTitle} ${ui.lab.at65}: ${sunlightWm2} W/m². ${detail}`,
  };
}
