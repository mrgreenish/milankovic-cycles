"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { track } from "@vercel/analytics";
import {
  calculateSummerInsolation,
  PRESENT_PARAMETERS,
  PRESENT_SUMMER_INSOLATION_WM2,
} from "@/lib/orbital/insolation";
import { seasonOfClosestApproach } from "@/lib/orbital/geometry";
import type {
  OrbitScale,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import { OrbitalPoster } from "./OrbitalPoster";

const SceneClient = dynamic(() => import("./SceneClient"), {
  ssr: false,
  loading: () => null,
});

class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

function focusFromChapter(chapter: string): OrbitalVisualFocus {
  if (chapter === "orbit-shape") return "shape";
  if (chapter === "axis-tilt") return "tilt";
  if (chapter === "axis-direction") return "direction";
  return "combined";
}

function SceneGuide({
  parameters,
  focus,
}: {
  parameters: OrbitalParameters;
  focus: OrbitalVisualFocus;
}) {
  const reading = calculateSummerInsolation(parameters);
  const delta = reading.deltaFromPresentWm2;

  let eyebrow = "Northern summer signal";
  let metric = `${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} W/m²`;
  let detail =
    Math.abs(delta) < 0.5
      ? "At the present reference"
      : `${Math.abs(delta).toFixed(0)} W/m² ${delta > 0 ? "stronger" : "weaker"} than today`;
  let startLabel = "Weaker summer";
  let endLabel = "Stronger summer";
  let currentPosition = clampPercent(
    ((reading.dailyMeanTopOfAtmosphereWm2 - 430) / 100) * 100,
  );
  let todayPosition = clampPercent(
    ((PRESENT_SUMMER_INSOLATION_WM2 - 430) / 100) * 100,
  );

  if (focus === "shape") {
    const spread = parameters.eccentricity * 2;
    eyebrow = "Orbit shape · current vs today";
    metric = `${spread.toFixed(3)} AU near–far spread`;
    detail = "Solid orbit is current · faint orbit is today";
    startLabel = "Rounder";
    endLabel = "More elliptical";
    currentPosition = clampPercent(
      ((parameters.eccentricity - 0.005) / (0.058 - 0.005)) * 100,
    );
    todayPosition = clampPercent(
      ((PRESENT_PARAMETERS.eccentricity - 0.005) / (0.058 - 0.005)) * 100,
    );
  } else if (focus === "tilt") {
    const tiltDelta = parameters.obliquityDeg - PRESENT_PARAMETERS.obliquityDeg;
    eyebrow = "Axis tilt · close-up";
    metric = `${parameters.obliquityDeg.toFixed(2)}°`;
    detail = `${tiltDelta >= 0 ? "+" : ""}${tiltDelta.toFixed(2)}° vs today · ${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} W/m² at 65°N`;
    startLabel = "22.1° · milder";
    endLabel = "24.5° · stronger";
    currentPosition = clampPercent(
      ((parameters.obliquityDeg - 22.1) / (24.5 - 22.1)) * 100,
    );
    todayPosition = clampPercent(
      ((PRESENT_PARAMETERS.obliquityDeg - 22.1) / (24.5 - 22.1)) * 100,
    );
  } else if (focus === "direction") {
    eyebrow = "Season at closest approach";
    metric = seasonOfClosestApproach(parameters);
    detail = `Northern summer is ${reading.earthSunDistanceAu.toFixed(3)} AU from the Sun · ${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} W/m²`;
    startLabel = "0°";
    endLabel = "360°";
    currentPosition = clampPercent(
      (parameters.earthPerihelionLongitudeDeg / 360) * 100,
    );
    todayPosition = clampPercent(
      (PRESENT_PARAMETERS.earthPerihelionLongitudeDeg / 360) * 100,
    );
  }

  const style = {
    "--scene-current-position": `${currentPosition}%`,
    "--scene-today-position": `${todayPosition}%`,
  } as CSSProperties;

  return (
    <div
      className="scene-guide"
      data-focus={focus}
      style={style}
      aria-hidden="true"
    >
      <div className="scene-guide__heading">
        <span>{eyebrow}</span>
        <strong>{metric}</strong>
      </div>
      <div className="scene-guide__track">
        <span className="scene-guide__today-marker" />
        <span className="scene-guide__current-marker" />
      </div>
      <div className="scene-guide__labels">
        <span>{startLabel}</span>
        <span>{detail}</span>
        <span>{endLabel}</span>
      </div>
    </div>
  );
}

export function SceneLoader({
  parameters,
  scale,
  chapter,
  focus,
  reducedMotion,
}: {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  chapter: string;
  focus?: OrbitalVisualFocus;
  reducedMotion: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const visualFocus = focus ?? focusFromChapter(chapter);
  const reading = calculateSummerInsolation(parameters);
  const poster = (
    <OrbitalPoster parameters={parameters} scale={scale} focus={visualFocus} />
  );
  const handleFailure = useCallback(() => {
    setFailed(true);
    track("webgl_fallback");
  }, []);

  const accessibleLabel =
    visualFocus === "shape"
      ? `Orbit shape comparison. Current eccentricity ${parameters.eccentricity.toFixed(4)}; the faint orbit is today's reference.`
      : visualFocus === "tilt"
        ? `Close-up of Earth's axis at ${parameters.obliquityDeg.toFixed(2)} degrees, compared with today's axis.`
        : visualFocus === "direction"
          ? `Earth's northern summer position around the orbit. Closest approach occurs in ${seasonOfClosestApproach(parameters).toLowerCase()}. The blue reference marks today's season angle while the other settings stay fixed.`
          : `Earth and Sun geometry producing ${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} watts per square metre at 65 degrees north in summer.`;

  return (
    <div
      className="scene-viewport"
      role="img"
      aria-label={accessibleLabel}
      data-ready={ready && !failed ? "true" : "false"}
    >
      <div className="scene-viewport__poster">{poster}</div>
      {!failed && !reducedMotion ? (
        <SceneErrorBoundary fallback={poster} onFailure={handleFailure}>
          <div className="scene-viewport__canvas">
            <SceneClient
              parameters={parameters}
              scale={scale}
              chapter={chapter}
              focus={visualFocus}
              reducedMotion={reducedMotion}
              onReady={() => setReady(true)}
              onFailure={handleFailure}
            />
          </div>
        </SceneErrorBoundary>
      ) : null}
      <SceneGuide parameters={parameters} focus={visualFocus} />
    </div>
  );
}
