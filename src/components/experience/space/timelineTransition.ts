import { degreesToRadians, displayEccentricity } from "@/lib/orbital/geometry";
import { orbitalStateAt } from "@/lib/orbital/timeline";
import type { SceneFrame } from "./SceneState";
import { smoothDamp } from "./smoothDamp";

/** About one precession cycle: longer moves are a transition, not a replay. */
export const LONG_SCRUB_KYR = 25;
export const SCRUB_TURN_RAD_PER_S = (120 * Math.PI) / 180;
const SMOOTH_SECONDS = 0.38;
const REJOIN_SECONDS = 0.6;
const TWO_PI = Math.PI * 2;
const wrap = (angle: number) => angle - TWO_PI * Math.round(angle / TWO_PI);
const KEYS = ["e", "tilt", "peri", "spin"] as const;
type Pose = Pick<SceneFrame, (typeof KEYS)[number]>;
type Source = Pose & Pick<SceneFrame, "ready" | "time"> & {
  targets: Pick<SceneFrame["targets"], "timeKyr" | "clockPlaying" | "focus" | "scale">;
};

export function createTimelineTransition() {
  return {
    active: false,
    // Undefined is the first frame; null is an already displayed manual orbit.
    previousTime: undefined as number | null | undefined,
    pose: { e: 0, tilt: 0, peri: 0, spin: 0 },
    velocity: { e: 0, tilt: 0, peri: 0, spin: 0 },
    rejoin: null as { elapsed: number; start: Pose; peri: number; spin: number } | null,
  };
}

/**
 * A presentation pose for the main orbital diagram only. The source clock and
 * climate globe are never mutated. Small scrubs and playback pass through.
 */
export function stepTimelineTransition(
  state: ReturnType<typeof createTimelineTransition>,
  source: Source,
  seconds: number,
): Pose | null {
  const dt = Math.min(0.05, Math.max(0, seconds));
  const { timeKyr: clock, clockPlaying, focus, scale } = source.targets;
  const scrubbing = clock !== null && focus === "timeline" && !clockPlaying;
  const jumped = scrubbing && source.ready && state.previousTime !== undefined && (
    state.previousTime === null ||
    Math.abs(clock - state.previousTime) > LONG_SCRUB_KYR ||
    Math.abs(clock - source.time) > LONG_SCRUB_KYR
  );
  state.previousTime = clock;

  if (scrubbing && state.rejoin) {
    state.rejoin = null;
    for (const key of KEYS) state.velocity[key] = 0;
  }
  if (jumped) {
    // Keep the displayed pose and velocity when a drag reverses or is retargeted.
    state.active = true;
  }
  if (!state.active) {
    for (const key of KEYS) state.pose[key] = source[key];
    return null;
  }

  const { pose, velocity } = state;
  if (!scrubbing) {
    // Play or a different view can interrupt the transition. Rejoin its moving
    // source continuously, unwrapping angles so crossing ±π cannot flip a turn.
    state.rejoin ??= {
      elapsed: 0,
      start: { ...pose },
      peri: pose.peri + wrap(source.peri - pose.peri),
      spin: pose.spin + wrap(source.spin - pose.spin),
    };
    const rejoin = state.rejoin;
    rejoin.elapsed += dt;
    rejoin.peri += wrap(source.peri - rejoin.peri);
    rejoin.spin += wrap(source.spin - rejoin.spin);
    const t = Math.min(1, rejoin.elapsed / REJOIN_SECONDS);
    const ease = t * t * (3 - 2 * t);
    for (const key of KEYS) {
      const target = key === "peri" || key === "spin" ? rejoin[key] : source[key];
      pose[key] = rejoin.start[key] + (target - rejoin.start[key]) * ease;
    }
    if (t < 1) return pose;
    state.active = false;
    state.rejoin = null;
    for (const key of KEYS) {
      pose[key] = source[key];
      velocity[key] = 0;
    }
    return null;
  }

  const destination = orbitalStateAt(clock);
  const targets: Pose = {
    e: displayEccentricity(destination.eccentricity, scale),
    tilt: degreesToRadians(destination.obliquityDeg),
    peri: pose.peri + wrap(degreesToRadians(destination.earthPerihelionLongitudeDeg) - pose.peri),
    spin: pose.spin + wrap(-pose.spin),
  };
  for (const key of KEYS) {
    [pose[key], velocity[key]] = smoothDamp(
      pose[key], targets[key], velocity[key], SMOOTH_SECONDS,
      key === "e" ? Infinity : SCRUB_TURN_RAD_PER_S, dt,
    );
  }

  // Once the original clock and spin have also settled, both poses coincide.
  // Waiting for this avoids another little spin when handing back ownership.
  const settled = Math.abs(clock - source.time) < 0.001 && KEYS.every((key) => {
    const difference = source[key] - pose[key];
    return Math.abs(key === "peri" || key === "spin" ? wrap(difference) : difference) < 1e-5;
  });
  if (settled) {
    state.active = false;
    for (const key of KEYS) velocity[key] = 0;
    return null;
  }
  return pose;
}
