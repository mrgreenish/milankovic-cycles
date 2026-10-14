import type { ParameterKey } from "@/lib/orbital/controls";
import type { OrbitalVisualFocus } from "@/lib/orbital/types";
import type { Ui } from "@/i18n/ui";
import type { StageDrag } from "./Stage";

/** What dragging across the stage changes in each view. */
export function stageDragFor(
  focus: OrbitalVisualFocus,
  ui: Pick<Ui, "stage">,
  actions: {
    nudgeParameter: (key: ParameterKey, delta: number) => void;
    nudgeTime: (delta: number) => void;
  },
): StageDrag {
  switch (focus) {
    case "shape":
      return {
        hint: ui.stage.dragShape,
        onDelta: (f) => actions.nudgeParameter("eccentricity", f * 0.12),
      };
    case "tilt":
      return {
        hint: ui.stage.dragTilt,
        onDelta: (f) => actions.nudgeParameter("obliquityDeg", f * 5),
      };
    case "direction":
      return {
        hint: ui.stage.dragDirection,
        onDelta: (f) =>
          actions.nudgeParameter("earthPerihelionLongitudeDeg", f * 720),
      };
    case "timeline":
      return {
        hint: ui.stage.dragTime,
        onDelta: (f) => actions.nudgeTime(f * 600),
      };
    default:
      return null;
  }
}
