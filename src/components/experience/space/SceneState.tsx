"use client";

import { createContext, useContext, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import {
  degreesToRadians,
  displayEccentricity,
  orbitRadius,
  trueAnomalyFromMean,
} from "@/lib/orbital/geometry";
import { iceRawAt, orbitalStateAt } from "@/lib/orbital/timeline";
import type { OrbitScale, OrbitalVisualFocus } from "@/lib/orbital/types";
import { smoothDamp } from "./smoothDamp";
import { stepSpin } from "./spin";
import {
  animationTime,
  useAmbientTime,
  useSceneActivity,
  wakeScene,
} from "./SceneRuntime";

export const SEMI_MAJOR_AXIS = 5.5;
export const FOCUSES: readonly OrbitalVisualFocus[] = [
  "hero",
  "idea",
  "shape",
  "tilt",
  "direction",
  "timeline",
  "combined",
];

// Earth is drawn larger than life; each view picks the size that reads best.
const EARTH_RADIUS: Record<OrbitalVisualFocus, number> = {
  hero: 1.1,
  idea: 0.95,
  shape: 0.55,
  tilt: 0.66,
  direction: 0.6,
  timeline: 0.72,
  combined: 0.5,
};

/** Laps per second of the shape view's travelling Earth, in radians. */
const TRAVEL_RATE = 0.3;
/**
 * The scene's own clock chases the time it is given along a smoothed spring.
 * Precession turns about 17° per thousand years but anywhere from 5° to 40°, so
 * the speed limit follows the turn rate: the axis never swings more than about
 * 25° between frames, which the eye reads as rushing time and not as a flicker.
 */
const MAX_CLOCK_KYR_PER_S = 150;
const MAX_PRECESSION_DEG_PER_S = 1500;
const CLOCK_SMOOTH_SECONDS = 0.16;
/**
 * Once the hand stops, a clock still far from its target does not crawl the whole
 * way. It skips ahead to within this many seconds of travel and plays the rest,
 * so a long scrub settles in about a second and a half.
 */
const SETTLE_AFTER_SECONDS = 0.12;
const SETTLE_REACH_SECONDS = 1.3;

/** How fast the perihelion angle turns at a time, in degrees per thousand years. */
function precessionRate(kyr: number) {
  const ahead = orbitalStateAt(kyr + 0.5).earthPerihelionLongitudeDeg;
  const behind = orbitalStateAt(kyr - 0.5).earthPerihelionLongitudeDeg;
  return Math.abs(((ahead - behind + 540) % 360) - 180);
}
const UP = new Vector3(0, 1, 0);

export type SceneTargets = {
  focus: OrbitalVisualFocus;
  /** Eccentricity as drawn, after any exaggeration. */
  eccentricity: number;
  presentEccentricity: number;
  /** The real eccentricity, for readouts. */
  trueEccentricity: number;
  obliquityDeg: number;
  perihelionDeg: number;
  /** Land ice as a share of the ice-age peak; below zero means less than today. */
  ice: number;
  /**
   * When set, the scene steps through La2004 itself: it eases its own clock
   * toward this time and reads the orbit from it, so scrubbing stays smooth
   * however the page updates. Null follows the three orbit values above.
   */
  timeKyr: number | null;
  scale: OrbitScale;
  /** Take ice from the measured record at the clock's time instead of `ice`. */
  iceFollowsClock: boolean;
  heroProgress: number;
  /** Horizontal shift of the picture centre, as a share of the canvas width. */
  stageShift: number;
  /** Vertical shift of the picture centre, as a share of the canvas height. */
  stageShiftY: number;
  /** Easing rate; playback raises it so the picture keeps up with the clock. */
  rate: number;
  compact: boolean;
};

export type SceneFrame = {
  targets: SceneTargets;
  ready: boolean;
  e: number;
  presentE: number;
  tilt: number;
  peri: number;
  ice: number;
  /** The scene's own clock, in thousands of years from J2000, and its speed. */
  time: number;
  timeVelocity: number;
  /** The clock target seen last frame, how long it has held still, and whether it has skipped ahead since. */
  clockTarget: number;
  stillFor: number;
  skipped: boolean;
  /** Extra turn of Earth about its axis while time runs, in radians. */
  spin: number;
  /** 0 follows the orbit values, 1 follows the clock. */
  timeBlend: number;
  /** Eased copies of the orbit values, used while the clock is not in charge. */
  manual: { e: number; tilt: number; peri: number };
  weight: Record<OrbitalVisualFocus, number>;
  travel: number;
  anomaly: number;
  yaw: number;
  radius: number;
  shift: number;
  shiftY: number;
  heroProgress: number;
  earthLocal: Vector3;
  earth: Vector3;
  axisLocal: Vector3;
  axis: Vector3;
};

export const defaultTargets: SceneTargets = {
  focus: "combined",
  eccentricity: 0.0835,
  presentEccentricity: 0.0835,
  trueEccentricity: 0.0167,
  obliquityDeg: 23.44,
  perihelionDeg: 102.9,
  ice: 0,
  timeKyr: null,
  scale: "5x",
  iceFollowsClock: false,
  heroProgress: 0,
  stageShift: 0,
  stageShiftY: 0,
  rate: 7,
  compact: false,
};

/** A point on the orbit. The scene mirrors z so Earth circles counterclockwise from above. */
export function orbitPoint(radius: number, anomaly: number, out: Vector3) {
  return out.set(radius * Math.cos(anomaly), 0, -radius * Math.sin(anomaly));
}

export function axisDirection(tilt: number, peri: number, out: Vector3) {
  const lean = Math.sin(tilt);
  return out.set(lean * Math.sin(peri), Math.cos(tilt), -lean * Math.cos(peri));
}

/** Length of the drawn axis; the wobble view stretches it to show the cone. */
export function axisLength(frame: SceneFrame) {
  return frame.radius * (1.7 + 1.6 * frame.weight.direction);
}

export const wrapPi = (angle: number) =>
  angle - Math.PI * 2 * Math.round(angle / (Math.PI * 2));

function createFrame(): SceneFrame {
  return {
    targets: defaultTargets,
    ready: false,
    e: 0,
    presentE: 0,
    tilt: 0,
    peri: 0,
    ice: 0,
    time: 0,
    timeVelocity: 0,
    clockTarget: 0,
    stillFor: 0,
    skipped: false,
    spin: 0,
    timeBlend: 0,
    manual: { e: 0, tilt: 0, peri: 0 },
    weight: Object.fromEntries(FOCUSES.map((f) => [f, 0])) as Record<
      OrbitalVisualFocus,
      number
    >,
    travel: 0,
    anomaly: 0,
    yaw: 0,
    radius: 0.5,
    shift: 0,
    shiftY: 0,
    heroProgress: 0,
    earthLocal: new Vector3(),
    earth: new Vector3(),
    axisLocal: new Vector3(0, 1, 0),
    axis: new Vector3(0, 1, 0),
  };
}

/** Eases every value toward its target and returns how far they moved in total. */
function advance(frame: SceneFrame, targets: SceneTargets, delta: number, time: number) {
  const dt = Math.min(delta, 0.05);
  const ease = (rate: number) => (frame.ready ? 1 - Math.exp(-rate * dt) : 1);
  const rate = ease(targets.rate);
  const peri = (targets.perihelionDeg * Math.PI) / 180;
  const tilt = (targets.obliquityDeg * Math.PI) / 180;

  frame.targets = targets;
  let moved = 0;
  const approach = (value: number, target: number, amount: number) => {
    const step = (target - value) * amount;
    moved += Math.abs(step);
    return value + step;
  };
  const manual = frame.manual;
  manual.e = approach(manual.e, targets.eccentricity, rate);
  frame.presentE = approach(frame.presentE, targets.presentEccentricity, rate);
  manual.tilt = approach(manual.tilt, tilt, rate);
  const periStep = wrapPi(peri - manual.peri) * rate;
  moved += Math.abs(periStep);
  manual.peri += periStep;

  // With a time set, the scene runs its own clock toward it. Chasing one number
  // at a bounded speed is what keeps scrubbing smooth: the orbit sweeps through
  // every state in between, in the right direction, instead of hopping.
  const clock = targets.timeKyr;
  if (clock !== null) {
    if (frame.timeBlend < 0.01) {
      frame.time = clock;
      frame.timeVelocity = 0;
      frame.stillFor = 0;
      frame.skipped = false;
    } else {
      const limit = Math.min(
        MAX_CLOCK_KYR_PER_S,
        MAX_PRECESSION_DEG_PER_S / Math.max(4, precessionRate(frame.time)),
      );
      if (Math.abs(clock - frame.clockTarget) > 1e-6) {
        frame.stillFor = 0;
        frame.skipped = false;
      } else {
        frame.stillFor += dt;
      }
      const lag = clock - frame.time;
      const reach = limit * SETTLE_REACH_SECONDS;
      if (
        !frame.skipped &&
        frame.stillFor > SETTLE_AFTER_SECONDS &&
        Math.abs(lag) > reach
      ) {
        frame.time = clock - Math.sign(lag) * reach;
        frame.skipped = true;
      }
      const before = frame.time;
      [frame.time, frame.timeVelocity] = smoothDamp(
        frame.time,
        clock,
        frame.timeVelocity,
        CLOCK_SMOOTH_SECONDS,
        limit,
        dt,
      );
      moved += Math.abs(frame.time - before) * 0.05;
    }
    frame.clockTarget = clock;
  } else if (frame.timeVelocity !== 0) {
    // Nothing drives the clock, so its speed (and the spin it feeds) dies away.
    frame.timeVelocity =
      Math.abs(frame.timeVelocity) < 0.01
        ? 0
        : frame.timeVelocity * Math.exp(-12 * dt);
  }
  frame.spin = stepSpin(frame.spin, frame.timeVelocity, dt);
  frame.timeBlend = approach(frame.timeBlend, clock !== null ? 1 : 0, ease(5));
  if (frame.timeBlend > 0.001) {
    const at = orbitalStateAt(frame.time);
    const blend = frame.timeBlend;
    const clockE = displayEccentricity(at.eccentricity, targets.scale);
    frame.e = manual.e + (clockE - manual.e) * blend;
    frame.tilt =
      manual.tilt + (degreesToRadians(at.obliquityDeg) - manual.tilt) * blend;
    frame.peri =
      manual.peri +
      wrapPi(degreesToRadians(at.earthPerihelionLongitudeDeg) - manual.peri) *
        blend;
  } else {
    frame.e = manual.e;
    frame.tilt = manual.tilt;
    frame.peri = manual.peri;
  }

  const recorded =
    clock !== null && targets.iceFollowsClock ? iceRawAt(clock) : null;
  frame.ice = approach(
    frame.ice,
    recorded ?? targets.ice,
    ease(clock !== null ? 9 : 2.2),
  );
  frame.shift = approach(frame.shift, targets.stageShift, ease(4));
  frame.shiftY = approach(frame.shiftY, targets.stageShiftY, ease(3));
  frame.heroProgress = approach(frame.heroProgress, targets.heroProgress, ease(6));

  let total = 0;
  let radius = 0;
  for (const focus of FOCUSES) {
    frame.weight[focus] = approach(
      frame.weight[focus],
      focus === targets.focus ? 1 : 0,
      ease(3.2),
    );
    total += frame.weight[focus];
    radius += frame.weight[focus] * EARTH_RADIUS[focus];
  }
  frame.radius = radius / Math.max(total, 0.0001);
  frame.travel = approach(frame.travel, targets.focus === "shape" ? 1 : 0, ease(2.6));
  // Earth keeps circling the orbit in the shape view: that is real motion.
  if (frame.travel > 0.02) moved += 1;

  // Earth waits at northern midsummer unless the shape view sets it travelling.
  const parked = (3 * Math.PI) / 2 - frame.peri;
  const travelling = trueAnomalyFromMean(time * TRAVEL_RATE, frame.e);
  frame.anomaly = parked + wrapPi(travelling - parked) * frame.travel;
  // The timeline keeps Earth in place and swings the orbit around it.
  frame.yaw = frame.weight.timeline * wrapPi(-frame.anomaly);

  orbitPoint(orbitRadius(frame.anomaly, frame.e) * SEMI_MAJOR_AXIS, frame.anomaly, frame.earthLocal);
  frame.earth.copy(frame.earthLocal).applyAxisAngle(UP, frame.yaw);
  axisDirection(frame.tilt, frame.peri, frame.axisLocal);
  frame.axis.copy(frame.axisLocal).applyAxisAngle(UP, frame.yaw);
  frame.ready = true;
  return moved;
}

const SceneFrameContext = createContext<SceneFrame | null>(null);
export function useSceneFrame() {
  const frame = useContext(SceneFrameContext);
  if (!frame) throw new Error("useSceneFrame needs a SceneStateProvider");
  return frame;
}

export function SceneStateProvider({
  targets,
  children,
}: {
  targets: RefObject<SceneTargets>;
  children: React.ReactNode;
}) {
  const ambient = useAmbientTime();
  const activity = useSceneActivity();
  const frame = useMemo(() => createFrame(), []);
  // Runs before every other subscriber so the scene reads one consistent frame.
  useFrame((_, delta) => {
    const moved = advance(
      frame,
      targets.current,
      delta,
      animationTime(ambient.current),
    );
    // Values still settling count as motion, so the picture stays smooth until
    // they stop. Below this size the change is under a pixel.
    if (moved > 4e-4) wakeScene(activity, 350);
    window.__ORBITAL_SCENE_TEST__?.probe?.(frame);
  }, -3);
  return (
    <SceneFrameContext.Provider value={frame}>
      {children}
    </SceneFrameContext.Provider>
  );
}
