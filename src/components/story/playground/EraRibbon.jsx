"use client";
import React from "react";
import {
  ERAS,
  ERA_ORDER,
  eraPlayheadPosition,
  findNearestEra,
} from "@/lib/eraLookup";

export function EraRibbon({ params, activeKey, onSelect }) {
  const position = eraPlayheadPosition(params);
  const nearestKey = findNearestEra(params, 0.04);
  const displayKey = activeKey || nearestKey;
  const displayEra = displayKey ? ERAS[displayKey] : null;
  const leftPct = (position / (ERA_ORDER.length - 1)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-pale-gold/50">
          Jump through time
        </span>
        {displayEra && (
          <span className="text-[10px] font-mono text-pale-gold/70">
            {nearestKey && !activeKey ? `like ${displayEra.shortLabel}` : displayEra.shortLabel}
          </span>
        )}
      </div>

      <div className="relative h-10">
        <div className="absolute inset-x-2 top-1/2 h-[2px] bg-gradient-to-r from-slate-blue/30 via-antique-brass/40 to-slate-blue/30 -translate-y-1/2 rounded-full" />

        <div
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-out"
          style={{ left: `calc(${leftPct}% * (100% - 16px) / 100% + 8px)` }}
          aria-hidden
        >
          <div className="w-3 h-3 rounded-full bg-antique-brass border border-stardust-white/40 shadow-[0_0_8px_hsla(36,60%,58%,0.8)] -translate-x-1/2" />
        </div>

        <div className="absolute inset-0 flex items-center justify-between px-0">
          {ERA_ORDER.map((key) => {
            const era = ERAS[key];
            const isActive = activeKey === key;
            const isNearest = !activeKey && nearestKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                aria-label={`Jump to ${era.name}`}
                aria-pressed={isActive}
                className={[
                  "relative z-10 flex flex-col items-center gap-1 px-2 py-1 rounded transition-all",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-antique-brass",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-2.5 h-2.5 rounded-full border transition-all",
                    isActive
                      ? "bg-antique-brass border-stardust-white scale-125"
                      : isNearest
                      ? "bg-antique-brass/60 border-pale-gold/70"
                      : "bg-deep-space border-slate-blue/60",
                  ].join(" ")}
                />
                <span
                  className={[
                    "text-[10px] leading-tight font-mono whitespace-nowrap transition-colors",
                    isActive || isNearest
                      ? "text-pale-gold"
                      : "text-stardust-white/50",
                  ].join(" ")}
                >
                  {era.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {displayEra && (
        <p className="text-[11px] text-stardust-white/60 leading-snug mt-1.5">
          {displayEra.description}
        </p>
      )}
    </div>
  );
}
