import { SOLAR_CONSTANT_WM2 } from "./insolation";

/**
 * The sunlight map paints the globe with the daily mean sunlight each latitude
 * receives at the top of the atmosphere, on the day Earth is at in the scene.
 * The colours, the legend and the readout's gauge all come from this file.
 */

/** Midsummer sunlight at 65°N over the last 800,000 years runs from 431 to 552 W/m². */
export const SUNLIGHT_GAUGE_MIN_WM2 = 425;
export const SUNLIGHT_GAUGE_MAX_WM2 = 558;

/**
 * Top of the colour scale. The brightest day the controls can produce is about
 * 639 W/m²: the pole at 24.6° of tilt, with midsummer at the closest point of
 * the most stretched orbit.
 */
export const SUNLIGHT_MAP_MAX_WM2 = 640;

/**
 * Between the gauge's ends the scale is the gauge itself (ice, brass, sun), so
 * the colour under the 65°N line is the colour at the gauge's marker. Below it
 * the scale falls through deep blue to the near black of polar night.
 */
export const SUNLIGHT_STOPS = [
  { wm2: 0, color: "#050914" },
  { wm2: 160, color: "#10294f" },
  { wm2: 320, color: "#2c68ad" },
  { wm2: SUNLIGHT_GAUGE_MIN_WM2, color: "#85c7f2" },
  {
    wm2: (SUNLIGHT_GAUGE_MIN_WM2 + SUNLIGHT_GAUGE_MAX_WM2) / 2,
    color: "#d8b56a",
  },
  { wm2: SUNLIGHT_GAUGE_MAX_WM2, color: "#f08a4b" },
  { wm2: SUNLIGHT_MAP_MAX_WM2, color: "#ffe2a6" },
] as const;

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

/**
 * Daily mean sunlight at the top of the atmosphere, in W/m².
 *
 * The same geometry as `calculateDailyMeanInsolation`, written from the sines
 * of latitude and of the Sun's declination and without tangents, so it stays
 * finite at the poles. The Earth shader runs this exact form for every pixel.
 */
export function dailySunlightWm2(
  sinLatitude: number,
  sinDeclination: number,
  distanceAu: number,
) {
  const cosLatitude = Math.sqrt(Math.max(0, 1 - sinLatitude * sinLatitude));
  const cosDeclination = Math.sqrt(
    Math.max(0, 1 - sinDeclination * sinDeclination),
  );
  const cosSunset = Math.min(
    1,
    Math.max(
      -1,
      (-sinLatitude * sinDeclination) /
        Math.max(cosLatitude * cosDeclination, 1e-5),
    ),
  );
  const sunset = Math.acos(cosSunset);
  const sinSunset = Math.sqrt(Math.max(0, 1 - cosSunset * cosSunset));
  return (
    (SOLAR_CONSTANT_WM2 / (Math.PI * distanceAu * distanceAu)) *
    Math.max(
      0,
      sunset * sinLatitude * sinDeclination +
        cosLatitude * cosDeclination * sinSunset,
    )
  );
}

/** The map's colour for an amount of sunlight, as sRGB from 0 to 1. */
export function sunlightColor(wm2: number): Rgb {
  let color = rgb(SUNLIGHT_STOPS[0].color);
  for (let index = 1; index < SUNLIGHT_STOPS.length; index++) {
    const from = SUNLIGHT_STOPS[index - 1].wm2;
    const to = SUNLIGHT_STOPS[index].wm2;
    const share = Math.min(1, Math.max(0, (wm2 - from) / (to - from)));
    const next = rgb(SUNLIGHT_STOPS[index].color);
    color = color.map(
      (value, channel) => value + (next[channel] - value) * share,
    ) as Rgb;
  }
  return color;
}

/** Where an amount of sunlight sits along the legend, from 0 to 100. */
export function sunlightLegendPosition(wm2: number) {
  return Math.min(100, Math.max(0, (wm2 / SUNLIGHT_MAP_MAX_WM2) * 100));
}

/** The legend's bar: the same stops, laid out left to right. */
export const SUNLIGHT_GRADIENT_CSS = `linear-gradient(90deg, ${SUNLIGHT_STOPS.map(
  ({ wm2, color }) =>
    `${color} ${sunlightLegendPosition(wm2).toFixed(2)}%`,
).join(", ")})`;

const glslNumber = (value: number) =>
  Number.isInteger(value) ? `${value}.0` : String(value);
const glslColor = (hex: string) =>
  `vec3(${rgb(hex)
    .map((value) => value.toFixed(4))
    .join(", ")})`;

/**
 * `vec3 sunlightRamp(float wm2)` for the Earth shader: the stops above, mixed
 * in display colour so the globe matches the legend.
 */
export const SUNLIGHT_RAMP_GLSL = `
  vec3 sunlightRamp(float wm2) {
    vec3 color = ${glslColor(SUNLIGHT_STOPS[0].color)};
${SUNLIGHT_STOPS.slice(1)
  .map(
    ({ wm2, color }, index) =>
      `    color = mix(color, ${glslColor(color)}, clamp((wm2 - ${glslNumber(
        SUNLIGHT_STOPS[index].wm2,
      )}) / ${glslNumber(wm2 - SUNLIGHT_STOPS[index].wm2)}, 0.0, 1.0));`,
  )
  .join("\n")}
    return color;
  }
`;
