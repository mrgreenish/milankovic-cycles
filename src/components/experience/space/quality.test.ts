import { describe, expect, it } from "vitest";
import {
  animationDelta,
  assessQuality,
  initialQuality,
  refreshInterval,
  textureResolution,
  type QualityHistory,
} from "./quality";

const run = (state: QualityHistory, windows: number, frame: number, render: number, refresh?: number) => {
  for (let i = 0; i < windows; i++) state = assessQuality(state, frame, render, refresh);
  return state;
};

describe("adaptive graphics policy", () => {
  it("starts desktop devices at the full look and others one step down", () => {
    expect(initialQuality().quality).toBe("high");
    expect(initialQuality({ cores: 12, memoryGb: 16 }).quality).toBe("high");
    expect(initialQuality({ coarsePointer: true }).quality).toBe("medium");
    expect(initialQuality({ memoryGb: 2 }).quality).toBe("medium");
    expect(initialQuality({ software: true }).quality).toBe("low");
  });

  it("ignores a short slow spell and steps down one tier at a time after 6 s", () => {
    let state = run(initialQuality(), 2, 30, 4);
    expect(state.quality).toBe("high");
    state = run(state, 1, 30, 4);
    expect(state.quality).toBe("balanced");
    state = run(state, 3, 30, 4);
    expect(state.quality).toBe("medium");
    state = run(state, 3, 30, 4);
    expect(state.quality).toBe("low");
    expect(run(state, 6, 30, 4).quality).toBe("low");
  });

  it("restarts the count when a window is fine", () => {
    let state = run(initialQuality(), 2, 30, 4);
    state = assessQuality(state, 16.7, 3);
    expect(state.slowWindows).toBe(0);
    expect(run(state, 2, 30, 4).quality).toBe("high");
  });

  it("measures against the display's rhythm, not an assumed 60 Hz", () => {
    // A screen that only ever delivers 30 frames a second is not struggling.
    const capped = run(initialQuality(), 10, 33.3, 4, 33.3);
    expect(capped.quality).toBe("high");
    // The same cadence on a 60 Hz screen is.
    expect(run(initialQuality(), 3, 33.3, 4, 16.7).quality).toBe("balanced");
  });

  it("steps down on expensive rendering even when the frame rate holds", () => {
    expect(run(initialQuality(), 3, 16.7, 20).quality).toBe("balanced");
  });

  it("climbs back after 16 s of headroom, but not from balanced to high", () => {
    let state: QualityHistory = { ...initialQuality(), quality: "low" };
    state = run(state, 7, 16.7, 3);
    expect(state.quality).toBe("low");
    state = run(state, 1, 16.7, 3);
    expect(state.quality).toBe("medium");
    state = run(state, 8, 16.7, 3);
    expect(state.quality).toBe("balanced");
    expect(run(state, 20, 16.7, 3).quality).toBe("balanced");
  });

  it("stops probing upward after repeated changes", () => {
    const state: QualityHistory = {
      ...initialQuality(),
      quality: "low",
      changes: 4,
    };
    expect(run(state, 12, 16.7, 3).quality).toBe("low");
  });

  it("finds the display rhythm from early frame gaps", () => {
    expect(refreshInterval([])).toBeCloseTo(16.67, 1);
    expect(refreshInterval(Array(60).fill(16.7))).toBeCloseTo(16.7, 1);
    expect(refreshInterval(Array(60).fill(8.3))).toBeCloseTo(16.67, 1);
    expect(refreshInterval(Array(60).fill(33.4))).toBeCloseTo(33.4, 1);
    // A few hitches while loading do not inflate it.
    const gaps = [...Array(70).fill(16.7), ...Array(20).fill(90)];
    expect(refreshInterval(gaps)).toBeCloseTo(16.7, 1);
    expect(refreshInterval(Array(60).fill(500))).toBe(50);
  });

  it("picks texture sizes from the tier, never from the view", () => {
    expect(textureResolution("high", 8192, false)).toEqual({ day: 2048, detail: 2048 });
    expect(textureResolution("high", 8192, true)).toEqual({ day: 4096, detail: 2048 });
    expect(textureResolution("balanced", 8192, true).day).toBe(4096);
    expect(textureResolution("high", 2048, true).day).toBe(2048);
    expect(textureResolution("medium", 8192, true).day).toBe(2048);
    expect(textureResolution("low", 8192, true)).toEqual({ day: 1024, detail: 1024 });
    expect(textureResolution("high", 1024, true)).toEqual({ day: 1024, detail: 1024 });
  });

  it("clamps suspended-tab time without accelerating the animation", () => {
    expect(animationDelta(60)).toBe(0.05);
    expect(animationDelta(-1)).toBe(0);
    expect(animationDelta(1 / 60)).toBe(1 / 60);
  });
});
