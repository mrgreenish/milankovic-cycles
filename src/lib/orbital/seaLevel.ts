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
 * Depths from zero to this many metres fill the upper half of the surface
 * texture's blue channel. Anything deeper never falls dry and reads as full.
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
 * The surface texture's alpha channel carries today's sea and the depth of
 * the water, so the shader can move the shoreline. Packed, land is 0 and the
 * sea runs from one half (the shallowest water) to 1 (the depth range or
 * deeper). `coverage` is the share of the texel under water, 0 to 1, which
 * keeps the coast smooth. A lake keeps its water whatever the sea does, so it
 * counts as land here.
 */
export function packWater(coverage: number, depthM: number) {
  const depth = Math.min(1, Math.max(0, depthM / SHELF_DEPTH_RANGE_M));
  return coverage * (0.5 + 0.5 * depth);
}

/**
 * Alpha as stored: 1 on land, down to one half over deep sea. Land keeps full
 * alpha so the terrain detail in the colour channels survives any browser
 * that multiplies colour by alpha while decoding the fallback image.
 */
export const alphaFromPacked = (packed: number) => 1 - packed / 2;
export const packedFromAlpha = (alpha: number) => (1 - alpha) * 2;

/** What the shader reads back: today's sea coverage and the depth beside it, both 0 to 1. */
export function unpackWater(packed: number) {
  return {
    sea: Math.min(1, packed * 2),
    depth: Math.min(1, Math.max(0, packed * 2 - 1)),
  };
}

/** How much the shader blurs the new shoreline, on the depth scale. */
export const SHORE_SOFTNESS = 0.06;

/** Share of a patch of today's sea that is still under water, 0 to 1, as the shader draws it. */
export function waterLeft(depth: number, seaUniform: number) {
  if (seaUniform <= 0) return 1;
  const t = Math.min(
    1,
    Math.max(0, (depth - (seaUniform - SHORE_SOFTNESS)) / SHORE_SOFTNESS),
  );
  return t * t * (3 - 2 * t);
}
