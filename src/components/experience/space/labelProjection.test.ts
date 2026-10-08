import { describe, expect, it } from "vitest";
import { Object3D, PerspectiveCamera } from "three";
import { createLabelProjection } from "./labelProjection";

function setup() {
  const visible = { current: true };
  const calculate = createLabelProjection();
  const project = (object: Object3D, camera: PerspectiveCamera, size: { width: number; height: number }) =>
    calculate(object, camera, size, visible.current);
  const anchor = new Object3D();
  const camera = new PerspectiveCamera(90, 2, 0.1, 100);
  camera.position.z = 10;
  camera.updateMatrixWorld();
  anchor.updateMatrixWorld();
  const size = { width: 1000, height: 500 };
  return { visible, project, anchor, camera, size };
}

// Drei retains the previous tuple and only updates the DOM above this epsilon.
const moved = (before: [number, number], after: [number, number]) =>
  Math.abs(before[0] - after[0]) > 0.001 ||
  Math.abs(before[1] - after[1]) > 0.001;

describe("label projection retained by Drei Html", () => {
  it("follows successive anchor positions without changing retained tuples", () => {
    const { project, anchor, camera, size } = setup();
    const first = project(anchor, camera, size);
    expect(first).toEqual([500, 250]);
    Object.freeze(first);

    anchor.position.set(2, 1, 0);
    anchor.updateMatrixWorld();
    const second = project(anchor, camera, size);
    Object.freeze(second);
    expect(second).not.toBe(first);
    expect(moved(first, second)).toBe(true);
    expect(second[0]).toBeCloseTo(550);
    expect(second[1]).toBeCloseTo(225);

    anchor.position.x = 4;
    anchor.updateMatrixWorld();
    const third = project(anchor, camera, size);
    expect(moved(second, third)).toBe(true);
    expect(first).toEqual([500, 250]);
    expect(second[0]).toBeCloseTo(550);
    expect(third[0]).toBeCloseTo(600);
  });

  it("follows pointer-driven camera motion with a fresh position", () => {
    const { project, anchor, camera, size } = setup();
    const before = project(anchor, camera, size);
    Object.freeze(before);
    camera.position.x = 2;
    camera.updateMatrixWorld();
    const after = project(anchor, camera, size);
    expect(after).not.toBe(before);
    expect(moved(before, after)).toBe(true);
    expect(after[0]).toBeCloseTo(450);
    expect(before).toEqual([500, 250]);
  });

  it("freezes hidden labels and resumes at their current anchor when shown", () => {
    const { visible, project, anchor, camera, size } = setup();
    const before = project(anchor, camera, size);
    Object.freeze(before);
    visible.current = false;
    anchor.position.x = 4;
    anchor.updateMatrixWorld();
    expect(project(anchor, camera, size)).toBe(before);
    visible.current = true;
    const after = project(anchor, camera, size);
    expect(after).not.toBe(before);
    expect(moved(before, after)).toBe(true);
    expect(after[0]).toBeCloseTo(600);
    expect(before).toEqual([500, 250]);
  });

  it("keeps an initially hidden label still, then projects it on first reveal", () => {
    const { visible, project, anchor, camera, size } = setup();
    visible.current = false;
    const hidden = project(anchor, camera, size);
    Object.freeze(hidden);
    expect(project(anchor, camera, size)).toBe(hidden);
    visible.current = true;
    expect(project(anchor, camera, size)).toEqual([500, 250]);
    expect(hidden).toEqual([0, 0]);
  });

  it("reprojects on resize without rewriting the previous frame", () => {
    const { project, anchor, camera, size } = setup();
    const before = project(anchor, camera, size);
    Object.freeze(before);
    const after = project(anchor, camera, { width: 800, height: 400 });
    expect(moved(before, after)).toBe(true);
    expect(after).toEqual([400, 200]);
    expect(before).toEqual([500, 250]);
  });
});
