import { describe, expect, it } from "vitest";
import { ORBITAL_CONTROLS, PARAMETER_KEYS } from "./controls";
import {
  eccentricAnomaly,
  meanAnomalyFromTrue,
  noonSunElevationDeg,
  trueAnomalyFromMean,
} from "./geometry";
import { calculateSummerInsolation, PRESENT_PARAMETERS } from "./insolation";
import { ORBITAL_MILESTONES, matchingMilestone } from "./milestones";
import { labPath, parseLabQuery } from "./query";
import { displayedTime, initialOrbitalState, orbitalReducer } from "./state";
import {
  TIME_END_KYR,
  TIME_START_KYR,
  formatYears,
  iceIndexAt,
  orbitalStateAt,
  precessionIndex,
  timelineSeries,
} from "./timeline";

describe("La2004 time series", () => {
  it.each(ORBITAL_MILESTONES)(
    "reproduces the $label fixture at its node",
    (milestone) => {
      const state = orbitalStateAt(milestone.kyrFromJ2000);
      expect(state.eccentricity).toBeCloseTo(milestone.parameters.eccentricity, 8);
      expect(state.obliquityDeg).toBeCloseTo(milestone.parameters.obliquityDeg, 5);
      expect(state.earthPerihelionLongitudeDeg).toBeCloseTo(
        milestone.parameters.earthPerihelionLongitudeDeg,
        5,
      );
      expect(matchingMilestone(state)?.id).toBe(milestone.id);
    },
  );

  it("stays inside every control range", () => {
    const series = timelineSeries();
    expect(series.kyr[0]).toBe(TIME_START_KYR);
    expect(series.kyr.at(-1)).toBe(TIME_END_KYR);
    for (let index = 0; index < series.kyr.length; index += 1) {
      const state = orbitalStateAt(series.kyr[index]);
      for (const key of PARAMETER_KEYS) {
        expect(state[key]).toBeGreaterThanOrEqual(ORBITAL_CONTROLS[key].min);
        expect(state[key]).toBeLessThanOrEqual(
          key === "earthPerihelionLongitudeDeg" ? 360 : ORBITAL_CONTROLS[key].max,
        );
      }
    }
  });

  it("steps the perihelion angle along the short arc across 360°", () => {
    // Precession advances about 17° per thousand years, so a wrap happens
    // roughly every 21 nodes. Halfway between nodes must never jump back.
    for (let kyr = TIME_START_KYR; kyr < TIME_END_KYR; kyr += 1) {
      const from = orbitalStateAt(kyr).earthPerihelionLongitudeDeg;
      const middle = orbitalStateAt(kyr + 0.5).earthPerihelionLongitudeDeg;
      const step = ((middle - from + 540) % 360) - 180;
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(20);
    }
  });

  it("clamps times outside the series", () => {
    expect(orbitalStateAt(-5000)).toEqual(orbitalStateAt(TIME_START_KYR));
    expect(orbitalStateAt(5000)).toEqual(orbitalStateAt(TIME_END_KYR));
  });

  it("links the precession index to the summer distance", () => {
    const near = { ...PRESENT_PARAMETERS, earthPerihelionLongitudeDeg: 270 };
    const far = { ...PRESENT_PARAMETERS, earthPerihelionLongitudeDeg: 90 };
    expect(precessionIndex(near)).toBeCloseTo(PRESENT_PARAMETERS.eccentricity, 10);
    expect(precessionIndex(far)).toBeCloseTo(-PRESENT_PARAMETERS.eccentricity, 10);
    expect(calculateSummerInsolation(near).earthSunDistanceAu).toBeLessThan(
      calculateSummerInsolation(far).earthSunDistanceAu,
    );
  });
});

describe("measured ice record", () => {
  it("is zero today, full at the last glacial maximum and absent ahead", () => {
    expect(iceIndexAt(0)).toBe(0);
    expect(iceIndexAt(-18)).toBeCloseTo(1, 5);
    expect(iceIndexAt(-21)!).toBeGreaterThan(0.9);
    expect(iceIndexAt(-125)!).toBeLessThan(0.1);
    expect(iceIndexAt(1)).toBeNull();
  });
});

