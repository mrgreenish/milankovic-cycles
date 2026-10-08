"use client";

import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import { displayedTime } from "@/lib/orbital/state";
import { useExperience } from "./ExperienceProvider";

const MOMENTS = [
  { kyr: 0, label: "Today" },
  { kyr: -21, label: "21,000 years ago" },
] as const;

/** Chapter one's only control: flip between today and the last ice age. */
export function IdeaToggle() {
  const { parameters, timeKyr, setTime, ice } = useExperience();
  const at = displayedTime({ parameters, timeKyr });
  const reading = calculateSummerInsolation(parameters);
  const delta = Math.round(reading.deltaFromPresentWm2);
  return (
    <div className="idea-toggle">
      <div className="segmented-control" role="group" aria-label="Choose a time">
        {MOMENTS.map((moment) => (
          <button
            type="button"
            key={moment.kyr}
            aria-pressed={at === moment.kyr}
            onClick={() => setTime(moment.kyr)}
          >
            {moment.label}
          </button>
        ))}
      </div>
      <p className="idea-toggle__live" aria-live="polite">
        {at === -21
          ? `Ice sheets covered Canada and northern Europe. Midsummer sunlight at 65°N was ${Math.abs(delta)} W/m² ${delta < 0 ? "weaker" : "stronger"} than today, and had been weak for thousands of years.`
          : ice > 0.02
            ? "Your own orbit, with the ice sheets of the last visit."
            : "Ice covers Greenland and Antarctica. Northern Canada and Europe are free of it."}
      </p>
    </div>
  );
}
