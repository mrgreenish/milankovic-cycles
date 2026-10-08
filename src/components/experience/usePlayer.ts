"use client";

import { useEffect, useRef, type Dispatch } from "react";
import { ORBITAL_CONTROLS, type ParameterKey } from "@/lib/orbital/controls";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type { OrbitalAction } from "@/lib/orbital/state";
import { TIME_END_KYR, TIME_START_KYR } from "@/lib/orbital/timeline";

export type Playing =
  | { kind: "time" }
  | { kind: "cycle"; key: ParameterKey; once?: boolean }
  | null;

/** Thousands of years that pass per second of playback. */
export const TIME_SPEED_KYR_PER_S = 14;
const CYCLE_SECONDS: Record<ParameterKey, number> = {
  eccentricity: 7,
  obliquityDeg: 6,
  earthPerihelionLongitudeDeg: 8,
};
/** State updates per second; the 3D scene eases between them. */
const TICK_MS = 1000 / 30;

/**
 * Plays the clock forward through La2004, or sweeps one control through its
 * whole cycle. Each tick is a normal reducer action, so every readout, the URL
 * and the scene stay in step with it.
 */
export function usePlayer(
  playing: Playing,
  dispatch: Dispatch<OrbitalAction>,
  getTime: () => number | null,
  stop: () => void,
) {
  const getTimeRef = useRef(getTime);
  const stopRef = useRef(stop);
  useEffect(() => {
    getTimeRef.current = getTime;
    stopRef.current = stop;
  });

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    let lastTick = 0;
    let phase = 0;
    let kyr = getTimeRef.current() ?? TIME_START_KYR;
    // A finished clock replays from the start; the cycles start from today.
    if (playing.kind === "time" && kyr >= TIME_END_KYR) kyr = TIME_START_KYR;
    if (playing.kind === "time" && kyr === 0) kyr = TIME_START_KYR;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.hidden) {
        last = now;
        return;
      }
      const seconds = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (playing.kind === "time") {
        kyr += TIME_SPEED_KYR_PER_S * seconds;
        if (kyr >= TIME_END_KYR) {
          dispatch({ type: "time", kyr: TIME_END_KYR });
          stopRef.current();
          return;
        }
        if (now - lastTick >= TICK_MS) {
          lastTick = now;
          dispatch({ type: "time", kyr });
        }
        return;
      }
      phase += seconds / CYCLE_SECONDS[playing.key];
      if (playing.once && phase >= 1) {
        // One lap, then back to today's value.
        dispatch({
          type: "parameter",
          key: playing.key,
          value: PRESENT_PARAMETERS[playing.key],
        });
        stopRef.current();
        return;
      }
      if (now - lastTick < TICK_MS) return;
      lastTick = now;
      const control = ORBITAL_CONTROLS[playing.key];
      const today = PRESENT_PARAMETERS[playing.key];
      let value: number;
      if (playing.key === "earthPerihelionLongitudeDeg") {
        value = (today + phase * 360) % 360;
      } else {
        // Out to the maximum, back through the minimum, and home again.
        value =
          today +
          Math.sin(phase * Math.PI * 2) *
            (Math.sin(phase * Math.PI * 2) > 0
              ? control.max - today
              : today - control.min);
      }
      dispatch({ type: "parameter", key: playing.key, value });
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, dispatch]);
}
