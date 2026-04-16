"use client";
import React, { useEffect, useRef, useState } from "react";

// Targets are 65°N annual-mean temperatures — the latitude that drives
// glacial cycles. Today's value sits near -8°C for current orbital config;
// the achievable range across the playground sliders is roughly -15 to +10°C.
const TODAY_TEMP = -8;

const MISSIONS = [
  {
    id: "iceAge",
    label: "Build an ice age",
    target: "≤ -12°C",
    check: (t) => t <= -12,
  },
  {
    id: "warm",
    label: "Warm Earth up",
    target: "≥ 5°C",
    check: (t) => t >= 5,
  },
  {
    id: "today",
    label: "Match today",
    target: `~${TODAY_TEMP}°C`,
    check: (t) => Math.abs(t - TODAY_TEMP) < 1.2,
  },
];

export function MissionChip({ temperature, className = "" }) {
  const [index, setIndex] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const celebrateTimer = useRef(null);
  const rotateTimer = useRef(null);
  const armedRef = useRef(true);

  const current = MISSIONS[index];
  const done = current.check(temperature);

  useEffect(() => {
    if (done && armedRef.current && !justCompleted) {
      armedRef.current = false;
      setJustCompleted(true);
      celebrateTimer.current = setTimeout(() => {
        rotateTimer.current = setTimeout(() => {
          setIndex((i) => (i + 1) % MISSIONS.length);
          setJustCompleted(false);
          armedRef.current = true;
        }, 400);
      }, 1200);
    }
    if (!done && !justCompleted) {
      armedRef.current = true;
    }
    return () => {
      clearTimeout(celebrateTimer.current);
      clearTimeout(rotateTimer.current);
    };
  }, [done, justCompleted]);

  const advance = () => {
    clearTimeout(celebrateTimer.current);
    clearTimeout(rotateTimer.current);
    setJustCompleted(false);
    armedRef.current = true;
    setIndex((i) => (i + 1) % MISSIONS.length);
  };

  return (
    <div
      className={[
        "inline-flex items-center gap-2 py-1.5 px-3 rounded-full border text-xs transition-all duration-300",
        justCompleted
          ? "bg-emerald-500/15 border-emerald-400/60 text-emerald-200"
          : "bg-deep-space/70 border-antique-brass/40 text-pale-gold",
        className,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <span aria-hidden className="shrink-0">
        {justCompleted ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7l3.5 3.5L12 3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
            <circle cx="7" cy="7" r="2" fill="currentColor" opacity="0.4" />
          </svg>
        )}
      </span>
      <span className="whitespace-nowrap">
        {justCompleted ? (
          <>Nailed it — {current.label.toLowerCase()}</>
        ) : (
          <>
            <span className="opacity-60">Try:</span> {current.label}
            <span className="ml-1 opacity-50 font-mono">({current.target})</span>
          </>
        )}
      </span>
      <button
        type="button"
        onClick={advance}
        aria-label="Next mission"
        className="opacity-60 hover:opacity-100 transition-opacity p-0.5"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6a4 4 0 1 1 1.2 2.85M2 9.5V6.5h3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
