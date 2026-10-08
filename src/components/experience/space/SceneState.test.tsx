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
