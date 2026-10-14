import { fill, num } from "@/i18n/format";
import { en, type Ui } from "@/i18n/ui/en";
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

export function formatParameter(
  key: ParameterKey,
  value: number,
  ui: Pick<Ui, "decimal"> = en,
) {
  return key === "eccentricity"
    ? num(ui, value, 4)
    : `${num(ui, value, key === "obliquityDeg" ? 2 : 1)}°`;
}
export function parameterValueText(
  key: ParameterKey,
  parameters: OrbitalParameters,
  ui: Pick<Ui, "decimal" | "seasons"> = en,
) {
  const value = formatParameter(key, parameters[key], ui);
  return key === "earthPerihelionLongitudeDeg"
    ? `${value}, ${seasonOfClosestApproach(parameters, ui)}`
    : value;
}

const millionKm = (au: number, ui: Pick<Ui, "decimal">) =>
  num(ui, au * KM_PER_AU, 1);

/** One plain sentence describing what the current value of a control does. */
export function describeParameter(
  key: ParameterKey,
  parameters: OrbitalParameters,
  ui: Pick<Ui, "decimal" | "describe"> = en,
) {
  const reading = calculateSummerInsolation(parameters);
  const { eccentricity } = parameters;
  const text = ui.describe;
  if (key === "eccentricity") {
    if (eccentricity < 0.0005) return text.circle;
    const contrast = (perihelionToAphelionFluxRatio(eccentricity) - 1) * 100;
    return fill(text.shape, {
      near: millionKm(perihelionDistanceAu(eccentricity), ui),
      far: millionKm(aphelionDistanceAu(eccentricity), ui),
      percent: contrast.toFixed(0),
    });
  }
  if (key === "obliquityDeg") {
    return fill(text.tilt, {
      hours: num(ui, reading.daylightHours, 1),
      elevation: num(
        ui,
        noonSunElevationDeg(SUMMER_LATITUDE_DEG, parameters.obliquityDeg),
        1,
      ),
    });
  }
  if (eccentricity < 0.0005) return text.directionCircle;
  const share =
    (reading.earthSunDistanceAu - perihelionDistanceAu(eccentricity)) /
    (aphelionDistanceAu(eccentricity) - perihelionDistanceAu(eccentricity));
  const place =
    share < 0.25
      ? text.placeNear
      : share > 0.75
        ? text.placeFar
        : text.placeBetween;
  return fill(text.direction, {
    place,
    distance: millionKm(reading.earthSunDistanceAu, ui),
  });
}

export function formatSunlightDelta(delta: number, ui: Pick<Ui, "sunlight"> = en) {
  if (Math.abs(delta) < 0.5) return ui.sunlight.same;
  return fill(delta > 0 ? ui.sunlight.more : ui.sunlight.less, {
    n: Math.abs(delta).toFixed(0),
  });
}
export function sunlightAnnouncement(
  parameters: OrbitalParameters,
  ui: Pick<Ui, "sunlight" | "melt"> = en,
) {
  const reading = calculateSummerInsolation(parameters);
  return fill(ui.sunlight.announce, {
    value: Math.round(reading.dailyMeanTopOfAtmosphereWm2),
    delta: formatSunlightDelta(reading.deltaFromPresentWm2, ui),
    melt: getMeltPressureCopy(
      getOrbitalMeltPressure(reading.deltaFromPresentWm2),
      ui,
    ),
  });
}
