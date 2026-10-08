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

export function latitudeCircleGeometry(radius: number, latitudeDeg: number) {
  const latitude = degreesToRadians(latitudeDeg);
  return {
    axisOffset: radius * Math.sin(latitude),
    circleRadius: radius * Math.cos(latitude),
  };
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

export function summerSolsticeAxisVector(
  parameters: Pick<
    OrbitalParameters,
    "obliquityDeg" | "earthPerihelionLongitudeDeg"
  >,
): [number, number, number] {
  const trueAnomaly = degreesToRadians(
    270 - parameters.earthPerihelionLongitudeDeg,
  );
  const tilt = degreesToRadians(parameters.obliquityDeg);
  const horizontal = Math.sin(tilt);

  return [
    -Math.cos(trueAnomaly) * horizontal,
    Math.cos(tilt),
    -Math.sin(trueAnomaly) * horizontal,
  ];
}

/** True anomaly of the northern summer solstice, measured from perihelion. */
export function summerSolsticeTrueAnomaly(perihelionLongitudeDeg: number) {
  return degreesToRadians(270 - perihelionLongitudeDeg);
}

/** Solve Kepler's equation M = E − e·sin E for the eccentric anomaly E. */
export function eccentricAnomaly(meanAnomaly: number, eccentricity: number) {
  let estimate = meanAnomaly + eccentricity * Math.sin(meanAnomaly);
  for (let step = 0; step < 6; step += 1) {
    estimate -=
      (estimate - eccentricity * Math.sin(estimate) - meanAnomaly) /
      (1 - eccentricity * Math.cos(estimate));
  }
  return estimate;
}

export function trueAnomalyFromMean(meanAnomaly: number, eccentricity: number) {
  const eccentric = eccentricAnomaly(meanAnomaly, eccentricity);
  return (
    2 *
    Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentric / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentric / 2),
    )
  );
}

export function meanAnomalyFromTrue(trueAnomaly: number, eccentricity: number) {
  const eccentric =
    2 *
    Math.atan2(
      Math.sqrt(1 - eccentricity) * Math.sin(trueAnomaly / 2),
      Math.sqrt(1 + eccentricity) * Math.cos(trueAnomaly / 2),
    );
  return eccentric - eccentricity * Math.sin(eccentric);
}

/** Orbit radius at a true anomaly, in units of the semi-major axis. */
export function orbitRadius(trueAnomaly: number, eccentricity: number) {
  return (
    (1 - eccentricity * eccentricity) /
    (1 + eccentricity * Math.cos(trueAnomaly))
  );
}

/** Height of the midday Sun on the northern summer solstice. */
export function noonSunElevationDeg(latitudeDeg: number, obliquityDeg: number) {
  return Math.min(90, 90 - latitudeDeg + obliquityDeg);
}

export const KM_PER_AU = 149.5978707;
