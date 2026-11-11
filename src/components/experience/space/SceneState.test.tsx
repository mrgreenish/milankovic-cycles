import { render, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useFrame, type RootState } from "@react-three/fiber";
import {
  defaultTargets, MainSceneState, SceneStateProvider, useSceneFrame,
  type SceneFrame,
} from "./SceneState";

vi.mock("@react-three/fiber", () => ({ useFrame: vi.fn() }));
afterEach(cleanup);

it("keeps the climate frame identical to an unmodified clock throughout a large scrub", () => {
  const frames: Record<string, SceneFrame> = {};
  function Capture({ name }: { name: string }) {
    frames[name] = useSceneFrame();
    return null;
  }
  const targets = { current: { ...defaultTargets, focus: "timeline" as const, timeKyr: -665.4 } };
  render(<>
    <SceneStateProvider targets={targets}>
      <Capture name="climate" />
      <MainSceneState><Capture name="main" /></MainSceneState>
    </SceneStateProvider>
    <SceneStateProvider targets={targets}><Capture name="reference" /></SceneStateProvider>
  </>);
  const subscribers = vi.mocked(useFrame).mock.calls.toSorted((a, b) => (a[1] ?? 0) - (b[1] ?? 0));
  const tick = () => subscribers.forEach(([callback]) => callback({} as RootState, 1 / 60));
  tick();
  expect(frames.main.earth).not.toBe(frames.climate.earth);
  expect(frames.main.axisLocal).not.toBe(frames.climate.axisLocal);
  targets.current.timeKyr = 0;
  let tookShortRoute = false;
  for (let i = 0; i < 360; i++) {
    tick();
    // Includes the clock, spin, geometry, axis, ice, weights and easing state.
    expect(frames.climate).toEqual(frames.reference);
    if (Math.abs(frames.main.peri - frames.climate.peri) > 0.1)
      tookShortRoute = true;
  }
  expect(tookShortRoute).toBe(true);
  expect(frames.main.earth.distanceTo(frames.climate.earth)).toBeLessThan(0.001);
});

it("fades the sunlight map in and out and eases the real eccentricity", () => {
  let frame: SceneFrame | undefined;
  function Capture() {
    frame = useSceneFrame();
    return null;
  }
  vi.mocked(useFrame).mockClear();
  const targets = { current: { ...defaultTargets, focus: "tilt" as const } };
  render(<SceneStateProvider targets={targets}><Capture /></SceneStateProvider>);
  const tick = (count: number) => {
    for (let i = 0; i < count; i++)
      vi.mocked(useFrame).mock.calls.forEach(([callback]) => callback({} as RootState, 1 / 60));
  };
  tick(1);
  expect(frame!.sunMap).toBe(0);
  expect(frame!.trueE).toBeCloseTo(defaultTargets.trueEccentricity, 9);

  targets.current.sunlight = true;
  targets.current.trueEccentricity = 0.058;
  tick(3);
  // Part of the way there: neither value jumps.
  expect(frame!.sunMap).toBeGreaterThan(0.1);
  expect(frame!.sunMap).toBeLessThan(0.6);
  expect(frame!.trueE).toBeGreaterThan(defaultTargets.trueEccentricity);
  expect(frame!.trueE).toBeLessThan(0.058);
  tick(60);
  expect(frame!.sunMap).toBeGreaterThan(0.99);
  expect(frame!.trueE).toBeCloseTo(0.058, 4);

  // Out is slower than in, so the colours linger after the hand lets go.
  targets.current.sunlight = false;
  tick(3);
  expect(frame!.sunMap).toBeGreaterThan(0.8);
  tick(120);
  expect(frame!.sunMap).toBeLessThan(0.01);
});
