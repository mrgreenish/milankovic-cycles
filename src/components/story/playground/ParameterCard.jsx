"use client";
import React from "react";
import { StorySlider } from "../StorySlider";
import { MiniViz } from "./MiniViz";

export function ParameterCard({
  kind,
  label,
  scienceName,
  value,
  onChange,
  min,
  max,
  step,
  todayValue,
  formatValue,
  describe,
  focused,
  anyFocused,
  onFocus,
  onBlur,
}) {
  const { headline, intuition, effect } = describe(value);
  const raw = formatValue(value);
  const todayStr = formatValue(todayValue);
  const isDimmed = anyFocused && !focused;

  return (
    <div
      className={[
        "relative rounded-lg border transition-all duration-300 p-3 md:p-4",
        focused
          ? "spotlight-focus bg-deep-space/80 border-antique-brass/50"
          : "bg-deep-space/50 border-slate-blue/20",
        isDimmed ? "opacity-40" : "opacity-100",
      ].join(" ")}
      data-param={kind}
      data-focused={focused ? "true" : "false"}
      onPointerDown={() => onFocus?.()}
      onFocusCapture={() => onFocus?.()}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) onBlur?.();
      }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-md bg-deep-space/60 border border-slate-blue/30 p-1">
          <MiniViz kind={kind} value={value} size={48} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-sm font-medium text-stardust-white">
              {label}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-pale-gold/50">
              {scienceName}
            </span>
          </div>
          <div className="text-pale-gold text-base md:text-lg font-medium leading-tight mt-0.5">
            {headline}
          </div>
          <div className="text-[11px] font-mono text-stardust-white/50 mt-0.5">
            {raw} · today {todayStr}
          </div>
          <p className="text-xs text-stardust-white/50 mt-1 leading-snug">
            {intuition}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <StorySlider
          label={label}
          scienceName={scienceName}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          todayMark={todayValue}
          snapToToday
          formatValue={formatValue}
          ariaValueText={`${headline}, ${raw}`}
          onFocus={() => onFocus?.()}
          onBlur={(e) => {
            if (!e.currentTarget.closest(`[data-param="${kind}"]`)?.contains(e.relatedTarget)) {
              onBlur?.();
            }
          }}
          renderValue={() => null}
        />
      </div>

      <p
        className={[
          "text-xs mt-2 leading-snug transition-colors duration-300",
          focused ? "text-pale-gold" : "text-stardust-white/60",
        ].join(" ")}
        aria-live="polite"
      >
        {effect}
      </p>
    </div>
  );
}
