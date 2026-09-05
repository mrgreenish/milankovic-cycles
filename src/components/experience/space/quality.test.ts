import { describe, expect, it } from "vitest";
import {
  animationDelta,
  assessQuality,
  initialQuality,
  textureResolution,
} from "./quality";

describe("adaptive graphics policy", () => {
  it("ignores a single slow sample and downgrades sustained pressure", () => {
    let state = assessQuality(initialQuality(), 30, 4);
    expect(state.quality).toBe("medium");
    state = assessQuality(state, 30, 4);
    expect(state.quality).toBe("low");
  });

  it("requires twelve seconds of headroom to upgrade and resets on a slow window", () => {
    let state = initialQuality();
    for (let i = 0; i < 5; i++) state = assessQuality(state, 16.7, 3);
    expect(state.quality).toBe("medium");
    state = assessQuality(state, 21, 12);
    expect(state.fastWindows).toBe(0);
    for (let i = 0; i < 6; i++) state = assessQuality(state, 16.7, 3);
    expect(state.quality).toBe("high");
  });

  it("responds to expensive rendering even when RAF cadence is fast", () => {
    let state = { ...initialQuality(), quality: "high" as const };
    const one = assessQuality(state, 16.7, 23);
    expect(assessQuality(one, 16.7, 23).quality).toBe("medium");
    state = { ...state, changes: 4 };
    expect(
      assessQuality({ ...state, quality: "low", fastWindows: 5 }, 16.7, 4)
        .quality,
    ).toBe("low");
  });

  it("only requests 4K in a capable high-quality close-up", () => {
    expect(textureResolution("high", true, 4096)).toEqual({
      day: 4096,
      detail: 2048,
    });
    expect(textureResolution("high", false, 4096).day).toBe(2048);
    expect(textureResolution("high", true, 2048).day).toBe(2048);
    expect(textureResolution("low", true, 4096)).toEqual({
      day: 1024,
      detail: 1024,
    });
  });

  it("clamps suspended-tab time without accelerating the animation", () => {
    expect(animationDelta(60)).toBe(0.05);
    expect(animationDelta(-1)).toBe(0);
    expect(animationDelta(1 / 60)).toBe(1 / 60);
  });
});
