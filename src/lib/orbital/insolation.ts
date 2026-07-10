import { degreesToRadians } from "./geometry";
import type {
  OrbitalMeltPressure,
  OrbitalParameters,
  SummerInsolationReading,
} from "./types";

export const SOLAR_CONSTANT_WM2 = 1361;
export const SUMMER_LATITUDE_DEG = 65 as const;
export const NORTHERN_SUMMER_SOLSTICE_LONGITUDE_DEG = 90 as const;

export const PRESENT_PARAMETERS: OrbitalParameters = {
  eccentricity: 0.016702362,
  obliquityDeg: 23.439291,
  earthPerihelionLongitudeDeg: 102.917945,
};

type DailyInsolationResult = {
  dailyMeanTopOfAtmosphereWm2: number;
  daylightHours: number;
  earthSunDistanceAu: number;
};

export function calculateDailyMeanInsolation(
  parameters: OrbitalParameters,
  latitudeDeg: number,
  solarLongitudeDeg: number,
): DailyInsolationResult {
  const latitude = degreesToRadians(latitudeDeg);
  const solarLongitude = degreesToRadians(solarLongitudeDeg);
  const obliquity = degreesToRadians(parameters.obliquityDeg);
  const solarLongitudeAtPerihelion = degreesToRadians(
    parameters.earthPerihelionLongitudeDeg + 180,
  );

  const eccentricity = parameters.eccentricity;
  const earthSunDistanceAu =
    (1 - eccentricity * eccentricity) /
    (1 + eccentricity * Math.cos(solarLongitude - solarLongitudeAtPerihelion));

  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(solarLongitude),
  );
  const hourAngleCosine = -Math.tan(latitude) * Math.tan(declination);

  let sunsetHourAngle: number;
  if (hourAngleCosine >= 1) {
    sunsetHourAngle = 0;
  } else if (hourAngleCosine <= -1) {
    sunsetHourAngle = Math.PI;
  } else {
    sunsetHourAngle = Math.acos(hourAngleCosine);
  }

  const geometricTerm =
    sunsetHourAngle * Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) *
      Math.cos(declination) *
      Math.sin(sunsetHourAngle);

  const dailyMeanTopOfAtmosphereWm2 =
    (SOLAR_CONSTANT_WM2 / (Math.PI * earthSunDistanceAu ** 2)) *
    geometricTerm;

  return {
    dailyMeanTopOfAtmosphereWm2: Math.max(0, dailyMeanTopOfAtmosphereWm2),
    daylightHours: (24 * sunsetHourAngle) / Math.PI,
    earthSunDistanceAu,
  };
}

const presentRawReading = calculateDailyMeanInsolation(
  PRESENT_PARAMETERS,
  SUMMER_LATITUDE_DEG,
  NORTHERN_SUMMER_SOLSTICE_LONGITUDE_DEG,
);

export const PRESENT_SUMMER_INSOLATION_WM2 =
  presentRawReading.dailyMeanTopOfAtmosphereWm2;

export function calculateSummerInsolation(
  parameters: OrbitalParameters,
): SummerInsolationReading {
  const reading = calculateDailyMeanInsolation(
    parameters,
    SUMMER_LATITUDE_DEG,
    NORTHERN_SUMMER_SOLSTICE_LONGITUDE_DEG,
  );

  return {
    latitudeDeg: SUMMER_LATITUDE_DEG,
    solarLongitudeDeg: NORTHERN_SUMMER_SOLSTICE_LONGITUDE_DEG,
    dailyMeanTopOfAtmosphereWm2: reading.dailyMeanTopOfAtmosphereWm2,
    deltaFromPresentWm2:
      reading.dailyMeanTopOfAtmosphereWm2 - PRESENT_SUMMER_INSOLATION_WM2,
    daylightHours: reading.daylightHours,
    earthSunDistanceAu: reading.earthSunDistanceAu,
  };
}

export function getOrbitalMeltPressure(
  deltaFromPresentWm2: number,
): OrbitalMeltPressure {
  if (deltaFromPresentWm2 < -5) return "less-summer-melt";
  if (deltaFromPresentWm2 > 5) return "more-summer-melt";
  return "near-present";
}

export function getMeltPressureCopy(pressure: OrbitalMeltPressure) {
  if (pressure === "less-summer-melt") {
    return "Weaker summer sunlight. All else equal, winter snow has more chance to survive.";
  }
  if (pressure === "more-summer-melt") {
    return "Stronger summer sunlight. All else equal, more summer melting is favored.";
  }
  return "Close to present-day orbital summer-melt pressure.";
}

