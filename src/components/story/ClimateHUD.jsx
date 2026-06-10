"use client";
import React from "react";
import { TemperatureIndicator } from "./TemperatureIndicator";
import { getTodayTemperature } from "@/lib/todayClimate";

function compactLabel(t) {
  if (t < -10) return "Glacial";
  if (t < -5) return "Cold";
  if (t < 0) return "Cool";
  if (t < 5) return "Moderate";
  return "Warm";
}

/**
 * The one climate instrument of the story. Fixed in place across sections so
 * temperature reads as a continuous character rather than a per-card widget,
 * and always labeled with the 65°N context so the reading is never mistaken
 * for Earth's global average.
 */
export function ClimateHUD({ temperature, visible }) {
  const todayTemp = getTodayTemperature();
  const delta = temperature - todayTemp;

  return (
    <>
      {/* Desktop: full instrument, bottom-left */}
      <div
        className={[
          "hidden md:block fixed right-6 bottom-6 z-30 w-72 transition-all duration-500",
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none",
        ].join(" ")}
        aria-hidden={!visible}
      >
        <div className="observatory-panel p-4 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="text-[11px] font-mono uppercase tracking-wider text-antique-brass"
              title="Annual mean temperature at 65° north — the latitude that decides whether ice sheets grow or melt"
            >
              Climate at 65°N
            </span>
            <span className="text-[11px] text-stardust-white/60">
              the ice-age trigger zone
            </span>
          </div>
          <TemperatureIndicator temperature={temperature} />
          <p className="text-[11px] text-stardust-white/60 leading-snug">
            Not Earth's average (~15°C) — this tracks the far north, where ice
            ages are won and lost.
          </p>
        </div>
      </div>

      {/* Mobile: compact chip, top-left, clear of the bottom-anchored cards */}
      <div
        className={[
          "md:hidden fixed left-3 top-3 z-30 transition-all duration-500",
          visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none",
        ].join(" ")}
        aria-hidden={!visible}
      >
        <div className="observatory-panel rounded-full px-3 py-1.5 flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-antique-brass">
            65°N
          </span>
          <span className="text-sm font-mono font-bold text-pale-gold">
            {temperature.toFixed(1)}°C
          </span>
          <span className="text-[10px] text-stardust-white/70">
            {compactLabel(temperature)}
          </span>
          {Math.abs(delta) > 0.15 && (
            <span
              className={[
                "text-[10px] font-mono",
                delta > 0 ? "text-temp-warm" : "text-temp-cold",
              ].join(" ")}
            >
              {delta > 0 ? "+" : "−"}
              {Math.abs(delta).toFixed(1)}°
            </span>
          )}
        </div>
      </div>
    </>
  );
}
