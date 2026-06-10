"use client";
import React from "react";
import { normalizeTemperature } from "@/lib/temperatureUtils";
import { getTodayTemperature } from "@/lib/todayClimate";

function TemperatureIcon({ temperature }) {
  // Abstract SVG icons that match the observatory aesthetic.
  // Thresholds match the playground TemperaturePod (65°N annual mean,
  // today ≈ -8°C, achievable range roughly -15..+10°C).
  if (temperature < -10) {
    // Glacial — crystalline star
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (temperature < -5) {
    // Cold — simple snowflake
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (temperature < 0) {
    // Cool — half circle
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pale-gold opacity-60">
        <path d="M12 4a8 8 0 0 1 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4a8 8 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (temperature < 5) {
    // Moderate — circle with rays
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pale-gold">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  // Warm — full sun with rays
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-warm">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function TemperatureIndicator({ temperature }) {
  // Same normalization and labels as the playground TemperaturePod so the
  // reading means the same thing throughout the story.
  const norm = normalizeTemperature(temperature, -15, 10);
  const percentage = Math.max(0, Math.min(1, norm)) * 100;

  const todayTemp = getTodayTemperature();
  const todayPct =
    Math.max(0, Math.min(1, normalizeTemperature(todayTemp, -15, 10))) * 100;

  const delta = temperature - todayTemp;
  const showDelta = Math.abs(delta) > 0.15;

  const getLabel = () => {
    if (temperature < -10) return "Glacial";
    if (temperature < -5) return "Cold";
    if (temperature < 0) return "Cool";
    if (temperature < 5) return "Moderate";
    return "Warm";
  };

  return (
    <div className="w-full space-y-2">
      {/* Big temperature display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TemperatureIcon temperature={temperature} />
          <span className="text-2xl font-mono font-bold text-pale-gold">
            {temperature.toFixed(1)}°C
          </span>
          {showDelta && (
            <span
              className={`text-sm font-mono font-medium chip-in ${
                delta > 0 ? "text-temp-warm" : "text-temp-cold"
              }`}
            >
              {delta > 0 ? "+" : "−"}
              {Math.abs(delta).toFixed(1)}° vs today
            </span>
          )}
        </div>
        <span className="text-sm text-stardust-white opacity-80">{getLabel()}</span>
      </div>

      {/* Gradient bar — uses celestial palette */}
      <div
        className="h-2.5 rounded-full overflow-hidden relative"
        style={{
          background:
            "linear-gradient(to right, hsl(222 50% 36%), hsl(215 32% 45%), hsl(30 58% 47%), hsl(20 60% 44%), hsl(10 65% 41%))",
        }}
      >
        <div
          className="absolute top-0 h-full w-[2px] bg-pale-gold/70"
          style={{
            left: `${todayPct}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 0 4px hsla(35, 60%, 76%, 0.6)",
          }}
          title={`Today: ${todayTemp.toFixed(1)}°C`}
          aria-hidden
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
      <div className="relative flex justify-between text-xs text-stardust-white">
        <span className="opacity-60">Cold</span>
        <span
          aria-hidden="true"
          className="absolute top-0 -translate-x-1/2 text-[11px] font-mono text-pale-gold/80"
          style={{ left: `${todayPct}%` }}
        >
          today
        </span>
        <span className="opacity-60">Warm</span>
      </div>
    </div>
  );
}
