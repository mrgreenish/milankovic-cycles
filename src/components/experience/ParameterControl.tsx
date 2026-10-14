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
import { fill } from "@/i18n/format";
import { useUi } from "@/i18n/LocaleProvider";
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
  const ui = useUi();
  const text = ui.controls[parameter];
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
    setAnnouncement(sunlightAnnouncement(parameters, ui));
  };
  const experiment = (next: number, label: string) => {
    onFocus?.();
    onChange(next);
    lastCommit.current = next;
    setAnnouncement(
      sunlightAnnouncement({ ...parameters, [parameter]: next }, ui),
    );
    track("quick_experiment", { context, parameter, experiment: label });
  };
  return (
    <div className="parameter-control" style={style}>
      <div className="parameter-control__header">
        <label htmlFor={id}>
          {text.label}
          <small aria-hidden="true">
            {fill(ui.controls.every, { term: text.term, period: text.period })}
          </small>
        </label>
        <output htmlFor={id} aria-live="off">
          {formatParameter(parameter, value, ui)}
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
        aria-valuetext={parameterValueText(parameter, parameters, ui)}
        onChange={(event) => onChange(Number(event.target.value))}
        onFocus={onFocus}
        onPointerDown={onFocus}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
      />
      <div className="parameter-control__labels">
        <span>{text.minLabel}</span>
        <span className="parameter-control__today">{ui.controls.today}</span>
        <span>{text.maxLabel}</span>
      </div>
      <p className="parameter-control__live">
        {describeParameter(parameter, parameters, ui)}
      </p>
      <div
        className="quick-experiments"
        role="group"
        aria-label={fill(ui.controls.experimentsLabel, { label: text.label })}
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
            {playing ? ui.controls.stop : ui.controls.playCycle}
          </button>
        ) : null}
        {config.experiments.map((item, index) => (
          <button
            type="button"
            key={item.value}
            aria-pressed={Math.abs(value - item.value) < config.step / 2}
            onClick={() => experiment(item.value, item.label)}
          >
            {text.experiments[index]}
          </button>
        ))}
        <button
          type="button"
          className="text-button"
          disabled={value === today}
          onClick={() => {
            onChange(today);
            setAnnouncement(
              sunlightAnnouncement({ ...parameters, [parameter]: today }, ui),
            );
          }}
        >
          {ui.controls.backToToday}
        </button>
      </div>
      <span className="sr-only" aria-live="polite" role="status">
        {announcement}
      </span>
    </div>
  );
}
