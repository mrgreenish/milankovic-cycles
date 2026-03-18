"use client";
import React, { useRef, useEffect, useState } from "react";
import { normalizeTemperature } from "@/lib/temperatureUtils";

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
    if (temperature < 0) return { text: "Glacial", emoji: "🥶" };
    if (temperature < 5) return { text: "Cold", emoji: "❄️" };
    if (temperature < 10) return { text: "Cool", emoji: "🌥️" };
    if (temperature < 15) return { text: "Moderate", emoji: "🌤️" };
    return { text: "Warm", emoji: "☀️" };
  };

  const { text, emoji } = getLabel();

  return (
    <div className="w-full space-y-2">
      {/* Big temperature display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="text-2xl font-mono font-bold text-pale-gold">
            {temperature.toFixed(1)}°C
          </span>
          {delta !== null && (
            <span
              className={`text-sm font-mono font-medium transition-opacity duration-300 ${
                delta > 0 ? "text-red-400" : "text-blue-400"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}°C
            </span>
          )}
        </div>
        <span className="text-sm text-stardust-white opacity-60">{text}</span>
      </div>

      {/* Gradient bar */}
      <div
        className="h-3 rounded-full overflow-hidden relative"
        style={{
          background:
            "linear-gradient(to right, #2563eb, #06b6d4, #84cc16, #eab308, #ef4444)",
        }}
      >
        <div
          className="absolute top-0 h-full w-1.5 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-300"
          style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
        />
      </div>
      <div className="flex justify-between text-xs text-stardust-white opacity-30">
        <span>❄️ Cold</span>
        <span>Warm ☀️</span>
      </div>
    </div>
  );
}
