import { describe, expect, it } from "vitest";
import {
  LGM_SEA_LEVEL_DROP_M,
  SHELF_DEPTH_RANGE_M,
  SHORE_SOFTNESS,
  alphaFromPacked,
  depthFromPacked,
  packWater,
  packedFromAlpha,
  seaLevelDropM,
  seaLevelUniform,
  waterLeft,
} from "./seaLevel";

/** A texel as the texture stores it: through the 8-bit alpha channel. */
const stored = (coverage: number, depthM: number) =>
  Math.round(alphaFromPacked(packWater(coverage, depthM)) * 255) / 255;

/** What the shader makes of an alpha value: the share of the place that has fallen dry. */
const dry = (alpha: number, iceShare: number) =>
  1 - waterLeft(depthFromPacked(packedFromAlpha(alpha)), seaLevelUniform(iceShare));

const exposed = (coverage: number, depthM: number, iceShare: number) =>
  dry(stored(coverage, depthM), iceShare);

describe("sea level", () => {
  it("falls with the ice, to about 120 m at the peak, and never rises above today's", () => {
    expect(seaLevelDropM(0)).toBe(0);
    expect(seaLevelDropM(0.5)).toBe(LGM_SEA_LEVEL_DROP_M / 2);
    expect(seaLevelDropM(1)).toBe(120);
    expect(seaLevelDropM(1.1)).toBe(120);
    expect(seaLevelDropM(-0.12)).toBe(0);
    expect(seaLevelUniform(1)).toBeCloseTo(120 / SHELF_DEPTH_RANGE_M, 12);
  });

  it("keeps full alpha on land and deep water and never drops below one half", () => {
    expect(alphaFromPacked(packWater(0, 0))).toBe(1);
    expect(alphaFromPacked(packWater(1, 9000))).toBe(1);
    expect(alphaFromPacked(packWater(1, 125))).toBe(0.75);
    expect(alphaFromPacked(packWater(1, 0))).toBe(0.5);
    expect(packedFromAlpha(alphaFromPacked(0.37))).toBeCloseTo(0.37, 12);
  });

  it("leaves today's globe alone", () => {
    for (const depth of [0, 10, 60, 200, 4000])
      for (const coverage of [0, 0.3, 1]) expect(exposed(coverage, depth, 0)).toBe(0);
  });

  it("dries the shelves at the peak of the ice age and keeps deep water", () => {
    // Bering Strait, about 50 m; the Dogger Bank, about 25 m.
    expect(exposed(1, 50, 1)).toBeGreaterThan(0.99);
    expect(exposed(1, 25, 1)).toBeGreaterThan(0.99);
    // Hudson Bay, about 185 m, and the open ocean stay wet.
    expect(exposed(1, 185, 1)).toBe(0);
    expect(exposed(1, 4000, 1)).toBe(0);
    // Land has no sea to lose.
    expect(exposed(0, 0, 1)).toBe(0);
  });

  it("moves the shore out step by step as the ice grows", () => {
    let last = 0;
    for (let ice = 0; ice <= 1.0001; ice += 0.05) {
      const now = exposed(1, 50, ice);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
    // A 50 m shelf is still under water at a quarter of the ice (30 m), dry at three quarters (90 m).
    expect(exposed(1, 50, 0.25)).toBe(0);
    expect(exposed(1, 50, 0.75)).toBeGreaterThan(0.99);
    // The drawn shoreline is soft over 15 m of depth.
    expect(SHORE_SOFTNESS * SHELF_DEPTH_RANGE_M).toBe(15);
  });

  it("keeps a steep coast wet: land beside deep water never reads as shelf", () => {
    // Texels that are part land, part deep water.
    for (const coverage of [0.1, 0.5, 0.9])
      for (const depth of [300, 4000]) expect(exposed(coverage, depth, 1)).toBe(0);
    // Texture filtering and the smaller copies blend neighbouring texels.
    const land = stored(0, 0);
    const deep = stored(1, 4000);
    for (let mix = 0; mix <= 1; mix += 0.125)
      expect(dry(land * (1 - mix) + deep * mix, 1)).toBe(0);
  });

  it("dries a shelf coast up to today's shore and wets it toward deep water", () => {
    const land = stored(0, 0);
    const shelf = stored(1, 20);
    const deep = stored(1, 4000);
    const blend = (from: number, to: number, mix: number) => from * (1 - mix) + to * mix;
    // Halfway between a land texel and a shelf texel is today's shore.
    expect(dry(blend(land, shelf, 0.4), 1)).toBe(0);
    expect(dry(blend(land, shelf, 0.7), 1)).toBeGreaterThan(0.99);
    // Toward deep water the shelf ends somewhere between the two texels.
    expect(dry(blend(shelf, deep, 0.25), 1)).toBeGreaterThan(0.99);
    expect(dry(blend(shelf, deep, 0.75), 1)).toBe(0);
    // A texel that is mostly land is land, however shallow its water.
    expect(exposed(0.4, 20, 1)).toBe(0);
    expect(exposed(0.6, 20, 1)).toBeGreaterThan(0.99);
  });
});
