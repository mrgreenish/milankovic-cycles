"use client";
import React from "react";
import { normalizeTemperature } from "@/lib/temperatureUtils";
import { ERAS, findNearestEra } from "@/lib/eraLookup";
import { getTodayTemperature } from "@/lib/todayClimate";

function TempIcon({ temperature }) {
  if (temperature < -10) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (temperature < -5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-temp-cold">
        <path d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (temperature < 0) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-pale-gold opacity-60">
        <path d="M12 4a8 8 0 0 1 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 4a8 8 0 0 0 0 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>
    );
  }
  if (temperature < 5) {
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

// Labels are calibrated for the 65°N annual-mean reading (today ≈ -8°C).
// The achievable range across playground sliders is roughly -15..+10°C.
function label(t) {
  if (t < -10) return "Glacial";
  if (t < -5) return "Cold";
  if (t < 0) return "Cool";
  if (t < 5) return "Moderate";
  return "Warm";
}

export function TemperaturePod({
  temperature,
  displayedTemp,
  iceFactor,
  eccentricity,
  axialTilt,
  precession,
}) {
  const shownTemp = typeof displayedTemp === "number" ? displayedTemp : temperature;
  const norm = normalizeTemperature(shownTemp, -15, 10);
  const pct = Math.max(0, Math.min(1, norm)) * 100;

  const todayTemp = getTodayTemperature();
  const todayPct =
    Math.max(0, Math.min(1, normalizeTemperature(todayTemp, -15, 10))) * 100;

  const delta = temperature - todayTemp;
  const showDelta = Math.abs(delta) > 0.15;

  // Tint the big number toward warm/cold once we drift away from today, so
  // the direction of change reads at a glance.
  const numberColor =
    delta > 1
      ? "hsl(15 75% 70%)"
      : delta < -1
      ? "hsl(215 70% 72%)"
      : "hsl(var(--pale-gold))";

  const nearestKey = findNearestEra(
    { eccentricity, axialTilt, precession },
    0.04
  );
  const nearestEra = nearestKey ? ERAS[nearestKey] : null;

  const icePct = Math.round(iceFactor * 100);

  return (
    <div className="observatory-panel p-3 md:p-4 space-y-2.5 w-full md:w-60">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono uppercase tracking-wider text-antique-brass"
          title="Annual mean at 65°N — the latitude that drives glacial cycles"
        >
          Climate at 65°N
        </span>
        <span className="text-xs text-stardust-white/70">{label(temperature)}</span>
      </div>

      <div className="flex items-center gap-2">
        <TempIcon temperature={temperature} />
        <span
          className="text-2xl font-mono font-bold leading-none transition-colors duration-500"
          style={{ color: numberColor }}
        >
          {shownTemp.toFixed(1)}°C
        </span>
        {showDelta && (
          <span
            className={[
              "text-xs font-mono font-medium ml-auto chip-in",
              delta > 0 ? "text-temp-warm" : "text-temp-cold",
            ].join(" ")}
          >
            {delta > 0 ? "+" : "−"}
            {Math.abs(delta).toFixed(1)}° vs today
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
            left: `${pct}%`,
            transform: "translateX(-50%)",
            boxShadow: "0 0 6px hsla(220, 100%, 97%, 0.6)",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-stardust-white/70">
          Ice <span className="font-mono text-pale-gold/80">{icePct}%</span>
        </span>
        <span className="text-[10px] font-mono text-pale-gold/75">
          today {todayTemp.toFixed(1)}°C
        </span>
        <span className="text-pale-gold/70 font-mono">
          {nearestEra ? `like ${nearestEra.shortLabel}` : ""}
        </span>
      </div>
    </div>
  );
}
