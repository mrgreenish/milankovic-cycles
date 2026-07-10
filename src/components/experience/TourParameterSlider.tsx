"use client";

import type { CSSProperties } from "react";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import { seasonOfClosestApproach } from "@/lib/orbital/geometry";
import type { OrbitalParameters } from "@/lib/orbital/types";
import { useExperience } from "./ExperienceProvider";

type ParameterKey = keyof OrbitalParameters;

type Props = {
  parameter: ParameterKey;
  label: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  format: "eccentricity" | "degrees";
};

export function TourParameterSlider({
  parameter,
  label,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  format,
}: Props) {
  const { parameters, setParameter, resetParameter } = useExperience();
  const value = parameters[parameter];
  const today = PRESENT_PARAMETERS[parameter];
  const marker = ((today - min) / (max - min)) * 100;
  const style = { "--today-position": `${marker}%` } as CSSProperties;
  const formattedValue =
    format === "eccentricity" ? value.toFixed(4) : `${value.toFixed(1)}°`;
  const accessibleValue =
    parameter === "earthPerihelionLongitudeDeg"
      ? `${formattedValue}, ${seasonOfClosestApproach({ ...parameters, earthPerihelionLongitudeDeg: value })}`
      : formattedValue;

  return (
    <div className="parameter-control">
      <div className="parameter-control__header">
        <label htmlFor={`tour-${parameter}`}>{label}</label>
        <output htmlFor={`tour-${parameter}`}>{formattedValue}</output>
      </div>
      <input
        id={`tour-${parameter}`}
        name={parameter}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={accessibleValue}
        onChange={(event) => setParameter(parameter, Number(event.target.value))}
      />
      <div className="parameter-control__labels" style={style}>
        <span>{minLabel}</span>
        <span className="parameter-control__today">Today</span>
        <span>{maxLabel}</span>
      </div>
      <button
        className="text-button"
        type="button"
        onClick={() => resetParameter(parameter)}
      >
        Reset to Today
      </button>
    </div>
  );
}
