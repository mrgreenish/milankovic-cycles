"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  normalizeTemperature,
  TODAY_TEMP_65N,
  describeRelativeTemperature,
} from "@/lib/temperatureUtils";
import { ERAS, findNearestEra } from "@/lib/eraLookup";

// Icon thresholds mirror describeRelativeTemperature (delta vs today)
function TempIcon({ delta }) {
  if (delta <= -1.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (delta < -0.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (delta <= 0.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-pale-gold opacity-60">
        <path d="M12 4a8 8 0 0 1 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4a8 8 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (delta <= 5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-pale-gold">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-temp-warm">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// The achievable range across the playground sliders is roughly -10..+11°C
// on the 65°N annual-mean scale (today ≈ -8.3°C).
const SCALE_MIN = -11;
const SCALE_MAX = 11;

// Qualitative read of the ice factor — what matters for glaciation is
// whether winter snow at 65°N survives the summer melt.
function summerSnowLabel(iceFactor) {
  if (iceFactor > 0.85) return "survives summer";
  if (iceFactor > 0.5) return "barely melts";
  return "melts each summer";
}

export function TemperaturePod({
  temperature,
  iceFactor,
  eccentricity,
  axialTilt,
  precession,
  focusedParam,
}) {
  const norm = normalizeTemperature(temperature, SCALE_MIN, SCALE_MAX);
  const pct = Math.max(0, Math.min(1, norm)) * 100;
  const todayPct =
    Math.max(
      0,
      Math.min(1, normalizeTemperature(TODAY_TEMP_65N, SCALE_MIN, SCALE_MAX))
    ) * 100;
  const deltaVsToday = temperature - TODAY_TEMP_65N;

  const [ghostTemp, setGhostTemp] = useState(null);
  const focusStartRef = useRef(null);

  useEffect(() => {
    if (focusedParam) {
      if (focusStartRef.current === null) {
        focusStartRef.current = temperature;
        setGhostTemp(temperature);
      }
    } else {
      focusStartRef.current = null;
      const t = setTimeout(() => setGhostTemp(null), 1200);
      return () => clearTimeout(t);
    }
  }, [focusedParam]);

  const ghostPct =
    ghostTemp !== null
      ? Math.max(
          0,
          Math.min(1, normalizeTemperature(ghostTemp, SCALE_MIN, SCALE_MAX))
        ) * 100
      : null;

  const delta =
    ghostTemp !== null && focusedParam
      ? temperature - ghostTemp
      : null;

  const nearestKey = findNearestEra(
    { eccentricity, axialTilt, precession },
    0.04
  );
  const nearestEra = nearestKey ? ERAS[nearestKey] : null;

  return (
    <div className="observatory-panel p-3 md:p-4 space-y-2.5 w-full md:w-60">
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-mono uppercase tracking-wider text-pale-gold/70"
          title="Annual mean at 65°N — the latitude that drives glacial cycles"
        >
          Climate · 65°N
        </span>
        <span className="text-xs text-stardust-white/80">
          {describeRelativeTemperature(deltaVsToday)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <TempIcon delta={deltaVsToday} />
        <span className="text-2xl font-mono font-bold text-pale-gold leading-none">
          {deltaVsToday > 0.05 ? "+" : deltaVsToday < -0.05 ? "−" : "±"}
          {Math.abs(deltaVsToday).toFixed(1)}°C
        </span>
        <span className="text-xs text-stardust-white/60">vs today</span>
        {delta !== null && Math.abs(delta) > 0.1 && (
          <span
            className={[
              "text-xs font-mono font-medium ml-auto",
              delta > 0 ? "text-temp-warm" : "text-temp-cold",
            ].join(" ")}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
        )}
      </div>

      <div
        className="h-2 rounded-full overflow-hidden relative"
        style={{
          background:
            "linear-gradient(to right, hsl(222 50% 36%), hsl(215 32% 45%), hsl(30 58% 47%), hsl(20 60% 44%), hsl(10 65% 41%))",
        }}
      >
        <div
          className="absolute top-0 h-full w-[2px] bg-pale-gold/70"
          style={{ left: `${todayPct}%`, transform: "translateX(-50%)" }}
          title="Today"
          aria-hidden
        />
        {ghostPct !== null && (
          <div
            className="absolute top-0 h-full w-[2px] bg-stardust-white/40"
            style={{ left: `${ghostPct}%`, transform: "translateX(-50%)" }}
            aria-hidden
          />
        )}
        <div
          className="absolute top-0 h-full w-1.5 bg-stardust-white rounded-full transition-all duration-300"
          style={{
            left: `${pct}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px hsla(220, 100%, 97%, 0.6)",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-stardust-white/70">
          Snow{" "}
          <span className="font-mono text-pale-gold/80">
            {summerSnowLabel(iceFactor)}
          </span>
        </span>
        <span className="text-pale-gold/80 font-mono">
          {nearestEra ? `like ${nearestEra.shortLabel}` : ""}
        </span>
      </div>
    </div>
  );
}
