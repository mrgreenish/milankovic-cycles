"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { climateAt, formatTemperatureDelta } from "@/lib/orbital/climate";
import type { OrbitalParameters } from "@/lib/orbital/types";
import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import {
  TIMELINE_MOMENTS,
  TIME_END_KYR,
  TIME_START_KYR,
  formatYears,
  orbitalStateAt,
  precessionIndex,
  timelineSeries,
} from "@/lib/orbital/timeline";

const WIDTH = 900;
const SPAN = TIME_END_KYR - TIME_START_KYR;
const xOf = (kyr: number) => ((kyr - TIME_START_KYR) / SPAN) * WIDTH;

type RowId = "eccentricity" | "tilt" | "summer" | "sunlight" | "ice";
const ROWS: { id: RowId; label: string; height: number }[] = [
  { id: "eccentricity", label: "Orbit shape", height: 24 },
  { id: "tilt", label: "Axis tilt", height: 24 },
  { id: "summer", label: "Summer distance", height: 28 },
  { id: "sunlight", label: "Sunlight, 65°N", height: 64 },
  { id: "ice", label: "Ice on land", height: 40 },
];

function pathFor(values: (number | null)[], min: number, max: number, height: number) {
  const pad = 3;
  let d = "";
  let pen = false;
  values.forEach((value, index) => {
    if (value === null) {
      pen = false;
      return;
    }
    const x = xOf(TIME_START_KYR + index).toFixed(1);
    const y = (
      pad +
      (1 - (value - min) / (max - min)) * (height - pad * 2)
    ).toFixed(1);
    d += `${pen ? "L" : "M"}${x} ${y}`;
    pen = true;
  });
  return d;
}

function buildPaths() {
  const series = timelineSeries();
  const range = (values: number[]) => [Math.min(...values), Math.max(...values)];
  const [e0, e1] = range(series.eccentricity);
  const [o0, o1] = range(series.obliquityDeg);
  const [p0, p1] = range(series.precession);
  const [q0, q1] = range(series.insolation);
  const height = Object.fromEntries(ROWS.map((row) => [row.id, row.height]));
  const ice = series.ice.map((value) => (value === null ? null : 1 - value));
  return {
    eccentricity: pathFor(series.eccentricity, e0, e1, height.eccentricity),
    tilt: pathFor(series.obliquityDeg, o0, o1, height.tilt),
    summer: pathFor(series.precession, p0, p1, height.summer),
    sunlight: pathFor(series.insolation, q0 - 4, q1 + 4, height.sunlight),
    ice: pathFor(ice, -0.04, 1.04, height.ice),
  } satisfies Record<RowId, string>;
}

const TICKS = [-800, -600, -400, -200, 0] as const;

