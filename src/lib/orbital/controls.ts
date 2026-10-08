import {
  KM_PER_AU,
  aphelionDistanceAu,
  noonSunElevationDeg,
  perihelionDistanceAu,
  perihelionToAphelionFluxRatio,
  seasonOfClosestApproach,
} from "./geometry";
import {
  calculateSummerInsolation,
  getMeltPressureCopy,
  getOrbitalMeltPressure,
  SUMMER_LATITUDE_DEG,
} from "./insolation";
import type { OrbitalParameters, OrbitalVisualFocus } from "./types";

export type ParameterKey = keyof OrbitalParameters;
export const ORBITAL_CONTROLS = {
  eccentricity: {
    label: "Orbit shape",
    term: "Eccentricity",
    period: "~100,000 years",
    focus: "shape",
    min: 0,
    max: 0.058,
    step: 0.0001,
    minLabel: "Circle",
    maxLabel: "Stretched",
    experiments: [
      { label: "Perfect circle", value: 0 },
      { label: "Most stretched", value: 0.058 },
    ],
  },
  obliquityDeg: {
    label: "Axis tilt",
    term: "Obliquity",
    period: "~41,000 years",
    focus: "tilt",
    min: 22,
    max: 24.6,
    step: 0.01,
    minLabel: "Less tilt",
    maxLabel: "More tilt",
    experiments: [
      { label: "Least tilt · 22.1°", value: 22.1 },
      { label: "Most tilt · 24.5°", value: 24.5 },
    ],
  },
  earthPerihelionLongitudeDeg: {
    label: "Axis direction",
    term: "Precession",
    period: "~23,000 years",
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
    period: string;
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

export function clampParameter(key: ParameterKey, value: number) {
  const { min, max } = ORBITAL_CONTROLS[key];
  return Math.min(max, Math.max(min, value));
}

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

const millionKm = (au: number) => (au * KM_PER_AU).toFixed(1);

/** One plain sentence describing what the current value of a control does. */
export function describeParameter(
  key: ParameterKey,
  parameters: OrbitalParameters,
) {
  const reading = calculateSummerInsolation(parameters);
  const { eccentricity } = parameters;
  if (key === "eccentricity") {
    if (eccentricity < 0.0005)
      return "A circle. Earth stays 149.6 million km from the Sun all year, so every season gets the same boost.";
    const contrast = (perihelionToAphelionFluxRatio(eccentricity) - 1) * 100;
    return `Earth swings between ${millionKm(perihelionDistanceAu(eccentricity))} and ${millionKm(aphelionDistanceAu(eccentricity))} million km from the Sun. Sunlight is ${contrast.toFixed(0)}% stronger at the near end.`;
  }
  if (key === "obliquityDeg") {
    return `At midsummer the Sun stays up for ${reading.daylightHours.toFixed(1)} hours at 65°N and climbs ${noonSunElevationDeg(SUMMER_LATITUDE_DEG, parameters.obliquityDeg).toFixed(1)}° above the horizon.`;
  }
  if (eccentricity < 0.0005)
    return "The orbit is a circle, so it makes no difference where summer falls.";
  const share =
    (reading.earthSunDistanceAu - perihelionDistanceAu(eccentricity)) /
    (aphelionDistanceAu(eccentricity) - perihelionDistanceAu(eccentricity));
  const place =
    share < 0.25
      ? "near the closest point of the orbit"
      : share > 0.75
        ? "near the farthest point of the orbit"
        : "between the closest and farthest points";
  return `Northern summer falls ${place}, ${millionKm(reading.earthSunDistanceAu)} million km from the Sun.`;
}

export function formatSunlightDelta(delta: number) {
  if (Math.abs(delta) < 0.5) return "Same as today";
  return `${Math.abs(delta).toFixed(0)} W/m² ${delta > 0 ? "more" : "less"} than today`;
}
export function sunlightAnnouncement(parameters: OrbitalParameters) {
  const reading = calculateSummerInsolation(parameters);
  return `${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} watts per square metre. ${formatSunlightDelta(reading.deltaFromPresentWm2)}. ${getMeltPressureCopy(getOrbitalMeltPressure(reading.deltaFromPresentWm2))}`;
}
