import { describe, expect, it } from "vitest";
import { ORBITAL_CONTROLS } from "./controls";
import { degreesToRadians } from "./geometry";
import {
  PRESENT_PARAMETERS,
  calculateDailyMeanInsolation,
  calculateSummerInsolation,
} from "./insolation";
import {
  SUNLIGHT_GAUGE_MAX_WM2,
  SUNLIGHT_GAUGE_MIN_WM2,
  SUNLIGHT_GRADIENT_CSS,
  SUNLIGHT_MAP_MAX_WM2,
  SUNLIGHT_RAMP_GLSL,
  SUNLIGHT_STOPS,
  dailySunlightWm2,
  sunlightColor,
  sunlightLegendPosition,
} from "./sunlightMap";
import type { OrbitalParameters } from "./types";

const sin = (degrees: number) => Math.sin(degreesToRadians(degrees));
const hex = (color: number[]) =>
  `#${color.map((value) => Math.round(value * 255).toString(16).padStart(2, "0")).join("")}`;

/** The map's value for a latitude and day, from the same inputs the scene gives the shader. */
function mapValue(parameters: OrbitalParameters, latitudeDeg: number, solarLongitudeDeg: number) {
  const reference = calculateDailyMeanInsolation(parameters, latitudeDeg, solarLongitudeDeg);
  const sinDeclination = sin(parameters.obliquityDeg) * sin(solarLongitudeDeg);
  return {
    map: dailySunlightWm2(sin(latitudeDeg), sinDeclination, reference.earthSunDistanceAu),
    reference: reference.dailyMeanTopOfAtmosphereWm2,
  };
}

describe("sunlight map", () => {
  it("matches the site's sunlight calculation at every latitude and season", () => {
    const orbits: OrbitalParameters[] = [
      PRESENT_PARAMETERS,
      { eccentricity: 0, obliquityDeg: 22, earthPerihelionLongitudeDeg: 0 },
      { eccentricity: 0.058, obliquityDeg: 24.6, earthPerihelionLongitudeDeg: 270 },
    ];
    for (const orbit of orbits)
      for (let latitude = -90; latitude <= 90; latitude += 5)
        for (let longitude = 0; longitude < 360; longitude += 15) {
          const { map, reference } = mapValue(orbit, latitude, longitude);
          expect(map).toBeCloseTo(reference, 6);
        }
  });

  it("gives 65°N at midsummer the number on the readout", () => {
    const { map } = mapValue(PRESENT_PARAMETERS, 65, 90);
    expect(map).toBeCloseTo(
      calculateSummerInsolation(PRESENT_PARAMETERS).dailyMeanTopOfAtmosphereWm2,
      6,
    );
  });

  it("shows the midsummer pole getting more sunlight than the equator", () => {
    expect(Math.round(mapValue(PRESENT_PARAMETERS, 90, 90).map)).toBe(524);
    expect(Math.round(mapValue(PRESENT_PARAMETERS, 0, 90).map)).toBe(385);
    // And polar night at the other end.
    expect(mapValue(PRESENT_PARAMETERS, -80, 90).map).toBe(0);
  });

  it("has room on its scale for the brightest day the controls can make", () => {
    const { eccentricity, obliquityDeg } = ORBITAL_CONTROLS;
    const brightest = mapValue(
      // Midsummer at the closest point of the most stretched, most tilted orbit.
      { eccentricity: eccentricity.max, obliquityDeg: obliquityDeg.max, earthPerihelionLongitudeDeg: 270 },
      90,
      90,
    ).map;
    expect(brightest).toBeGreaterThan(SUNLIGHT_MAP_MAX_WM2 - 10);
    expect(brightest).toBeLessThanOrEqual(SUNLIGHT_MAP_MAX_WM2);
  });

  it("uses the gauge's colours between the gauge's ends", () => {
    expect(hex(sunlightColor(SUNLIGHT_GAUGE_MIN_WM2))).toBe("#85c7f2");
    expect(hex(sunlightColor((SUNLIGHT_GAUGE_MIN_WM2 + SUNLIGHT_GAUGE_MAX_WM2) / 2))).toBe("#d8b56a");
    expect(hex(sunlightColor(SUNLIGHT_GAUGE_MAX_WM2))).toBe("#f08a4b");
    expect(hex(sunlightColor(-5))).toBe(SUNLIGHT_STOPS[0].color);
    expect(hex(sunlightColor(900))).toBe(SUNLIGHT_STOPS.at(-1)!.color);
  });

  it("builds the legend and the shader from the same ascending stops", () => {
    SUNLIGHT_STOPS.slice(1).forEach((stop, index) =>
      expect(stop.wm2).toBeGreaterThan(SUNLIGHT_STOPS[index].wm2),
    );
    for (const { color } of SUNLIGHT_STOPS) expect(SUNLIGHT_GRADIENT_CSS).toContain(color);
    expect(SUNLIGHT_GRADIENT_CSS).toContain("#85c7f2 66.41%");
    expect(SUNLIGHT_RAMP_GLSL.match(/mix\(/g)).toHaveLength(SUNLIGHT_STOPS.length - 1);
    expect(SUNLIGHT_RAMP_GLSL).toContain("(wm2 - 425.0) / 66.5");
    expect(sunlightLegendPosition(320)).toBe(50);
    expect(sunlightLegendPosition(9999)).toBe(100);
  });
});
