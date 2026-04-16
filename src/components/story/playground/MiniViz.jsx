"use client";
import React from "react";
import { TODAY_ECC, TODAY_TILT, TODAY_PREC } from "@/lib/parameterCopy";

const BRASS = "#cdaf7d";
const GOLD = "#e8d0a9";
const GHOST = "rgba(232, 208, 169, 0.3)";
const SLATE = "rgba(135, 165, 200, 0.5)";

export function EllipseViz({ value, size = 56 }) {
  const cx = size / 2;
  const cy = size / 2;
  const rx = size * 0.42;
  const ryToday = rx * (1 - 2 * TODAY_ECC * 2);
  const ry = rx * (1 - 2 * value * 2);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ryToday}
        fill="none"
        stroke={GHOST}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={GOLD}
        strokeWidth="1.5"
      />
      <circle cx={cx + rx * 0.55} cy={cy} r="2" fill="#fbbf24" />
    </svg>
  );
}

export function TiltViz({ value, size = 56 }) {
  const cx = size / 2;
  const cy = size / 2;
  const armLen = size * 0.38;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const angleToday = toRad(TODAY_TILT);
  const angle = toRad(value);
  const todayX = cx + armLen * Math.sin(angleToday);
  const todayY = cy - armLen * Math.cos(angleToday);
  const curX = cx + armLen * Math.sin(angle);
  const curY = cy - armLen * Math.cos(angle);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <line
        x1={cx}
        y1={cy + armLen * 0.6}
        x2={cx}
        y2={cy - armLen * 0.6}
        stroke={SLATE}
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
      <line
        x1={cx}
        y1={cy}
        x2={todayX}
        y2={todayY}
        stroke={GHOST}
        strokeWidth="1.5"
      />
      <circle cx={cx} cy={cy} r={armLen * 0.85} fill="none" stroke={SLATE} strokeWidth="0.6" opacity="0.4" />
      <line
        x1={cx}
        y1={cy}
        x2={curX}
        y2={curY}
        stroke={GOLD}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx={curX} cy={curY} r="2.5" fill={BRASS} />
    </svg>
  );
}

export function WobbleViz({ value, size = 56 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const angle = toRad(value - 90);
  const todayAngle = toRad(TODAY_PREC - 90);
  const dotX = cx + r * Math.cos(angle);
  const dotY = cy + r * Math.sin(angle);
  const todayX = cx + r * Math.cos(todayAngle);
  const todayY = cy + r * Math.sin(todayAngle);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={GOLD}
        strokeWidth="1.2"
        strokeDasharray="3 2"
      />
      <circle cx={todayX} cy={todayY} r="2" fill={GHOST} />
      <line
        x1={cx}
        y1={cy}
        x2={dotX}
        y2={dotY}
        stroke={BRASS}
        strokeWidth="1.2"
        opacity="0.6"
      />
      <circle cx={dotX} cy={dotY} r="3" fill={BRASS} />
      <circle cx={dotX} cy={dotY} r="5" fill={BRASS} opacity="0.25" />
    </svg>
  );
}

export function MiniViz({ kind, value, size }) {
  if (kind === "stretch") return <EllipseViz value={value} size={size} />;
  if (kind === "lean") return <TiltViz value={value} size={size} />;
  if (kind === "wobble") return <WobbleViz value={value} size={size} />;
  return null;
}
