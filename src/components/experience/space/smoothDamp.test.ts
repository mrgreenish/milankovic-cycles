import { describe, expect, it } from "vitest";
import { smoothDamp } from "./smoothDamp";

function run(target: number, from = 0, maxSpeed = 150, seconds = 6) {
  let value = from;
  let velocity = 0;
  const trace: { value: number; velocity: number }[] = [];
  for (let i = 0; i < seconds * 60; i++) {
    [value, velocity] = smoothDamp(value, target, velocity, 0.18, maxSpeed, 1 / 60);
    trace.push({ value, velocity });
  }
  return trace;
}

describe("smoothDamp", () => {
  it("arrives at the target and stops", () => {
    const end = run(-125).at(-1)!;
    expect(end.value).toBeCloseTo(-125, 3);
    expect(Math.abs(end.velocity)).toBeLessThan(0.01);
  });

  it("never passes the target and never exceeds the speed limit", () => {
    const trace = run(-125);
    for (const point of trace) expect(point.value).toBeGreaterThanOrEqual(-125 - 1e-9);
    expect(Math.max(...trace.map((p) => Math.abs(p.velocity)))).toBeLessThanOrEqual(150.0001);
  });

  it("starts gently instead of jumping to full speed", () => {
    const trace = run(-300);
    // From rest it builds up over a handful of frames, not in one.
    expect(Math.abs(trace[0].velocity)).toBeLessThan(75);
    expect(Math.abs(trace[3].velocity)).toBeGreaterThan(Math.abs(trace[0].velocity));
    expect(Math.abs(trace[8].velocity)).toBeGreaterThan(Math.abs(trace[3].velocity));
  });

  it("keeps its speed continuous from frame to frame", () => {
    const trace = run(-300);
    for (let i = 1; i < trace.length; i++)
      expect(Math.abs(trace[i].velocity - trace[i - 1].velocity)).toBeLessThan(40);
  });

  it("follows a target that keeps moving without reversing", () => {
    let value = 0;
    let velocity = 0;
    let target = 0;
    let reversals = 0;
    let last = 0;
    for (let i = 0; i < 180; i++) {
      target -= 3; // a steady drag: 180 kyr/s
      [value, velocity] = smoothDamp(value, target, velocity, 0.18, 150, 1 / 60);
      const step = value - last;
      if (step > 1e-9) reversals++;
      last = value;
    }
    expect(reversals).toBe(0);
    expect(value).toBeLessThan(0);
  });
});
