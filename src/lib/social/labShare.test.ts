import { describe, expect, it } from "vitest";
import { getUi } from "@/i18n/ui";
import { climateAt, describeClimate } from "@/lib/orbital/climate";
import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import { ORBITAL_MILESTONES } from "@/lib/orbital/milestones";
import { LAB_BOUNDS, labPath, parseLabQuery } from "@/lib/orbital/query";
import {
  TIME_END_KYR,
  TIME_START_KYR,
  orbitalStateAt,
} from "@/lib/orbital/timeline";
import {
  OWN_SUNLIGHT_RANGE,
  labCard,
  labReading,
  labSetup,
  labShare,
  parseLabCard,
} from "./labShare";

const fromLink = (query: string) =>
  labShare(parseLabQuery(new URLSearchParams(query)), getUi("en"));

describe("a shared date", () => {
  it("states the date, the lab's own sunlight reading and the measured ice", () => {
    const share = fromLink("t=-21");
    const lgm = ORBITAL_MILESTONES.find((item) => item.id === "lgm21k")!;
    const sunlight = Math.round(
      lgm.expectedReading.dailyMeanTopOfAtmosphereWm2,
    );
    const climate = climateAt(-21, lgm.parameters);
    const ice = Math.round(climate.iceShare * 100);
    expect(climate.source).toBe("record");
    expect(share).toEqual({
      card: "lab-t-21",
      heading: "21,000 years ago",
      alt: `Orbital lab. 21,000 years ago: ${sunlight} W/m² at 65°N, ice at ${ice}% of its peak.`,
      // The second sentence is the one the lab itself shows for this date.
      description: `Midsummer sunlight at 65°N: ${sunlight} W/m². ${describeClimate(climate, -21)}`,
    });
  });

  it("keeps the tenth of a thousand years a link carries", () => {
    const share = fromLink("t=-21.3&scale=actual");
    expect(share!.card).toBe("lab-t-21.3");
    expect(share!.description).toContain(
      `${Math.round(calculateSummerInsolation(orbitalStateAt(-21.3)).dailyMeanTopOfAtmosphereWm2)} W/m²`,
    );
  });

  it("gives no ice ahead of today, where there is no record", () => {
    const setup = labSetup(parseLabQuery(new URLSearchParams("t=50")))!;
    expect(labReading(setup, getUi("en"))).toMatchObject({
      heading: "50,000 years from now",
      ice: null,
      orbitOnly: true,
    });
    expect(fromLink("t=50")!.description).toMatch(
      /^Midsummer sunlight at 65°N: \d+ W\/m²\. \d+ W\/m² (more|less) than today\.$/,
    );
  });

  it("is written in the page's language", () => {
    const parsed = parseLabQuery(new URLSearchParams("t=-21"));
    expect(labShare(parsed, getUi("nl"))!.heading).toBe("21.000 jaar geleden");
    expect(labShare(parsed, getUi("sr"))!.alt).toMatch(
      /^Orbitalna laboratorija\. pre 21\.000 godina: \d+ W\/m² na 65°N, led na \d+% maksimuma\.$/,
    );
  });
});

describe("a shared hand-set orbit", () => {
  it("is named as one and states its sunlight", () => {
    const parameters = {
      eccentricity: 0.05,
      obliquityDeg: 24.5,
      earthPerihelionLongitudeDeg: 270,
    };
    const reading = calculateSummerInsolation(parameters);
    const sunlight = Math.round(reading.dailyMeanTopOfAtmosphereWm2);
    expect(fromLink("e=0.05&o=24.5&p=270")).toEqual({
      card: `lab-own-${sunlight}`,
      heading: "A hand-set orbit",
      alt: `Orbital lab. A hand-set orbit: ${sunlight} W/m² at 65°N.`,
      description: `Midsummer sunlight at 65°N: ${sunlight} W/m². ${Math.round(reading.deltaFromPresentWm2)} W/m² more than today.`,
    });
    // The link the lab's own share button writes says the same.
    expect(fromLink(labPath(parameters, "5x").split("?")[1])!.card).toBe(
      `lab-own-${sunlight}`,
    );
  });

  it("shares one card between orbits with the same reading", () => {
    const a = fromLink("e=0.05&o=24.5&p=270")!;
    const b = fromLink("e=0.050001&o=24.5&p=270.01")!;
    expect(b.card).toBe(a.card);
  });
});

describe("links that keep the plain lab preview", () => {
  it.each(["", "scale=actual", "t=0", "e=bad&o=24.5&p=270", "t=-900", "o=99"])(
    "%s",
    (query) => expect(fromLink(query)).toBeNull(),
  );
});

describe("card names", () => {
  it("lead back to the setup they were made from", () => {
    for (const timeKyr of [
      TIME_START_KYR,
      -125,
      -21.3,
      -0.1,
      0.1,
      50,
      TIME_END_KYR,
    ])
      expect(parseLabCard(labCard({ kind: "time", timeKyr }))).toEqual({
        kind: "time",
        timeKyr,
      });
    for (const sunlightWm2 of [
      OWN_SUNLIGHT_RANGE.min,
      503,
      OWN_SUNLIGHT_RANGE.max,
    ])
      expect(parseLabCard(labCard({ kind: "own", sunlightWm2 }))).toEqual({
        kind: "own",
        sunlightWm2,
      });
  });

  it("are refused when no lab setup could have produced them", () => {
    for (const card of [
      "lab-t0",
      "lab-t-0",
      "lab-t-21.0",
      "lab-t-021",
      "lab-t-21.35",
      `lab-t${TIME_START_KYR - 1}`,
      `lab-t${TIME_END_KYR + 0.1}`,
      `lab-own-${OWN_SUNLIGHT_RANGE.min - 1}`,
      `lab-own-${OWN_SUNLIGHT_RANGE.max + 1}`,
      "lab-own-0503",
      "lab-own-503.5",
      "lab-own-",
      "lab-t",
      "lab",
    ])
      expect(parseLabCard(card), card).toBeNull();
  });

  it("cover every reading the lab's limits allow, and no more", () => {
    let low = Infinity;
    let high = -Infinity;
    const { eccentricity, obliquityDeg } = LAB_BOUNDS;
    for (const e of [eccentricity.min, 0.02, 0.04, eccentricity.max])
      for (const o of [obliquityDeg.min, 23.4, obliquityDeg.max])
        for (let p = 0; p < 360; p += 1) {
          const wm2 = calculateSummerInsolation({
            eccentricity: e,
            obliquityDeg: o,
            earthPerihelionLongitudeDeg: p,
          }).dailyMeanTopOfAtmosphereWm2;
          low = Math.min(low, wm2);
          high = Math.max(high, wm2);
        }
    expect(OWN_SUNLIGHT_RANGE).toEqual({
      min: Math.round(low),
      max: Math.round(high),
    });
  });
});
