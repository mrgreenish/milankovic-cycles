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
  const lastUpdate = useRef(0);
  const inputRef = useRef(null);
  const touchStart = useRef(null);

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

  const maybeSnap = useCallback(
    (raw) => {
      if (!snapToToday || typeof todayMark !== "number") return raw;
      const range = max - min;
      if (Math.abs(raw - todayMark) / range < 0.01) return todayMark;
      return raw;
    },
    [snapToToday, todayMark, max, min]
  );

  const handleInput = useCallback(
    (e) => {
      const now = performance.now();
      if (now - lastUpdate.current > 16) {
        lastUpdate.current = now;
        onChange(maybeSnap(parseFloat(e.target.value)));
      }
    },
    [onChange, maybeSnap]
  );

  const handleCommit = useCallback(
    (e) => {
      onChange(maybeSnap(parseFloat(e.target.value)));
    },
    [onChange, maybeSnap]
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
          <span className="text-xs font-mono text-pale-gold opacity-60">
            {scienceName}: {formattedValue}
          </span>
        ) : null}
      </div>

      {hint && (
        <p className="text-sm text-pale-gold opacity-70 flex items-center gap-1">
          <span className="inline-block animate-bounce text-xs">↑</span> {hint}
        </p>
      )}

      <div
        className="celestial-slider-track relative"
        style={{ "--slider-pct": `${percentage}%` }}
      >
        {todayPct !== null && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-[2px] h-[14px] bg-pale-gold/70 rounded-sm"
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
          ref={inputRef}
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

      <div className="relative">
        <div className="flex justify-between gap-4 text-xs text-stardust-white opacity-40">
          <span>{minLabel || min}</span>
          <span className="text-right">{maxLabel || max}</span>
        </div>
        {todayPct !== null && (
          <span
            aria-hidden="true"
            className="absolute top-0 text-[10px] font-mono text-pale-gold opacity-70 whitespace-nowrap"
            style={{
              left: `${todayPct}%`,
              transform: "translateX(-50%)",
            }}
          >
            {todayLabel}
          </span>
        )}
      </div>
    </div>
  );
}
