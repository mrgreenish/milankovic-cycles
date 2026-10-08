"use client";
import { useRef, useState, type CSSProperties } from "react";
import { track } from "@vercel/analytics";
import {
  ORBITAL_CONTROLS,
  describeParameter,
  formatParameter,
  parameterValueText,
  sunlightAnnouncement,
  type ParameterKey,
} from "@/lib/orbital/controls";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type { OrbitalParameters } from "@/lib/orbital/types";

export function ParameterControl({
  id,
  parameter,
  parameters,
  onChange,
  onFocus,
  context,
  playing = false,
  onTogglePlay,
}: {
  id: string;
  parameter: ParameterKey;
  parameters: OrbitalParameters;
  onChange: (value: number) => void;
  onFocus?: () => void;
  context: "tour" | "lab";
  playing?: boolean;
  onTogglePlay?: () => void;
}) {
  const config = ORBITAL_CONTROLS[parameter];
  const value = parameters[parameter];
  const today = PRESENT_PARAMETERS[parameter];
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
          <small aria-hidden="true">
            {config.term} · every {config.period.replace("~", "")}
          </small>
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
      <p className="parameter-control__live">
        {describeParameter(parameter, parameters)}
      </p>
      <div
        className="quick-experiments"
        role="group"
        aria-label={`${config.label} experiments`}
      >
        {onTogglePlay ? (
          <button
            type="button"
            className="play-button"
            aria-pressed={playing}
            onClick={() => {
              onFocus?.();
              onTogglePlay();
            }}
          >
            <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
            {playing ? "Stop" : "Play the cycle"}
          </button>
        ) : null}
        {config.experiments.map((item) => (
          <button
            type="button"
            key={item.value}
            aria-pressed={Math.abs(value - item.value) < config.step / 2}
            onClick={() => experiment(item.value, item.label)}
          >
            {item.label}
          </button>
        ))}
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
          Back to today
        </button>
      </div>
      <span className="sr-only" aria-live="polite" role="status">
        {announcement}
      </span>
    </div>
  );
}
