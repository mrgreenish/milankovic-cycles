import type { OrbitScale, OrbitalParameters } from "./types";

export const degreesToRadians = (degrees: number) =>
  (degrees * Math.PI) / 180;

export const radiansToDegrees = (radians: number) =>
  (radians * 180) / Math.PI;

export function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360;
}

export function ellipseSemiMinorAxis(semiMajorAxis: number, eccentricity: number) {
  return semiMajorAxis * Math.sqrt(1 - eccentricity * eccentricity);
}

export function ellipseFocusDistance(semiMajorAxis: number, eccentricity: number) {
  return semiMajorAxis * eccentricity;
}

export function perihelionDistanceAu(eccentricity: number) {
  return 1 - eccentricity;
}

export function aphelionDistanceAu(eccentricity: number) {
  return 1 + eccentricity;
}

export function perihelionToAphelionFluxRatio(eccentricity: number) {
  return ((1 + eccentricity) / (1 - eccentricity)) ** 2;
}

export function displayEccentricity(eccentricity: number, scale: OrbitScale) {
  return scale === "5x" ? Math.min(eccentricity * 5, 0.35) : eccentricity;
}

export function geocentricSolarLongitudeAtPerihelion(
  parameters: OrbitalParameters,
) {
  return normalizeDegrees(parameters.earthPerihelionLongitudeDeg + 180);
}

export function seasonOfClosestApproach(parameters: OrbitalParameters) {
  const longitude = geocentricSolarLongitudeAtPerihelion(parameters);
  if (longitude >= 315 || longitude < 45) return "Northern spring";
  if (longitude < 135) return "Northern summer";
  if (longitude < 225) return "Northern autumn";
  return "Northern winter";
}

