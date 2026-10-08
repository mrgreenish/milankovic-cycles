import { calculateSummerInsolation, PRESENT_SUMMER_INSOLATION_WM2 } from "./insolation";
import { iceRawAt } from "./timeline";
import type { OrbitalParameters } from "./types";

/**
 * A deliberately simple link between sunlight, ice and temperature. It is not a
 * climate model. Two facts carry it:
 *
 * 1. Ice and temperature move together. At the last glacial maximum the world
 *    was about 6.1 °C colder than before industry (Tierney et al., 2020), and
 *    the ice record (LR04) sets how far each moment sat between today and that
 *    peak, so temperature is `-6.1 × ice share`.
 * 2. Ice follows summer sunlight at 65°N, smoothed over about 15,000 years
 *    (ice sheets are slow). Fitted to the last 800,000 years of La2004 and
 *    LR04 this gives about 0.018 of the ice-age peak per W/m² (r ≈ −0.46).
 *    That fit stands for an orbit that stays put, which is what the lab's
 *    sliders ask about.
 */
export const LGM_COOLING_C = 6.1;
export const PREINDUSTRIAL_GLOBAL_C = 14;
/** Share of the ice-age peak per W/m² of 65°N sunlight lost, for a lasting orbit. */
export const ICE_PER_WM2 = 0.0182;
/** Smoothing time of the fit, in thousands of years. */
export const ICE_RESPONSE_KYR = 15;
/** The warmest the record gets, with a little room: ice slightly below today's. */
export const ICE_FLOOR = -0.12;

export type ClimateEstimate = {
  /** `record` is measured; `equilibrium` is the lasting-orbit estimate. */
  source: "record" | "equilibrium";
  /** Land ice as a share of the ice-age peak. Negative means less than today. */
  iceShare: number;
  /** Global mean temperature compared with before industry. */
  deltaTempC: number;
};

// `+ 0` turns a negative zero into a plain zero.
export const temperatureFromIce = (iceShare: number) => -LGM_COOLING_C * iceShare + 0;
export const iceFromTemperature = (deltaTempC: number) => -deltaTempC / LGM_COOLING_C;

/** Ice share that would settle if the orbit stayed as given for tens of thousands of years. */
export function equilibriumIce(parameters: OrbitalParameters) {
  const lost =
    PRESENT_SUMMER_INSOLATION_WM2 -
    calculateSummerInsolation(parameters).dailyMeanTopOfAtmosphereWm2;
  const share = ICE_PER_WM2 * lost;
  if (share >= 0) return Math.min(1, share);
  // Little ice is left to melt, so the warm side flattens out smoothly.
  return ICE_FLOOR * (1 - Math.exp(-share / ICE_FLOOR));
}

export function climateAt(
  timeKyr: number | null,
  parameters: OrbitalParameters,
): ClimateEstimate {
  const measured = timeKyr === null ? null : iceRawAt(timeKyr);
  const iceShare = measured ?? equilibriumIce(parameters);
  return {
    source: measured === null ? "equilibrium" : "record",
    iceShare,
    deltaTempC: temperatureFromIce(iceShare),
  };
}

/** Average global temperature in °C for display, rounded to the nearest half degree. */
export function averageTemperatureC(deltaTempC: number) {
  return Math.round((PREINDUSTRIAL_GLOBAL_C + deltaTempC) * 2) / 2;
}

export function formatTemperatureDelta(deltaTempC: number) {
  const rounded = Math.round(deltaTempC * 10) / 10;
  if (Math.abs(rounded) < 0.05) return "0.0 °C";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)} °C`;
}

/** One plain sentence on what the estimate means, matched to where it came from. */
export function describeClimate(estimate: ClimateEstimate, timeKyr: number | null) {
  const percent = Math.round(Math.max(0, estimate.iceShare) * 100);
  const delta = estimate.deltaTempC;
  const warmth =
    Math.abs(delta) < 0.15
      ? "about as warm as before industry"
      : `about ${Math.abs(delta).toFixed(1)} °C ${delta < 0 ? "colder" : "warmer"} than before industry`;
  if (estimate.source === "record") {
    const ice =
      estimate.iceShare < -0.02
        ? "slightly less ice than today"
        : percent === 0
          ? "no more ice than today"
          : `ice sheets at ${percent}% of their ice-age peak`;
    return `Measured in sea-floor sediment: ${ice}, in a world ${warmth}.`;
  }
  const ice =
    estimate.iceShare < -0.02
      ? "Some of today’s ice would melt"
      : percent === 0
        ? "Ice would stay about where it is"
        : `Ice sheets would grow to about ${percent}% of their ice-age peak`;
  const lead =
    timeKyr !== null && timeKyr > 0
      ? "Orbit only, no record exists yet. If this orbit lasted about 15,000 years: "
      : "If this orbit lasted about 15,000 years: ";
  return `${lead}${ice[0].toLowerCase()}${ice.slice(1)}, in a world ${warmth}.`;
}
