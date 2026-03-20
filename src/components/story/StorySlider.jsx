"use client";
import React, { useRef, useCallback, useEffect } from "react";

export function StorySlider({
  label,
  scienceName,
  value,
  onChange,
  min,
  max,
  step,
  hint,
  minLabel,
  maxLabel,
  formatValue,
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const lastUpdate = useRef(0);
  const inputRef = useRef(null);
  const touchStart = useRef(null);

  // Non-passive touchmove listener: prevents page scroll only when dragging
  // horizontally (dx > dy). This fixes value-jumping without blocking upward
  // scroll gestures that start on the slider track.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchMove = (e) => {
      if (!touchStart.current) return;
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchStart.current.x);
      const dy = Math.abs(t.clientY - touchStart.current.y);
      if (dx > dy) e.preventDefault();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);
  const formattedValue =
    typeof value === "number"
      ? formatValue
        ? formatValue(value)
        : step < 1
          ? value.toFixed(3)
          : value.toFixed(1)
      : value;

  // Single throttled handler for both onInput and onChange.
  // In React, range input onChange maps to the native 'input' event and fires
  // continuously during drag — so we throttle to ~60fps on the only handler.
  const handleInput = useCallback(
    (e) => {
      const now = performance.now();
      if (now - lastUpdate.current > 16) {
        lastUpdate.current = now;
        onChange(parseFloat(e.target.value));
      }
    },
    [onChange]
  );

  // Commit final value on pointerUp/mouseUp to ensure we never miss the
  // last position (the throttle may have skipped it).
  const handleCommit = useCallback(
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
            {scienceName}: {formattedValue}
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
          ref={inputRef}
          onChange={handleInput}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
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
      <div className="flex justify-between gap-4 text-xs text-stardust-white opacity-50 mt-1">
        <span>{minLabel || min}</span>
        <span className="text-right">{maxLabel || max}</span>
      </div>
    </div>
  );
}
