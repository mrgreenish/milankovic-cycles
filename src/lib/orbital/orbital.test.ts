import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import {
  aphelionDistanceAu,
  degreesToRadians,
  ellipseFocusDistance,
  ellipseSemiMinorAxis,
  latitudeCircleGeometry,
  perihelionDistanceAu,
  summerSolsticeAxisVector,
} from "./geometry";
import {
  calculateDailyMeanInsolation,
  calculateSummerInsolation,
  SOLAR_CONSTANT_WM2,
} from "./insolation";
import { ORBITAL_MILESTONES } from "./milestones";

describe("La2004 milestone fixtures", () => {
  it.each(ORBITAL_MILESTONES)(
    "matches $label summer insolation",
    (milestone) => {
      const calculated = calculateSummerInsolation(milestone.parameters);
      expect(calculated.dailyMeanTopOfAtmosphereWm2).toBeCloseTo(
        milestone.expectedReading.dailyMeanTopOfAtmosphereWm2,
        1,
      );
    },
  );
});

describe("daily-mean insolation invariants", () => {
  const circular = {
    eccentricity: 0,
    obliquityDeg: 23.439291,
    earthPerihelionLongitudeDeg: 0,
  };

  it("returns S0 / pi and twelve hours of daylight at an equatorial equinox", () => {
    const reading = calculateDailyMeanInsolation(circular, 0, 0);
    expect(reading.dailyMeanTopOfAtmosphereWm2).toBeCloseTo(
      SOLAR_CONSTANT_WM2 / Math.PI,
      8,
    );
    expect(reading.daylightHours).toBeCloseTo(12, 8);
  });

  it("makes precession irrelevant for a circular orbit", () => {
    const first = calculateDailyMeanInsolation(circular, 65, 90);
    const second = calculateDailyMeanInsolation(
      { ...circular, earthPerihelionLongitudeDeg: 220 },
      65,
      90,
    );
    expect(first.dailyMeanTopOfAtmosphereWm2).toBeCloseTo(
      second.dailyMeanTopOfAtmosphereWm2,
      10,
    );
  });

  it("handles polar day and polar night", () => {
    const summer = calculateDailyMeanInsolation(circular, 90, 90);
    const winter = calculateDailyMeanInsolation(circular, 90, 270);
    expect(summer.daylightHours).toBeCloseTo(24, 8);
    expect(winter.daylightHours).toBe(0);
    expect(winter.dailyMeanTopOfAtmosphereWm2).toBe(0);
  });
});

describe("ellipse geometry", () => {
  it("uses the physical ellipse and focus relationships", () => {
    const a = 20;
    const eccentricity = 0.05;
    const b = ellipseSemiMinorAxis(a, eccentricity);
    const c = ellipseFocusDistance(a, eccentricity);
    expect(b * b + c * c).toBeCloseTo(a * a, 10);
    expect(perihelionDistanceAu(eccentricity)).toBeCloseTo(0.95, 10);
    expect(aphelionDistanceAu(eccentricity)).toBeCloseTo(1.05, 10);
  });

  it("leans the northern axis toward the Sun at northern summer solstice", () => {
    const parameters = ORBITAL_MILESTONES[2].parameters;
    const axis = new Vector3(...summerSolsticeAxisVector(parameters));
    const trueAnomaly = degreesToRadians(
      270 - parameters.earthPerihelionLongitudeDeg,
    );
    const earthToSun = new Vector3(
      -Math.cos(trueAnomaly),
      0,
      -Math.sin(trueAnomaly),
    );

    expect(axis.length()).toBeCloseTo(1, 10);
    expect(axis.y).toBeCloseTo(
      Math.cos(degreesToRadians(parameters.obliquityDeg)),
      10,
    );
    expect(axis.dot(earthToSun)).toBeCloseTo(
      Math.sin(degreesToRadians(parameters.obliquityDeg)),
      10,
    );
  });

  it("places the 65 degree latitude ring at the correct spherical radius", () => {
    const ring = latitudeCircleGeometry(1, 65);
    expect(ring.axisOffset).toBeCloseTo(Math.sin(degreesToRadians(65)), 10);
    expect(ring.circleRadius).toBeCloseTo(Math.cos(degreesToRadians(65)), 10);
    expect(ring.axisOffset ** 2 + ring.circleRadius ** 2).toBeCloseTo(1, 10);
  });
});
