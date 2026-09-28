import { seasonOfClosestApproach } from "./geometry";
import {
  calculateSummerInsolation,
  getMeltPressureCopy,
  getOrbitalMeltPressure,
} from "./insolation";
import type { OrbitalParameters, OrbitalVisualFocus } from "./types";

export type ParameterKey = keyof OrbitalParameters;
export const ORBITAL_CONTROLS = {
  eccentricity: {
    label: "Orbit shape",
    term: "Eccentricity",
    focus: "shape",
    min: 0.005,
    max: 0.058,
    step: 0.0001,
    minLabel: "Rounder",
    maxLabel: "More elliptical",
    experiments: [
      { label: "Rounder orbit", value: 0.005 },
      { label: "More elliptical", value: 0.058 },
    ],
  },
  obliquityDeg: {
    label: "Axis tilt",
    term: "Obliquity",
    focus: "tilt",
    min: 22.1,
    max: 24.5,
    step: 0.01,
    minLabel: "Less tilt",
    maxLabel: "More tilt",
    experiments: [
      { label: "Less tilt · 22.1°", value: 22.1 },
      { label: "More tilt · 24.5°", value: 24.5 },
    ],
  },
  earthPerihelionLongitudeDeg: {
    label: "Season of closest approach",
    term: "Precession",
    focus: "direction",
    min: 0,
    max: 359.9,
    step: 0.1,
    minLabel: "0°",
    maxLabel: "360°",
    experiments: [
      { label: "Summer nearest the Sun", value: 270 },
      { label: "Summer farthest from the Sun", value: 90 },
    ],
  },
} satisfies Record<
  ParameterKey,
  {
    label: string;
    term: string;
    focus: OrbitalVisualFocus;
    min: number;
    max: number;
    step: number;
    minLabel: string;
    maxLabel: string;
    experiments: { label: string; value: number }[];
  }
>;
export const PARAMETER_KEYS = Object.keys(ORBITAL_CONTROLS) as ParameterKey[];

export function formatParameter(key: ParameterKey, value: number) {
  return key === "eccentricity"
    ? value.toFixed(4)
    : `${value.toFixed(key === "obliquityDeg" ? 2 : 1)}°`;
}
export function parameterValueText(
  key: ParameterKey,
  parameters: OrbitalParameters,
) {
  const value = formatParameter(key, parameters[key]);
  return key === "earthPerihelionLongitudeDeg"
    ? `${value}, ${seasonOfClosestApproach(parameters)}`
    : value;
}
export function formatSunlightDelta(delta: number) {
  if (Math.abs(delta) < 0.5) return "Same as today";
  return `${Math.abs(delta).toFixed(0)} W/m² ${delta > 0 ? "more" : "less"} than today`;
}
export function sunlightAnnouncement(parameters: OrbitalParameters) {
  const reading = calculateSummerInsolation(parameters);
  return `${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} watts per square metre. ${formatSunlightDelta(reading.deltaFromPresentWm2)}. ${getMeltPressureCopy(getOrbitalMeltPressure(reading.deltaFromPresentWm2))}`;
}
