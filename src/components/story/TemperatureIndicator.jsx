"use client";
import React from "react";
import {
  TODAY_TEMP_65N,
  describeRelativeTemperature,
} from "@/lib/temperatureUtils";

// Icons keyed to the delta vs today, matching describeRelativeTemperature
function TemperatureIcon({ delta }) {
  if (delta <= -1.5) {
    // Ice-age territory — crystalline star
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (delta < -0.5) {
    // Colder than today — simple snowflake
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (delta <= 0.5) {
    // Like today — half circle
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pale-gold opacity-60">
        <path d="M12 4a8 8 0 0 1 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4a8 8 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (delta <= 5) {
    // Warmer than today — circle with rays
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pale-gold">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // Much warmer — full sun with rays
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-warm">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Gradient spans ±5°C around today so single-slider moves are clearly visible
const RANGE = 5;

export function TemperatureIndicator({ temperature }) {
  const delta = temperature - TODAY_TEMP_65N;
  const percentage = Math.max(0, Math.min(1, (delta + RANGE) / (RANGE * 2))) * 100;
  const sign = delta > 0.05 ? "+" : delta < -0.05 ? "−" : "±";

  return (
    <div className="w-full space-y-2">
      {/* Headline: change relative to today */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TemperatureIcon delta={delta} />
          <span className="text-2xl font-mono font-bold text-pale-gold">
            {sign}
            {Math.abs(delta).toFixed(1)}°C
          </span>
          <span className="text-sm text-stardust-white opacity-60">
            vs today
          </span>
        </div>
        <span className="text-sm text-stardust-white opacity-70">
          {describeRelativeTemperature(delta)}
        </span>
      </div>

      {/* Gradient bar centered on today */}
      <div
        className="h-2.5 rounded-full overflow-hidden relative"
        style={{
          background:
            "linear-gradient(to right, hsl(222 50% 36%), hsl(215 32% 45%), hsl(30 58% 47%), hsl(20 60% 44%), hsl(10 65% 41%))",
        }}
      >
        {/* Today tick at center */}
        <div
          aria-hidden="true"
          className="absolute top-0 h-full w-[2px] bg-pale-gold/70"
          style={{ left: "50%", transform: "translateX(-50%)" }}
        />
        <div
          className="absolute top-0 h-full w-1.5 bg-stardust-white rounded-full transition-all duration-300"
          style={{
            left: `${percentage}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px hsla(220, 100%, 97%, 0.6)",
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-stardust-white opacity-60">
        <span>Colder</span>
        <span className="text-pale-gold/80">Today</span>
        <span>Warmer</span>
      </div>
    </div>
  );
}
