import type { ParameterKey } from "@/lib/orbital/controls";
import type { OrbitalVisualFocus } from "@/lib/orbital/types";
import type { StageDrag } from "./Stage";

/** What dragging across the stage changes in each view. */
export function stageDragFor(
  focus: OrbitalVisualFocus,
  actions: {
    nudgeParameter: (key: ParameterKey, delta: number) => void;
    nudgeTime: (delta: number) => void;
  },
): StageDrag {
  switch (focus) {
    case "shape":
      return {
        hint: "Drag to stretch the orbit",
        onDelta: (f) => actions.nudgeParameter("eccentricity", f * 0.12),
      };
    case "tilt":
      return {
        hint: "Drag to lean the axis",
        onDelta: (f) => actions.nudgeParameter("obliquityDeg", f * 5),
      };
    case "direction":
      return {
        hint: "Drag to turn the axis",
        onDelta: (f) =>
          actions.nudgeParameter("earthPerihelionLongitudeDeg", f * 720),
      };
    case "timeline":
      return {
        hint: "Drag to move through time",
        onDelta: (f) => actions.nudgeTime(f * 600),
      };
    default:
      return null;
  }
}
