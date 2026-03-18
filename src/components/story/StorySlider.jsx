"use client";
import React, { useRef, useCallback } from "react";

export function StorySlider({ label, scienceName, value, onChange, min, max, step, hint }) {
  const percentage = ((value - min) / (max - min)) * 100;
  const lastUpdate = useRef(0);

  // Throttle onChange to ~60fps to prevent excess re-renders
  const throttledOnChange = useCallback(
    (e) => {
      const now = performance.now();
      if (now - lastUpdate.current > 16) {
        lastUpdate.current = now;
        onChange(parseFloat(e.target.value));
      }
    },
    [onChange]
  );

  // Always fire on pointerUp for final value
  const handleChange = useCallback(
    (e) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="text-lg text-stardust-white font-medium">{label}</span>
        {scienceName && (
          <span className="text-xs font-mono text-pale-gold opacity-60">
            {scienceName}:{" "}
            {typeof value === "number"
              ? step < 1
                ? value.toFixed(3)
                : value.toFixed(1)
              : value}
          </span>
        )}
      </div>

      {hint && (
        <p className="text-sm text-pale-gold opacity-70 flex items-center gap-1">
          <span className="inline-block animate-bounce text-xs">↑</span> {hint}
        </p>
      )}

      <div
        className="celestial-slider-track"
        style={{ "--slider-pct": `${percentage}%` }}
      >
        <input
          type="range"
          value={value}
          onInput={throttledOnChange}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="celestial-slider"
          aria-label={`${label} - ${scienceName || ""}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
        />
      </div>
      <div className="flex justify-between text-xs text-stardust-white opacity-40 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
