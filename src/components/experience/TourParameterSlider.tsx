"use client";
import type { ParameterKey } from "@/lib/orbital/controls";
import { useExperience } from "./ExperienceProvider";
import { ParameterControl } from "./ParameterControl";

export function TourParameterSlider({
  parameter,
}: {
  parameter: ParameterKey;
}) {
  const { parameters, setParameter } = useExperience();
  return (
    <ParameterControl
      id={`tour-${parameter}`}
      parameter={parameter}
      parameters={parameters}
      onChange={(value) => setParameter(parameter, value)}
      context="tour"
    />
  );
}
