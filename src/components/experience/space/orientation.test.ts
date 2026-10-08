import { describe, expect, it } from "vitest";
import { Quaternion, Vector3 } from "three";
import { bodyOrientation } from "./orientation";

const UP = new Vector3(0, 1, 0);
const axisAt = (tiltDeg: number, periDeg: number) => {
  const tilt = (tiltDeg * Math.PI) / 180;
  const peri = (periDeg * Math.PI) / 180;
  return new Vector3(
    Math.sin(tilt) * Math.sin(peri),
    Math.cos(tilt),
    -Math.sin(tilt) * Math.cos(peri),
  );
};
const wrapPi = (a: number) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

/** The orientation Earth ends up with on screen, after the scene's yaw. */
const onScreen = (tiltDeg: number, periDeg: number, locked: boolean) => {
  const axis = axisAt(tiltDeg, periDeg);
  const yaw = locked ? wrapPi(((periDeg - 270) * Math.PI) / 180) : 0;
  const body = bodyOrientation(axis, yaw, new Quaternion());
  return new Quaternion().setFromAxisAngle(UP, yaw).multiply(body);
};

describe("Earth's orientation", () => {
  it("is the shortest turn onto the axis when the scene is not turned", () => {
    const axis = axisAt(23.44, 102.9);
    const plain = new Quaternion().setFromUnitVectors(UP, axis);
    expect(bodyOrientation(axis, 0, new Quaternion()).angleTo(plain)).toBeLessThan(1e-9);
  });

  it("stays put on screen as precession turns while the timeline holds Earth in place", () => {
    const reference = onScreen(23.44, 0, true);
    for (let peri = 15; peri < 360; peri += 15) {
      expect(onScreen(23.44, peri, true).angleTo(reference)).toBeLessThan(1e-9);
    }
  });

  it("changes only by the change in tilt while locked", () => {
    const step = onScreen(24.44, 120, true).angleTo(onScreen(23.44, 120, true));
    expect(step).toBeCloseTo((1 * Math.PI) / 180, 6);
  });

  it("would roll a full turn per precession cycle without the correction", () => {
    const rolled = (peri: number) => {
      const axis = axisAt(23.44, peri);
      const yaw = wrapPi(((peri - 270) * Math.PI) / 180);
      return new Quaternion()
        .setFromAxisAngle(UP, yaw)
        .multiply(new Quaternion().setFromUnitVectors(UP, axis));
    };
    expect(rolled(180).angleTo(rolled(0))).toBeGreaterThan(1);
  });
});
