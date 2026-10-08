import { describe, expect, it } from "vitest";
import { SPIN_MAX_RAD_PER_S, stepSpin } from "./spin";

const run = (spin: number, speed: number, seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) spin = stepSpin(spin, speed, dt);
  return spin;
};

describe("Earth's spin while time runs", () => {
  it("turns in the direction time moves", () => {
    expect(stepSpin(0, 20, 1 / 60)).toBeGreaterThan(0);
    expect(stepSpin(0, -20, 1 / 60)).toBeLessThan(0);
  });

  it("never turns faster than its limit, however fast the clock goes", () => {
    for (const speed of [30, 90, 150, 5000]) {
      const step = Math.abs(stepSpin(0, speed, 1 / 60));
      expect(step * 60).toBeLessThanOrEqual(SPIN_MAX_RAD_PER_S * 1.001);
    }
  });

  it("turns gently when time moves slowly", () => {
    const perSecond = Math.abs(stepSpin(0, 10, 1 / 60)) * 60;
    expect(perSecond).toBeLessThan(SPIN_MAX_RAD_PER_S / 4);
  });

  it("comes back home once time stops, by the short way", () => {
    expect(Math.abs(run(2.4, 0, 3))).toBeLessThan(0.01);
    expect(Math.abs(run(-2.4, 0, 3))).toBeLessThan(0.01);
    // 6 rad is a quarter turn short of a full one: home is just ahead, not 6 rad back.
    expect(stepSpin(6, 0, 1 / 60)).toBeGreaterThan(6 - 0.1 - Math.PI * 2);
    expect(Math.abs(stepSpin(6, 0, 1 / 60))).toBeLessThan(0.4);
  });

  it("keeps turning without settling while the clock plays", () => {
    const start = 0.5;
    const after = run(start, 20, 0.5);
    expect(Math.abs(after - start)).toBeGreaterThan(0.5);
  });

  it("stays within one turn however long it spins", () => {
    for (const spin of [run(0, 150, 20), run(0, -150, 20)]) {
      expect(Math.abs(spin)).toBeLessThanOrEqual(Math.PI + 1e-9);
    }
  });
});
