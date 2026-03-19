"use client";
import React, { useRef, useEffect, useState } from "react";
import { normalizeTemperature } from "@/lib/temperatureUtils";

function TemperatureIcon({ temperature }) {
  // Abstract SVG icons that match the observatory aesthetic
  if (temperature < 0) {
    // Glacial — crystalline star
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (temperature < 5) {
    // Cold — simple snowflake
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (temperature < 10) {
    // Cool — half circle
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-pale-gold opacity-60">
        <path d="M12 4a8 8 0 0 1 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4a8 8 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (temperature < 15) {
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
  // Normalize between roughly -5C and 20C range
  const norm = normalizeTemperature(temperature, -5, 20);
  const clampedNorm = Math.max(0, Math.min(1, norm));
  const percentage = clampedNorm * 100;

  // Track delta changes
  const prevTemp = useRef(temperature);
  const [delta, setDelta] = useState(null);
  const deltaTimeout = useRef(null);

  useEffect(() => {
    const diff = temperature - prevTemp.current;
    if (Math.abs(diff) > 0.05) {
      setDelta(diff);
      clearTimeout(deltaTimeout.current);
      deltaTimeout.current = setTimeout(() => setDelta(null), 1500);
    }
    prevTemp.current = temperature;
    return () => clearTimeout(deltaTimeout.current);
  }, [temperature]);

  const getLabel = () => {
    if (temperature < 0) return "Glacial";
    if (temperature < 5) return "Cold";
    if (temperature < 10) return "Cool";
    if (temperature < 15) return "Moderate";
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
          {delta !== null && (
            <span
              className={`text-sm font-mono font-medium transition-opacity duration-300 ${
                delta > 0 ? "text-temp-warm" : "text-temp-cold"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}°C
            </span>
          )}
        </div>
        <span className="text-sm text-stardust-white opacity-60">{getLabel()}</span>
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
          className="absolute top-0 h-full w-1.5 bg-stardust-white rounded-full transition-all duration-300"
          style={{
            left: `${percentage}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px hsla(220, 100%, 97%, 0.6)",
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-stardust-white opacity-30">
        <span>Cold</span>
        <span>Warm</span>
      </div>
    </div>
  );
}
