import { clampParameter, type ParameterKey } from "./controls";
import { PRESENT_PARAMETERS } from "./insolation";
import { serializeLabQuery } from "./query";
import { clampTime, iceIndexAt, orbitalStateAt } from "./timeline";
import type { OrbitScale, OrbitalParameters } from "./types";

/** The orbit shown by the tour and the lab. */
export type OrbitalState = {
  parameters: OrbitalParameters;
  /** Set while the orbit follows La2004; a manual change clears it. */
  timeKyr: number | null;
  scale: OrbitScale;
  /** Ice-sheet size of the moment last visited, 0 (today) to 1 (ice age peak). */
  ice: number;
};

export type OrbitalAction =
  | { type: "parameter"; key: ParameterKey; value: number }
  | { type: "nudge"; key: ParameterKey; delta: number }
  | { type: "time"; kyr: number }
  | { type: "timeNudge"; delta: number }
  | { type: "reset" }
  | { type: "scale"; scale: OrbitScale };

export const initialOrbitalState: OrbitalState = {
  parameters: { ...PRESENT_PARAMETERS },
  timeKyr: null,
  scale: "5x",
  ice: 0,
};

/** Where the timeline playhead sits: today's orbit counts as year zero. */
export function displayedTime(
  state: Pick<OrbitalState, "parameters" | "timeKyr">,
): number | null {
  if (state.timeKyr !== null) return state.timeKyr;
  return serializeLabQuery(state.parameters, "actual") === presentKey ? 0 : null;
}

export function orbitalReducer(
  state: OrbitalState,
  action: OrbitalAction,
): OrbitalState {
  switch (action.type) {
    case "parameter":
      return {
        ...state,
        timeKyr: null,
        parameters: {
          ...state.parameters,
          [action.key]: clampParameter(action.key, action.value),
        },
      };
    case "nudge": {
      const current = state.parameters[action.key];
      // Direction wraps around the circle; the others stop at their limits.
      const next =
        action.key === "earthPerihelionLongitudeDeg"
          ? (((current + action.delta) % 360) + 360) % 360
          : current + action.delta;
      return orbitalReducer(state, { type: "parameter", key: action.key, value: next });
    }
    case "timeNudge":
      return orbitalReducer(state, {
        type: "time",
        kyr: (displayedTime(state) ?? 0) + action.delta,
      });
    case "time": {
      const timeKyr = clampTime(action.kyr);
      return {
        ...state,
        timeKyr,
        parameters: orbitalStateAt(timeKyr),
        ice: iceIndexAt(timeKyr) ?? 0,
      };
    }
    case "reset":
      return {
        ...state,
        timeKyr: null,
        ice: 0,
        parameters: { ...PRESENT_PARAMETERS },
      };
    case "scale":
      return { ...state, scale: action.scale };
  }
}

const presentKey = serializeLabQuery(PRESENT_PARAMETERS, "actual");


