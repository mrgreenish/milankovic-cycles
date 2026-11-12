/**
 * Sea level on the globe. Water locked up in ice sheets comes out of the sea,
 * so as the ice grows the coastline moves out over the shallow shelves.
 *
 * This file has no imports and only plain values and functions: the texture
 * build script (plain Node) reads it too.
 */

/**
 * How far the sea stood below today's at the peak of the last ice age: the
 * "about 120 m" the site's copy gives. Published estimates run from about
 * 120 m to about 134 m.
 */
export const LGM_SEA_LEVEL_DROP_M = 120;

/**
 * The surface texture stores depths from zero to this many metres. Water
 * deeper than this never falls dry, and the gap between it and the largest
 * fall keeps the edge of a shelf from drying where it blends into deep water.
 */
export const SHELF_DEPTH_RANGE_M = 250;

/** Metres the sea stands below today's for a share of the ice-age peak. No rise is drawn for less ice than today. */
export function seaLevelDropM(iceShare: number) {
  return LGM_SEA_LEVEL_DROP_M * Math.min(1, Math.max(0, iceShare));
}

/** The same drop on the texture's depth scale, 0 to 1: what the Earth shader compares depths with. */
export function seaLevelUniform(iceShare: number) {
  return seaLevelDropM(iceShare) / SHELF_DEPTH_RANGE_M;
}

/**
 * The surface texture's alpha channel carries how readily a place falls dry,
 * so the shader can move the shoreline. Packed, 0 is a place that never
 * does: land, and water at the depth range or deeper. Shallower sea runs up
 * to 1 at no depth at all.
 *
 * Land and deep water share a value on purpose. One channel cannot hold both
 * how much of a texel is sea and how deep it is, and the texture is blended
 * between texels and in its smaller copies. A steep coast, land beside deep
 * water, must not read as a shallow shelf anywhere in that blend, so a texel
 * counts as sea only when at least half of it is (`coverage`, 0 to 1), and
 * then with the mean depth of its water. A lake keeps its water whatever the
 * sea does, so it counts as land here.
 */
export function packWater(coverage: number, depthM: number) {
  if (coverage < 0.5) return 0;
  return 1 - Math.min(1, Math.max(0, depthM / SHELF_DEPTH_RANGE_M));
}

/**
 * Alpha as stored: 1 on land and deep water, down to one half over the
 * shallowest sea. Land keeps full alpha so the terrain detail in the colour
 * channels survives any browser that multiplies colour by alpha while
 * decoding the fallback image.
 */
export const alphaFromPacked = (packed: number) => 1 - packed / 2;
export const packedFromAlpha = (alpha: number) => (1 - alpha) * 2;

/** What the shader reads back: the depth, 0 to 1, with land as deep as the range. */
export const depthFromPacked = (packed: number) => 1 - packed;

/** How much the shader blurs the new shoreline, on the depth scale. */
export const SHORE_SOFTNESS = 0.06;

/** Share of a place that has not fallen dry, 0 to 1, as the shader draws it. Land reads as deep, so it stays 1. */
export function waterLeft(depth: number, seaUniform: number) {
  if (seaUniform <= 0) return 1;
  const t = Math.min(
    1,
    Math.max(0, (depth - (seaUniform - SHORE_SOFTNESS)) / SHORE_SOFTNESS),
  );
  return t * t * (3 - 2 * t);
}