describe("time labels", () => {
  it("writes years in words", () => {
    expect(formatYears(0)).toBe("Today");
    expect(formatYears(-21)).toBe("21,000 years ago");
    expect(formatYears(-217.6)).toBe("218,000 years ago");
    expect(formatYears(50)).toBe("50,000 years from now");
  });
});

describe("Kepler helpers", () => {
  it("round-trips mean and true anomaly", () => {
    for (const eccentricity of [0, 0.0167, 0.25, 0.35]) {
      for (let mean = -3; mean <= 3; mean += 0.37) {
        const eccentric = eccentricAnomaly(mean, eccentricity);
        expect(eccentric - eccentricity * Math.sin(eccentric)).toBeCloseTo(mean, 10);
        expect(
          meanAnomalyFromTrue(trueAnomalyFromMean(mean, eccentricity), eccentricity),
        ).toBeCloseTo(mean, 9);
      }
    }
  });

  it("puts the midsummer noon Sun at 90° − latitude + tilt", () => {
    expect(noonSunElevationDeg(65, 23.44)).toBeCloseTo(48.44, 10);
  });
});

describe("shared orbital state", () => {
  it("follows La2004 while a time is set and lets go on a manual change", () => {
    let state = orbitalReducer(initialOrbitalState, { type: "time", kyr: -21 });
    expect(state.timeKyr).toBe(-21);
    expect(state.ice).toBeGreaterThan(0.9);
    expect(matchingMilestone(state.parameters)?.id).toBe("lgm21k");
    state = orbitalReducer(state, {
      type: "parameter",
      key: "obliquityDeg",
      value: 99,
    });
    expect(state.timeKyr).toBeNull();
    expect(state.ice).toBeGreaterThan(0.9);
    expect(state.parameters.obliquityDeg).toBe(ORBITAL_CONTROLS.obliquityDeg.max);
    expect(displayedTime(state)).toBeNull();
    state = orbitalReducer(state, { type: "reset" });
    expect(state.parameters).toEqual(PRESENT_PARAMETERS);
    expect(state.ice).toBe(0);
    expect(displayedTime(state)).toBe(0);
  });

  it("nudges relative to the current value and wraps the axis direction", () => {
    let state = orbitalReducer(initialOrbitalState, {
      type: "nudge",
      key: "earthPerihelionLongitudeDeg",
      delta: 300,
    });
    expect(state.parameters.earthPerihelionLongitudeDeg).toBeCloseTo(42.917945, 5);
    state = orbitalReducer(state, { type: "nudge", key: "obliquityDeg", delta: -50 });
    expect(state.parameters.obliquityDeg).toBe(ORBITAL_CONTROLS.obliquityDeg.min);
    state = orbitalReducer(state, { type: "timeNudge", delta: -30 });
    expect(state.timeKyr).toBe(-30);
    state = orbitalReducer(state, { type: "timeNudge", delta: -5000 });
    expect(state.timeKyr).toBe(TIME_START_KYR);
  });

  it("carries a time through the lab URL", () => {
    expect(labPath(orbitalStateAt(-21), "5x", -21)).toBe("/lab?t=-21&scale=5x");
    expect(labPath(PRESENT_PARAMETERS, "5x", 0)).toBe("/lab");
    const parsed = parseLabQuery(new URLSearchParams("t=-21&e=0.05"));
    expect(parsed.invalidFields).toEqual([]);
    expect(parsed.timeKyr).toBe(-21);
    expect(matchingMilestone(parsed.parameters)?.id).toBe("lgm21k");
    const invalid = parseLabQuery(new URLSearchParams("t=-9000"));
    expect(invalid.invalidFields).toEqual(["t"]);
    expect(invalid.timeKyr).toBeNull();
    expect(invalid.parameters).toEqual(PRESENT_PARAMETERS);
  });
});
