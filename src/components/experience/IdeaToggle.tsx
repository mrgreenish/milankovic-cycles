"use client";

import { fill } from "@/i18n/format";
import { useUi } from "@/i18n/LocaleProvider";
import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import { displayedTime } from "@/lib/orbital/state";
import { useExperience } from "./ExperienceProvider";

const MOMENTS = [0, -21] as const;

/** Chapter one's only control: flip between today and the last ice age. */
export function IdeaToggle() {
  const { parameters, timeKyr, setTime, ice } = useExperience();
  const ui = useUi();
  const at = displayedTime({ parameters, timeKyr });
  const reading = calculateSummerInsolation(parameters);
  const delta = Math.round(reading.deltaFromPresentWm2);
  return (
    <div className="idea-toggle">
      <div className="segmented-control" role="group" aria-label={ui.idea.group}>
        {MOMENTS.map((kyr) => (
          <button
            type="button"
            key={kyr}
            aria-pressed={at === kyr}
            onClick={() => setTime(kyr)}
          >
            {kyr === 0 ? ui.idea.today : ui.idea.ago21}
          </button>
        ))}
      </div>
      <p className="idea-toggle__live" aria-live="polite">
        {at === -21
          ? fill(delta < 0 ? ui.idea.iceAgeWeaker : ui.idea.iceAgeStronger, {
              delta: Math.abs(delta),
            })
          : ice > 0.02
            ? ui.idea.own
            : ui.idea.todayText}
      </p>
    </div>
  );
}
