import { describe, expect, it } from "vitest";
import {
  ICE_FLOOR,
  ICE_PER_WM2,
  ICE_RESPONSE_KYR,
  LGM_COOLING_C,
  averageTemperatureC,
  climateAt,
  describeClimate,
  equilibriumIce,
  formatTemperatureDelta,
  iceFromTemperature,
  temperatureFromIce,
} from "./climate";
import { PRESENT_PARAMETERS, PRESENT_SUMMER_INSOLATION_WM2 } from "./insolation";
import { TIME_START_KYR, orbitalStateAt, timelineSeries, iceRawAt } from "./timeline";

describe("temperature and ice", () => {
  it("scales ice to temperature through the last glacial maximum", () => {
    expect(temperatureFromIce(0)).toBe(0);
    expect(temperatureFromIce(1)).toBeCloseTo(-LGM_COOLING_C, 10);
    expect(iceFromTemperature(temperatureFromIce(0.37))).toBeCloseTo(0.37, 10);
  });

  it("matches the record: today is neutral, the last ice age is the coldest recent point", () => {
    expect(climateAt(0, PRESENT_PARAMETERS)).toMatchObject({ source: "record", iceShare: 0, deltaTempC: 0 });
    const peak = climateAt(-18, orbitalStateAt(-18));
    expect(peak.deltaTempC).toBeCloseTo(-6.1, 1);
    const warm = climateAt(-123, orbitalStateAt(-123));
    expect(warm.deltaTempC).toBeGreaterThan(0);
    expect(warm.deltaTempC).toBeLessThan(1);
  });

  it("uses the lasting-orbit estimate for hand-set and future orbits", () => {
    expect(climateAt(null, PRESENT_PARAMETERS).source).toBe("equilibrium");
    expect(climateAt(30, orbitalStateAt(30)).source).toBe("equilibrium");
    expect(equilibriumIce(PRESENT_PARAMETERS)).toBeCloseTo(0, 10);
  });

  it("grows ice when summers weaken and melts a little when they strengthen", () => {
    const cold = equilibriumIce({ ...PRESENT_PARAMETERS, obliquityDeg: 22 });
    const warm = equilibriumIce({ ...PRESENT_PARAMETERS, obliquityDeg: 24.6 });
    expect(cold).toBeGreaterThan(0.2);
    expect(warm).toBeLessThan(0);
    expect(warm).toBeGreaterThan(ICE_FLOOR);
    // Never past the ice-age peak, never below the warm floor.
    const extreme = equilibriumIce({ eccentricity: 0.058, obliquityDeg: 22, earthPerihelionLongitudeDeg: 90 });
    expect(extreme).toBeLessThanOrEqual(1);
    expect(equilibriumIce({ eccentricity: 0.058, obliquityDeg: 24.6, earthPerihelionLongitudeDeg: 270 })).toBeGreaterThan(ICE_FLOOR - 1e-9);
  });

  it("keeps the fitted slope honest against the data it came from", () => {
    // Re-run the fit: ice share against 65°N sunlight smoothed over the response time.
    const series = timelineSeries();
    const decay = 1 - Math.exp(-1 / ICE_RESPONSE_KYR);
    const anomaly: number[] = [];
    const ice: number[] = [];
    let smoothed = series.insolation[0] - PRESENT_SUMMER_INSOLATION_WM2;
    for (let kyr = TIME_START_KYR; kyr <= 0; kyr += 1) {
      smoothed += (series.insolation[kyr - TIME_START_KYR] - PRESENT_SUMMER_INSOLATION_WM2 - smoothed) * decay;
      if (kyr - TIME_START_KYR >= 100) {
        anomaly.push(smoothed);
        ice.push(iceRawAt(kyr)!);
      }
    }
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const ma = mean(anomaly);
    const mi = mean(ice);
    let sai = 0, saa = 0, sii = 0;
    for (let i = 0; i < anomaly.length; i++) {
      sai += (anomaly[i] - ma) * (ice[i] - mi);
      saa += (anomaly[i] - ma) ** 2;
      sii += (ice[i] - mi) ** 2;
    }
    expect(-sai / saa).toBeCloseTo(ICE_PER_WM2, 2);
    expect(sai / Math.sqrt(saa * sii)).toBeLessThan(-0.4);
  });
});

describe("climate wording", () => {
  it("formats temperatures with a true minus sign", () => {
    expect(formatTemperatureDelta(-3.14)).toBe("−3.1 °C");
    expect(formatTemperatureDelta(0.449)).toBe("+0.4 °C");
    expect(formatTemperatureDelta(0.01)).toBe("0.0 °C");
    expect(averageTemperatureC(-6.1)).toBe(8);
    expect(averageTemperatureC(0)).toBe(14);
  });

  it("says where the numbers come from", () => {
    expect(describeClimate(climateAt(-21, orbitalStateAt(-21)), -21)).toMatch(/^Measured in sea-floor sediment: ice sheets at \d+% of their ice-age peak/);
    expect(describeClimate(climateAt(null, { ...PRESENT_PARAMETERS, obliquityDeg: 22 }), null)).toMatch(/^If this orbit lasted about 15,000 years: ice sheets would grow/);
    expect(describeClimate(climateAt(null, PRESENT_PARAMETERS), null)).toContain("about as warm as before industry");
    expect(describeClimate(climateAt(30, orbitalStateAt(30)), 30)).toContain("no record exists yet");
  });
});