export function Timeline({
  variant,
  parameters,
  timeKyr,
  onTime,
  onScrub,
  playing,
  onTogglePlay,
}: {
  variant: "dock" | "inline";
  /** The orbit on show, used for the readouts when it was set by hand. */
  parameters: OrbitalParameters;
  /** Null while the orbit has been set by hand rather than by a date. */
  timeKyr: number | null;
  onTime: (kyr: number) => void;
  /**
   * Reports the time under the pointer while dragging, and null once it is let
   * go, so the 3D scene can follow the hand without waiting for a page update.
   */
  onScrub?: (kyr: number | null) => void;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const paths = useMemo(() => buildPaths(), []);
  const plot = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  // While the pointer is down the chart follows it directly; the page is told
  // a few times a second, which is plenty for the numbers around it.
  const [scrub, setScrub] = useState<number | null>(null);
  const latest = useRef(0);
  const commitTimer = useRef(0);
  const releaseTimer = useRef(0);
  useEffect(
    () => () => {
      window.clearTimeout(commitTimer.current);
      window.clearTimeout(releaseTimer.current);
    },
    [],
  );
  const commit = useCallback(() => {
    commitTimer.current = 0;
    onTime(latest.current);
  }, [onTime]);
  const at = scrub ?? timeKyr ?? 0;
  const known = scrub !== null || timeKyr !== null;
  const state = known ? orbitalStateAt(at) : parameters;
  const sunlight = calculateSummerInsolation(state).dailyMeanTopOfAtmosphereWm2;
  const climate = climateAt(known ? at : null, state);
  const ice =
    known && climate.source === "record"
      ? Math.min(1, Math.max(0, climate.iceShare))
      : null;
  const values: Record<RowId, string> = {
    eccentricity: state.eccentricity.toFixed(3),
    tilt: `${state.obliquityDeg.toFixed(1)}°`,
    summer: precessionIndex(state) > 0.012 ? "near" : precessionIndex(state) < -0.012 ? "far" : "middle",
    sunlight: `${Math.round(sunlight)} W/m²`,
    ice: ice === null ? (known ? "not recorded" : "—") : `${Math.round(ice * 100)}%`,
  };

  const seek = (event: PointerEvent<HTMLDivElement>) => {
    const box = plot.current?.getBoundingClientRect();
    if (!box) return;
    const share = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    // Tenths of a thousand years: each pixel is about a thousand, and the 3D
    // scene eases between them, so there is no need to snap to whole steps.
    const kyr = Math.round((TIME_START_KYR + share * SPAN) * 10) / 10;
    latest.current = kyr;
    setScrub(kyr);
    onScrub?.(kyr);
    if (!commitTimer.current)
      commitTimer.current = window.setTimeout(commit, 70);
  };
  const endScrub = () => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    window.clearTimeout(commitTimer.current);
    commit();
    // Hold the dragged value a moment, until the page has caught up with it.
    releaseTimer.current = window.setTimeout(() => {
      setScrub(null);
      onScrub?.(null);
    }, 240);
  };

  const style = {
    "--playhead": `${(((at - TIME_START_KYR) / SPAN) * 100).toFixed(2)}%`,
    "--today": `${((-TIME_START_KYR / SPAN) * 100).toFixed(2)}%`,
  } as CSSProperties;

  return (
    <div className="timeline" data-variant={variant} style={style}>
      <div className="timeline__bar">
        <button
          type="button"
          className="play-button"
          aria-pressed={playing}
          onClick={onTogglePlay}
        >
          <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
          {playing ? "Pause" : "Play the clock"}
        </button>
        <p className="timeline__now" aria-live="off">
          <strong>{known ? formatYears(at) : "Your own orbit"}</strong>
          <span>
            {Math.round(sunlight)} W/m² at 65°N
            {known && climate.source === "record"
              ? ` · ${formatTemperatureDelta(climate.deltaTempC)} · ice at ${Math.round(ice! * 100)}%`
              : ""}
          </span>
        </p>
        <div className="timeline__moments" role="group" aria-label="Jump to a moment">
          {TIMELINE_MOMENTS.map((moment) => (
            <button
              type="button"
              key={moment.kyr}
              aria-pressed={timeKyr === moment.kyr}
              onClick={() => onTime(moment.kyr)}
            >
              {moment.label}
            </button>
          ))}
        </div>
      </div>
      <div className="timeline__chart">
        <div className="timeline__labels" aria-hidden="true">
          {ROWS.map((row) => (
            <p key={row.id} data-row={row.id} style={{ height: row.height }}>
              {row.label}
              <b>{values[row.id]}</b>
            </p>
          ))}
        </div>
        <div
          className="timeline__plot"
          ref={plot}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            window.clearTimeout(releaseTimer.current);
            scrubbing.current = true;
            seek(event);
          }}
          onPointerMove={(event) => {
            if (scrubbing.current) seek(event);
          }}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
        >
          {ROWS.map((row) => (
            <svg
              key={row.id}
              className="timeline__row"
              data-row={row.id}
              viewBox={`0 0 ${WIDTH} ${row.height}`}
              preserveAspectRatio="none"
              style={{ height: row.height }}
              aria-hidden="true"
            >
              <path d={paths[row.id]} vectorEffect="non-scaling-stroke" />
            </svg>
          ))}
          <div className="timeline__future" aria-hidden="true">
            Orbit only
          </div>
          <div className="timeline__today" aria-hidden="true" />
          {known ? (
            <div className="timeline__playhead" aria-hidden="true" />
          ) : null}
          <input
            className="timeline__input sr-only"
            type="range"
            name="time"
            aria-label="Time, in thousands of years from today"
            min={TIME_START_KYR}
            max={TIME_END_KYR}
            step={1}
            value={Math.round(at)}
            aria-valuetext={`${formatYears(at)}, ${Math.round(sunlight)} watts per square metre`}
            onChange={(event) => onTime(Number(event.target.value))}
          />
        </div>
        <div className="timeline__axis" aria-hidden="true">
          {TICKS.map((tick) => (
            <span
              key={tick}
              style={{ left: `${((tick - TIME_START_KYR) / SPAN) * 100}%` }}
            >
              {tick === 0 ? "Today" : `${-tick}k`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
