import { degreesToRadians, normalizeDegrees } from "./geometry";
import { calculateSummerInsolation } from "./insolation";
import { ICE_RECORD_D18O, ICE_RECORD_END_KA } from "./iceRecord.generated";
import {
  SERIES_ECCENTRICITY,
  SERIES_END_KYR,
  SERIES_OBLIQUITY_DEG,
  SERIES_PERIHELION_DEG,
  SERIES_START_KYR,
} from "./series.generated";
import type { OrbitalParameters } from "./types";

export const TIME_START_KYR = SERIES_START_KYR;
export const TIME_END_KYR = SERIES_END_KYR;

export function clampTime(kyr: number) {
  return Math.min(TIME_END_KYR, Math.max(TIME_START_KYR, kyr));
}

/** La2004 orbit at a time in thousands of years from J2000 (negative = past). */
export function orbitalStateAt(kyr: number): OrbitalParameters {
  const position = clampTime(kyr) - SERIES_START_KYR;
  const index = Math.min(Math.floor(position), SERIES_ECCENTRICITY.length - 2);
  const mix = position - index;
  const lerp = (values: readonly number[]) =>
    values[index] + (values[index + 1] - values[index]) * mix;
  // The perihelion angle wraps at 360°, so step along the shorter arc.
  const from = SERIES_PERIHELION_DEG[index];
  const arc = ((SERIES_PERIHELION_DEG[index + 1] - from + 540) % 360) - 180;
  return {
    eccentricity: lerp(SERIES_ECCENTRICITY),
    obliquityDeg: lerp(SERIES_OBLIQUITY_DEG),
    earthPerihelionLongitudeDeg: normalizeDegrees(from + arc * mix),
  };
}

/** Positive when northern summer falls on the near side of the orbit. */
export function precessionIndex(parameters: OrbitalParameters) {
  return (
    -parameters.eccentricity *
    Math.sin(degreesToRadians(parameters.earthPerihelionLongitudeDeg))
  );
}

const ICE_TODAY = ICE_RECORD_D18O[0];
const ICE_LAST_GLACIAL = Math.max(...ICE_RECORD_D18O.slice(0, 30));

/**
 * Measured ice volume as a share of the last glacial maximum: 0 today, 1 at
 * the peak, slightly below 0 in the warmest interglacials. Null ahead of today.
 */
export function iceRawAt(kyr: number): number | null {
  if (kyr > 0) return null;
  const age = Math.min(-kyr, ICE_RECORD_END_KA);
  const index = Math.min(Math.floor(age), ICE_RECORD_D18O.length - 2);
  const value =
    ICE_RECORD_D18O[index] +
    (ICE_RECORD_D18O[index + 1] - ICE_RECORD_D18O[index]) * (age - index);
  return (value - ICE_TODAY) / (ICE_LAST_GLACIAL - ICE_TODAY);
}

/** The same, kept between 0 and 1 for charts and the tour. */
export function iceIndexAt(kyr: number): number | null {
  const raw = iceRawAt(kyr);
  return raw === null ? null : Math.min(1, Math.max(0, raw));
}

export type TimelineSeries = {
  kyr: number[];
  eccentricity: number[];
  obliquityDeg: number[];
  precession: number[];
  insolation: number[];
  ice: (number | null)[];
};

let cachedSeries: TimelineSeries | null = null;

/** One sample per 1,000 years across the whole timeline, computed once. */
export function timelineSeries(): TimelineSeries {
  if (cachedSeries) return cachedSeries;
  const series: TimelineSeries = {
    kyr: [],
    eccentricity: [],
    obliquityDeg: [],
    precession: [],
    insolation: [],
    ice: [],
  };
  for (let kyr = TIME_START_KYR; kyr <= TIME_END_KYR; kyr += 1) {
    const parameters = orbitalStateAt(kyr);
    series.kyr.push(kyr);
    series.eccentricity.push(parameters.eccentricity);
    series.obliquityDeg.push(parameters.obliquityDeg);
    series.precession.push(precessionIndex(parameters));
    series.insolation.push(
      calculateSummerInsolation(parameters).dailyMeanTopOfAtmosphereWm2,
    );
    series.ice.push(iceIndexAt(kyr));
  }
  cachedSeries = series;
  return series;
}

const yearFormat = new Intl.NumberFormat("en-US");

export function formatYears(kyr: number) {
  const years = Math.round(kyr) * 1000;
  if (years === 0) return "Today";
  return years < 0
    ? `${yearFormat.format(-years)} years ago`
    : `${yearFormat.format(years)} years from now`;
}

export const TIMELINE_MOMENTS = [
  { kyr: -125, label: "Last warm period" },
  { kyr: -21, label: "Peak of the last ice age" },
  { kyr: -11, label: "Strongest recent summers" },
  { kyr: 0, label: "Today" },
  { kyr: 50, label: "50,000 years ahead" },
] as const;
