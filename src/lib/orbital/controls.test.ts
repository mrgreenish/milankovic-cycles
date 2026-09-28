import { describe, expect, it } from "vitest";
import { ORBITAL_CONTROLS, PARAMETER_KEYS } from "./controls";
import { calculateSummerInsolation, PRESENT_PARAMETERS } from "./insolation";
import { ORBITAL_MILESTONES, matchingMilestone } from "./milestones";
import { labPath, parseLabQuery, serializeLabQuery } from "./query";

describe("quick experiments", () => {
  it.each(PARAMETER_KEYS)(
    "keeps %s experiments valid in shared URLs",
    (key) => {
      for (const experiment of ORBITAL_CONTROLS[key].experiments) {
        const parameters = { ...PRESENT_PARAMETERS, [key]: experiment.value };
        const parsed = parseLabQuery(
          new URLSearchParams(serializeLabQuery(parameters, "5x")),
        );
        expect(parsed.invalidFields).toEqual([]);
        expect(parsed.parameters[key]).toBe(experiment.value);
        expect(
          calculateSummerInsolation(parsed.parameters)
            .dailyMeanTopOfAtmosphereWm2,
        ).toBeCloseTo(
          calculateSummerInsolation(parameters).dailyMeanTopOfAtmosphereWm2,
          2,
        );
      }
    },
  );
  it("aligns northern summer with the physically closest and farthest distances", () => {
    const [near, far] =
      ORBITAL_CONTROLS.earthPerihelionLongitudeDeg.experiments.map(
        ({ value }) =>
          calculateSummerInsolation({
            ...PRESENT_PARAMETERS,
            earthPerihelionLongitudeDeg: value,
          }),
      );
    expect(near.earthSunDistanceAu).toBeCloseTo(
      1 - PRESENT_PARAMETERS.eccentricity,
      10,
    );
    expect(far.earthSunDistanceAu).toBeCloseTo(
      1 + PRESENT_PARAMETERS.eccentricity,
      10,
    );
    expect(near.dailyMeanTopOfAtmosphereWm2).toBeGreaterThan(
      far.dailyMeanTopOfAtmosphereWm2,
    );
  });
  it("increases northern summer daylight and energy when tilt increases", () => {
    const [low, high] = ORBITAL_CONTROLS.obliquityDeg.experiments.map(
      ({ value }) =>
        calculateSummerInsolation({
          ...PRESENT_PARAMETERS,
          obliquityDeg: value,
        }),
    );
    expect(high.daylightHours).toBeGreaterThan(low.daylightHours);
    expect(high.dailyMeanTopOfAtmosphereWm2).toBeGreaterThan(
      low.dailyMeanTopOfAtmosphereWm2,
    );
  });
});
describe("portable lab setups", () => {
  it.each(ORBITAL_MILESTONES)(
    "recognizes $label after URL rounding",
    (milestone) => {
      const parsed = parseLabQuery(
        new URLSearchParams(serializeLabQuery(milestone.parameters, "actual")),
      );
      expect(matchingMilestone(parsed.parameters)?.id).toBe(milestone.id);
    },
  );
  it("preserves non-default parameters and display scale in tour links", () => {
    expect(labPath(PRESENT_PARAMETERS, "5x")).toBe("/lab");
    const path = labPath(
      { ...PRESENT_PARAMETERS, obliquityDeg: 24.5 },
      "actual",
    );
    const parsed = parseLabQuery(
      new URL(path, "https://example.org").searchParams,
    );
    expect(parsed.parameters.obliquityDeg).toBe(24.5);
    expect(parsed.scale).toBe("actual");
    expect(matchingMilestone(parsed.parameters)).toBeNull();
  });
});
