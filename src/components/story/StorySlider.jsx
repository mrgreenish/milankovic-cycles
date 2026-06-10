"use client";
import React, { useRef, useCallback, useEffect, useState } from "react";

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
  todayMark,
  todayLabel = "today",
  snapToToday = false,
  ariaValueText,
  onFocus,
  onBlur,
  onPointerDown,
  onPointerUp,
  renderValue,
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const todayPct =
    typeof todayMark === "number"
      ? ((todayMark - min) / (max - min)) * 100
      : null;
  const pendingValue = useRef(null);
  const rafId = useRef(null);
  const [justSnapped, setJustSnapped] = useState(false);
  const snapTimer = useRef(null);

  useEffect(
    () => () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      clearTimeout(snapTimer.current);
    },
    []
  );

  const formattedValue =
    typeof value === "number"
      ? formatValue
        ? formatValue(value)
        : step < 1
          ? value.toFixed(3)
          : value.toFixed(1)
      : value;

  const maybeSnap = useCallback(
    (raw, { committing } = { committing: false }) => {
      if (!committing) return raw;
      if (!snapToToday || typeof todayMark !== "number") return raw;
      const range = max - min;
      if (Math.abs(raw - todayMark) / range < 0.01) return todayMark;
      return raw;
    },
    [snapToToday, todayMark, max, min]
  );

  const flush = useCallback(() => {
    rafId.current = null;
    if (pendingValue.current !== null) {
      onChange(maybeSnap(pendingValue.current, { committing: false }));
      pendingValue.current = null;
    }
  }, [onChange, maybeSnap]);

  const handleInput = useCallback(
    (e) => {
      pendingValue.current = parseFloat(e.target.value);
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(flush);
      }
    },
    [flush]
  );

  const handleCommit = useCallback(
    (e) => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      pendingValue.current = null;
      const raw = parseFloat(e.target.value);
      const snapped = maybeSnap(raw, { committing: true });
      if (snapped !== raw && snapped === todayMark) {
        if (typeof navigator !== "undefined") navigator.vibrate?.(10);
        setJustSnapped(true);
        clearTimeout(snapTimer.current);
        snapTimer.current = setTimeout(() => setJustSnapped(false), 600);
      }
      onChange(snapped);
    },
    [onChange, maybeSnap, todayMark]
  );

  const computedAriaValueText =
    ariaValueText ||
    (scienceName ? `${scienceName} ${formattedValue}` : formattedValue);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base text-stardust-white font-medium">
          {label}
        </span>
        {renderValue ? (
          renderValue(value)
        ) : scienceName ? (
          <span className="text-xs font-mono text-pale-gold opacity-80">
            {scienceName}: {formattedValue}
          </span>
        ) : null}
      </div>

      {hint && (
        <p className="text-sm text-pale-gold opacity-90">{hint}</p>
      )}

      <div
        className="celestial-slider-track relative"
        style={{ "--slider-pct": `${percentage}%` }}
      >
        {todayPct !== null && (
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none absolute top-1/2 -translate-y-1/2 w-[2px] h-[14px] bg-pale-gold/70 rounded-sm",
              justSnapped ? "snap-pulse" : "",
            ].join(" ")}
            style={{
              left: `calc(${todayPct}% - 1px)`,
              boxShadow: "0 0 6px hsla(35, 60%, 76%, 0.6)",
            }}
            title={`${todayLabel} ${
              formatValue ? formatValue(todayMark) : todayMark
            }`}
          />
        )}
        <input
          type="range"
          value={value}
          onChange={handleInput}
          onPointerUp={(e) => {
            handleCommit(e);
            onPointerUp?.(e);
          }}
          onPointerDown={onPointerDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyUp={handleCommit}
          min={min}
          max={max}
          step={step}
          className="celestial-slider"
          aria-label={`${label}${scienceName ? ` — ${scienceName}` : ""}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={computedAriaValueText}
        />
      </div>

      <div
        className={[
          "relative flex justify-between gap-4 text-xs text-stardust-white",
          todayPct !== null ? "pb-4" : "",
        ].join(" ")}
      >
        <span className="opacity-70">{minLabel || min}</span>
        {todayPct !== null && (
          <span
            aria-hidden="true"
            className="absolute -translate-x-1/2 text-[11px] font-mono text-pale-gold/80 whitespace-nowrap"
            style={{
              left: `clamp(16px, ${todayPct}%, calc(100% - 16px))`,
              top: "1.1rem",
            }}
          >
            ↑ {todayLabel}
          </span>
        )}
        <span className="text-right opacity-70">{maxLabel || max}</span>
      </div>
    </div>
  );
}
