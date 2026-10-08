import { describe, expect, it } from "vitest";
import { degreesToRadians, displayEccentricity } from "@/lib/orbital/geometry";
import { orbitalStateAt } from "@/lib/orbital/timeline";
import {
  createTimelineTransition, stepTimelineTransition, SCRUB_TURN_RAD_PER_S,
} from "./timelineTransition";

const TAU = Math.PI * 2;
const wrap = (angle: number) => angle - TAU * Math.round(angle / TAU);
function sourceAt(time: number) {
  const at = orbitalStateAt(time);
  return {
    ready: true, time,
    e: displayEccentricity(at.eccentricity, "5x"),
    tilt: degreesToRadians(at.obliquityDeg),
    peri: degreesToRadians(at.earthPerihelionLongitudeDeg),
    spin: 0,
    targets: { timeKyr: time as number | null, clockPlaying: false, focus: "timeline" as const, scale: "5x" as const },
  };
}

describe("large timeline scrubs in the main diagram", () => {
  it("passes through initial deep links, small scrubs and ordinary playback unchanged", () => {
    const state = createTimelineTransition();
    for (const time of [-665.4, -664, -663, -662])
      expect(stepTimelineTransition(state, sourceAt(time), 1 / 60)).toBeNull();
    for (let time = -660; time < -600; time += 14 / 60) {
      const source = sourceAt(time);
      source.targets.clockPlaying = true;
      expect(stepTimelineTransition(state, source, 1 / 60)).toBeNull();
    }
  });

  it.each([1 / 30, 1 / 60, 1 / 144])("takes the short route with a bounded turn at dt=%s", (dt) => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    source.spin = 1.4;
    stepTimelineTransition(state, source, dt);
    source.targets.timeKyr = 0;
    const expected = sourceAt(0);
    const before = structuredClone(source);
    const start = { ...state.pose };
    let turn = 0;
    for (let elapsed = 0; elapsed < 5; elapsed += dt) {
      const previous = { ...state.pose };
      const pose = stepTimelineTransition(state, source, dt)!;
      const step = Math.abs(wrap(pose.peri - previous.peri));
      expect(step / dt).toBeLessThanOrEqual(SCRUB_TURN_RAD_PER_S * 1.001);
      turn += step;
    }
    expect(turn).toBeLessThanOrEqual(Math.PI);
    expect(turn).toBeCloseTo(Math.abs(wrap(expected.peri - start.peri)), 4);
    expect(state.pose.e).toBeCloseTo(expected.e, 5);
    expect(state.pose.tilt).toBeCloseTo(expected.tilt, 5);
    expect(wrap(state.pose.peri - expected.peri)).toBeCloseTo(0, 5);
    expect(wrap(state.pose.spin)).toBeCloseTo(0, 5);
    // This same source drives the top globe, which must retain its original motion.
    expect(source).toEqual(before);
  });

  it("crosses the angle wrap without taking an extra lap", () => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    source.peri = sourceAt(0).peri - TAU + 0.04;
    stepTimelineTransition(state, source, 1 / 60);
    source.targets.timeKyr = 0;
    const start = state.pose.peri;
    for (let i = 0; i < 240; i++) stepTimelineTransition(state, source, 1 / 60);
    expect(state.pose.peri - start).toBeCloseTo(-0.04, 5);
  });

  it("stays continuous when a wide drag reverses repeatedly", () => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    stepTimelineTransition(state, source, 1 / 60);
    for (let i = 0; i < 240; i++) {
      source.targets.timeKyr = i % 40 < 20 ? 40 : -790;
      const previous = state.pose.peri;
      const pose = stepTimelineTransition(state, source, 1 / 60)!;
      expect(Math.abs(wrap(pose.peri - previous)) * 60).toBeLessThanOrEqual(SCRUB_TURN_RAD_PER_S * 1.001);
    }
  });

  it("also catches a fast continuous drag made of small pointer steps", () => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    stepTimelineTransition(state, source, 1 / 60);
    for (let i = 1; i <= 6; i++) {
      source.targets.timeKyr = -665.4 + i * 5;
      stepTimelineTransition(state, source, 1 / 60);
    }
    expect(state.active).toBe(true);
  });

  it("returns to the exact source pose once both views settle", () => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    stepTimelineTransition(state, source, 1 / 60);
    source.targets.timeKyr = 0;
    stepTimelineTransition(state, source, 1 / 60);
    let result;
    for (let i = 0; i < 480; i++) result = stepTimelineTransition(state, sourceAt(0), 1 / 60);
    expect(result).toBeNull();
    expect(state.active).toBe(false);
  });

  it("smoothly hands back to Play instead of keeping playback speed-capped", () => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    stepTimelineTransition(state, source, 1 / 60);
    source.targets.timeKyr = 0;
    for (let i = 0; i < 20; i++) stepTimelineTransition(state, source, 1 / 60);
    for (let i = 0; i < 60; i++) {
      const playing = sourceAt(-30 + (i * 14) / 60);
      playing.targets.clockPlaying = true;
      const previous = state.pose.peri;
      stepTimelineTransition(state, playing, 1 / 60);
      expect(Math.abs(wrap(state.pose.peri - previous))).toBeLessThan(0.35);
    }
    expect(state.active).toBe(false);
  });

  it("can pause a handoff and start a fresh one without reviving its old pose", () => {
    const state = createTimelineTransition();
    const source = sourceAt(-665.4);
    stepTimelineTransition(state, source, 1 / 60);
    source.targets.timeKyr = 0;
    for (let i = 0; i < 15; i++) stepTimelineTransition(state, source, 1 / 60);
    source.targets.clockPlaying = true;
    for (let i = 0; i < 10; i++) stepTimelineTransition(state, source, 1 / 60);
    expect(state.rejoin).not.toBeNull();
    source.targets.clockPlaying = false;
    const previous = state.pose.peri;
    stepTimelineTransition(state, source, 1 / 60);
    expect(state.rejoin).toBeNull();
    expect(Math.abs(wrap(state.pose.peri - previous))).toBeLessThan(0.04);
    source.targets.clockPlaying = true;
    for (let i = 0; i < 40; i++) stepTimelineTransition(state, source, 1 / 60);
    expect(state.active).toBe(false);
  });
});
