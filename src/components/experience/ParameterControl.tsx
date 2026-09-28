"use client";
import { useRef, useState, type CSSProperties } from "react";
import { track } from "@vercel/analytics";
import {
  ORBITAL_CONTROLS,
  formatParameter,
  formatSunlightDelta,
  parameterValueText,
  sunlightAnnouncement,
  type ParameterKey,
} from "@/lib/orbital/controls";
import {
  calculateSummerInsolation,
  PRESENT_PARAMETERS,
} from "@/lib/orbital/insolation";
import type { OrbitalParameters } from "@/lib/orbital/types";

export function ParameterControl({
  id,
  parameter,
  parameters,
  onChange,
  onFocus,
  context,
}: {
  id: string;
  parameter: ParameterKey;
  parameters: OrbitalParameters;
  onChange: (value: number) => void;
  onFocus?: () => void;
  context: "tour" | "lab";
}) {
  const config = ORBITAL_CONTROLS[parameter];
  const value = parameters[parameter];
  const today = PRESENT_PARAMETERS[parameter];
  const reading = calculateSummerInsolation(parameters);
  const [announcement, setAnnouncement] = useState("");
  const lastCommit = useRef(value);
  const style = {
    "--today-position": `${((today - config.min) / (config.max - config.min)) * 100}%`,
    "--control-position": `${((value - config.min) / (config.max - config.min)) * 100}%`,
  } as CSSProperties;
  const commit = () => {
    if (lastCommit.current === value) return;
    lastCommit.current = value;
    setAnnouncement(sunlightAnnouncement(parameters));
  };
  const experiment = (next: number, label: string) => {
    onFocus?.();
    onChange(next);
    lastCommit.current = next;
    setAnnouncement(sunlightAnnouncement({ ...parameters, [parameter]: next }));
    track("quick_experiment", { context, parameter, experiment: label });
  };
  return (
    <div className="parameter-control" style={style}>
      <div className="parameter-control__header">
        <label htmlFor={id}>
          {config.label}
          <small aria-hidden="true">{config.term}</small>
        </label>
        <output htmlFor={id} aria-live="off">
          {formatParameter(parameter, value)}
        </output>
      </div>
      <input
        id={id}
        name={parameter}
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        aria-valuetext={parameterValueText(parameter, parameters)}
        onChange={(event) => onChange(Number(event.target.value))}
        onFocus={onFocus}
        onPointerDown={onFocus}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <div className="parameter-control__labels">
        <span>{config.minLabel}</span>
        <span className="parameter-control__today">Today</span>
        <span>{config.maxLabel}</span>
      </div>
      <div
        className="quick-experiments"
        role="group"
        aria-label={`${config.label} experiments`}
      >
        {config.experiments.map((item) => (
          <button
            type="button"
            key={item.value}
            aria-pressed={Math.abs(value - item.value) < config.step / 2}
            onClick={() => experiment(item.value, item.label)}
          >
            {item.label}
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="control-result">
        <span>
          Summer at 65°N{" "}
          <strong>
            {Math.round(reading.dailyMeanTopOfAtmosphereWm2)} W/m²
          </strong>
        </span>
        <span>{formatSunlightDelta(reading.deltaFromPresentWm2)}</span>
      </div>
      <div className="control-reference">
        <span>
          Today: {formatParameter(parameter, today)}{" "}
          <span className="reference-epoch">· J2000</span>
        </span>
        <button
          type="button"
          className="text-button"
          disabled={value === today}
          onClick={() => {
            onChange(today);
            setAnnouncement(
              sunlightAnnouncement({ ...parameters, [parameter]: today }),
            );
          }}
        >
          Reset {config.label.toLowerCase()}
        </button>
      </div>
      <span className="sr-only" aria-live="polite" role="status">
        {announcement}
      </span>
    </div>
  );
}
