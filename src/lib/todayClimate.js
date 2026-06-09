import { calculateGlobalTemperature } from "./temperatureUtils";
import { TODAY_ECC, TODAY_TILT, TODAY_PREC } from "./parameterCopy";

// Annual-mean 65°N temperature for today's orbital configuration, computed
// with the exact same model + averaging the app uses for the live reading so
// "vs. today" deltas are always on the same scale.
let cachedTodayTemp = null;

export function getTodayTemperature() {
  if (cachedTodayTemp === null) {
    const seasons = [0, 0.25, 0.5, 0.75];
    let total = 0;
    for (const s of seasons) {
      total += calculateGlobalTemperature({
        latitude: 65,
        season: s,
        eccentricity: TODAY_ECC,
        axialTilt: TODAY_TILT,
        precession: TODAY_PREC,
        co2Level: 280,
        tempOffset: 0,
      }).temperature;
    }
    cachedTodayTemp = total / seasons.length;
  }
  return cachedTodayTemp;
}
