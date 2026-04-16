import { calculateDailyInsolation } from "./temperatureUtils";

export const TODAY_ECC = 0.0167;
export const TODAY_TILT = 23.44;
export const TODAY_PREC = 0;

export function describeEccentricity(e) {
  let headline;
  if (e < 0.012) headline = "Nearly circular orbit";
  else if (e < 0.022) headline = "Slightly stretched";
  else if (e < 0.035) headline = "Clearly elongated";
  else headline = "Strongly elongated";

  const pctCloser = Math.round((200 * e) / (1 - e * e));
  const effect = `Sun is about ${pctCloser}% closer in January than in July.`;

  return {
    headline,
    intuition: "Orbit shape — how much closer vs. farther Earth swings from the Sun.",
    effect,
  };
}

export function describeTilt(t) {
  let headline;
  if (t < 22.6) headline = "Mild seasons";
  else if (t < 23.2) headline = "Softer seasons";
  else if (t < 23.7) headline = "Today's seasons";
  else if (t < 24.2) headline = "Intense seasons";
  else headline = "Extreme seasons";

  const summer = calculateDailyInsolation(65, 0.5, TODAY_ECC, t, TODAY_PREC);
  const baseline = calculateDailyInsolation(65, 0.5, TODAY_ECC, TODAY_TILT, TODAY_PREC);
  const pct =
    baseline > 0 ? Math.round(((summer - baseline) / baseline) * 100) : 0;
  const sign = pct > 0 ? "+" : "";
  const effect = `Summer sun at 65°N: ${Math.round(summer)} W/m² (${sign}${pct}% vs. today).`;

  return {
    headline,
    intuition: "Axis tilt — the gap between summer and winter.",
    effect,
  };
}

export function describePrecession(p) {
  const norm = ((p % 360) + 360) % 360;
  let headline, effect;

  if (norm < 45 || norm >= 315) {
    headline = "Today's alignment";
    effect = "N. hemisphere winter near closest Sun — mild winters, cooler summers.";
  } else if (norm < 135) {
    headline = "Autumn at perihelion";
    effect = "N. autumn near closest Sun — seasons shifting.";
  } else if (norm < 225) {
    headline = "Summer at perihelion";
    effect = "N. summer near closest Sun — hotter summers, harsher winters.";
  } else {
    headline = "Spring at perihelion";
    effect = "N. spring near closest Sun — seasons shifting.";
  }

  return {
    headline,
    intuition: "When summer lines up with closest approach to the Sun.",
    effect,
  };
}

export function formatEccentricity(e) {
  return e.toFixed(3);
}
export function formatTilt(t) {
  return `${t.toFixed(1)}°`;
}
export function formatPrecession(p) {
  return `${Math.round(p)}°`;
}
