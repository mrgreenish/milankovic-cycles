"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  aphelionDistanceAu,
  perihelionDistanceAu,
  perihelionToAphelionFluxRatio,
  seasonOfClosestApproach,
} from "@/lib/orbital/geometry";
import {
  calculateSummerInsolation,
  getMeltPressureCopy,
  getOrbitalMeltPressure,
  PRESENT_PARAMETERS,
} from "@/lib/orbital/insolation";
import { ORBITAL_MILESTONES } from "@/lib/orbital/milestones";
import { parseLabQuery, serializeLabQuery } from "@/lib/orbital/query";
import { SITE_URL } from "@/lib/site";
import type {
  OrbitScale,
  OrbitalMilestoneId,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import { SceneLoader } from "@/components/experience/SceneLoader";

type LabState = {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  invalidFields: string[];
  selectedPreset: OrbitalMilestoneId | null;
  visualFocus: OrbitalVisualFocus;
};

type LabAction =
  | { type: "parameter"; key: keyof OrbitalParameters; value: number; focus: OrbitalVisualFocus }
  | { type: "preset"; id: OrbitalMilestoneId; parameters: OrbitalParameters }
  | { type: "reset" }
  | { type: "scale"; scale: OrbitScale }
  | { type: "focus"; focus: OrbitalVisualFocus }
  | { type: "dismiss-invalid" };

function labReducer(state: LabState, action: LabAction): LabState {
  switch (action.type) {
    case "parameter":
      return {
        ...state,
        parameters: { ...state.parameters, [action.key]: action.value },
        selectedPreset: null,
        visualFocus: action.focus,
      };
    case "preset":
      return {
        ...state,
        parameters: { ...action.parameters },
        selectedPreset: action.id,
        invalidFields: [],
        visualFocus: "combined",
      };
    case "reset":
      return {
        ...state,
        parameters: { ...PRESENT_PARAMETERS },
        selectedPreset: "presentJ2000",
        invalidFields: [],
        visualFocus: "combined",
      };
    case "scale":
      return { ...state, scale: action.scale, visualFocus: "shape" };
    case "focus":
      return { ...state, visualFocus: action.focus };
    case "dismiss-invalid":
      return { ...state, invalidFields: [] };
  }
}

type SliderProps = {
  id: string;
  label: string;
  value: number;
  today: number;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  valueText: string;
  displayValue: string;
  onChange: (value: number) => void;
  onCommit: () => void;
  onFocus: () => void;
};

function LabSlider({
  id,
  label,
  value,
  today,
  min,
  max,
  step,
  minLabel,
  maxLabel,
  valueText,
  displayValue,
  onChange,
  onCommit,
  onFocus,
}: SliderProps) {
  const marker = ((today - min) / (max - min)) * 100;
  const style = { "--today-position": `${marker}%` } as CSSProperties;
  return (
    <div className="lab-control">
      <div className="lab-control__header">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id}>{displayValue}</output>
      </div>
      <input
        id={id}
        name={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        aria-valuetext={valueText}
        onFocus={onFocus}
        onPointerDown={onFocus}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
      />
      <div className="parameter-control__labels" style={style}>
        <span>{minLabel}</span><span className="parameter-control__today">Today</span><span>{maxLabel}</span>
      </div>
    </div>
  );
}

// The present-day default state belongs at bare /lab; any other state is
// carried in the query string. Keeps one canonical URL in circulation.
function labPath(parameters: OrbitalParameters, scale: OrbitScale) {
  const query = serializeLabQuery(parameters, scale);
  if (query === serializeLabQuery(PRESENT_PARAMETERS, "5x")) return "/lab";
  return `/lab?${query}`;
}

export function LabExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = useMemo(() => parseLabQuery(searchParams), [searchParams]);
  const [state, dispatch] = useReducer(labReducer, {
    ...initial,
    selectedPreset: null,
    visualFocus: "combined",
  });
  const [announcement, setAnnouncement] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reading = useMemo(
    () => calculateSummerInsolation(state.parameters),
    [state.parameters],
  );
  const pressure = getOrbitalMeltPressure(reading.deltaFromPresentWm2);

  useEffect(() => {
    track("lab_entry");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (updateTimer.current) clearTimeout(updateTimer.current);
    updateTimer.current = setTimeout(() => {
      // Only put state in the URL once it differs from the present-day
      // default, so plain /lab stays the single URL people copy and link.
      const target = labPath(state.parameters, state.scale);
      if (`${window.location.pathname}${window.location.search}` === target) return;
      router.replace(target, { scroll: false });
    }, 180);
    return () => {
      if (updateTimer.current) clearTimeout(updateTimer.current);
    };
  }, [router, state.parameters, state.scale]);

  const commitReading = () => {
    const delta = reading.deltaFromPresentWm2;
    setAnnouncement(
      `${Math.round(reading.dailyMeanTopOfAtmosphereWm2)} watts per square metre, ${Math.abs(delta).toFixed(0)} ${delta >= 0 ? "more" : "less"} than present. ${getMeltPressureCopy(pressure)}`,
    );
  };

  const shareSetup = async () => {
    const url = `${SITE_URL}${labPath(state.parameters, state.scale)}`;
    try {
      await navigator.clipboard.writeText(url);
      track("lab_share", { method: "clipboard" });
      setShareStatus("Link copied to your clipboard.");
    } catch {
      track("lab_share", { method: "manual" });
      setShareStatus(`Copy this link: ${url}`);
    }
  };

  const delta = reading.deltaFromPresentWm2;
  const fluxContrast =
    (perihelionToAphelionFluxRatio(state.parameters.eccentricity) - 1) * 100;

  return (
    <div className="lab-layout">
      <aside className="lab-scene-column" aria-label="Orbital visualization">
        <div className="lab-scene-panel">
          <SceneLoader
            parameters={state.parameters}
            scale={state.scale}
            chapter="together"
            focus={state.visualFocus}
            reducedMotion={reducedMotion}
          />
          <div className="tour-scene-panel__caption">
            <div>
              <span>Now showing</span>
              <strong>
                {state.visualFocus === "shape"
                  ? "Orbit shape vs today"
                  : state.visualFocus === "tilt"
                    ? "Close-up axis tilt"
                    : state.visualFocus === "direction"
                      ? "Northern summer position"
                      : "Earth · Sun · 65°N"}
              </strong>
            </div>
            <span className="scale-badge">Shape {state.scale === "5x" ? "×5" : "actual"}</span>
          </div>
        </div>
      </aside>

      <div className="lab-panel">
        <header className="lab-header">
          <div><p className="eyebrow">Free Exploration</p><h1>Orbital Lab</h1></div>
          <p>Move one control at a time, compare real orbital milestones, and watch northern summer sunlight respond.</p>
        </header>

        {state.invalidFields.length > 0 ? (
          <div className="inline-notice" role="status">
            <p>Some shared values were invalid and reset to the present reference.</p>
            <button type="button" onClick={() => dispatch({ type: "dismiss-invalid" })}>Dismiss</button>
          </div>
        ) : null}

        <section className="lab-result" aria-labelledby="lab-result-title">
          <div>
            <p className="eyebrow">Classic Northern Ice-Sheet Indicator</p>
            <h2 id="lab-result-title">Northern Summer Sunlight</h2>
            <p>Daily average at 65°N on the summer solstice, at the top of the atmosphere.</p>
          </div>
          <div className="lab-result__reading">
            <strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)}</strong><span>W/m²</span>
          </div>
          <div className="lab-result__delta">
            <span>{Math.abs(delta) < 0.5 ? "Present reference" : `${Math.abs(delta).toFixed(0)} W/m² ${delta > 0 ? "more" : "less"} than present`}</span>
            <strong>{getMeltPressureCopy(pressure)}</strong>
          </div>
          <dl className="lab-result__details">
            <div><dt>Daylight</dt><dd>{reading.daylightHours.toFixed(1)} hours</dd></div>
            <div><dt>Earth–Sun distance</dt><dd>{reading.earthSunDistanceAu.toFixed(3)} AU</dd></div>
            <div><dt>Closest approach</dt><dd>{seasonOfClosestApproach(state.parameters)}</dd></div>
          </dl>
          <p className="lab-result__caveat">This is an orbital tendency, not a forecast of ice-sheet size. Greenhouse gases, oceans, snowfall, existing ice, and long response times also matter.</p>
        </section>

        <section className="lab-section" aria-labelledby="preset-heading">
          <div className="lab-section__heading"><div><p className="eyebrow">Compare Real States</p><h2 id="preset-heading">Validated Milestones</h2></div><span>La2004</span></div>
          <div className="preset-grid">
            {ORBITAL_MILESTONES.map((milestone) => (
              <button
                key={milestone.id}
                type="button"
                aria-pressed={state.selectedPreset === milestone.id}
                onClick={() => {
                  track("lab_preset", { preset: milestone.id });
                  dispatch({ type: "preset", id: milestone.id, parameters: milestone.parameters });
                }}
              >
                <span>{milestone.shortLabel}</span><strong>{milestone.label}</strong><small>{Math.round(milestone.expectedReading.dailyMeanTopOfAtmosphereWm2)} W/m² at 65°N</small>
              </button>
            ))}
          </div>
          {state.selectedPreset ? (
            <p className="preset-description">
              {ORBITAL_MILESTONES.find((item) => item.id === state.selectedPreset)?.description}
            </p>
          ) : null}
        </section>

        <section className="lab-section" aria-labelledby="controls-heading">
          <div className="lab-section__heading"><div><p className="eyebrow">Change the Geometry</p><h2 id="controls-heading">Three Orbital Controls</h2></div><button className="text-button" type="button" onClick={() => dispatch({ type: "reset" })}>Reset All</button></div>

          <LabSlider
            id="lab-eccentricity"
            label="Orbit Shape · Eccentricity"
            value={state.parameters.eccentricity}
            today={PRESENT_PARAMETERS.eccentricity}
            min={0.005}
            max={0.058}
            step={0.0001}
            minLabel="Rounder"
            maxLabel="More elliptical"
            displayValue={state.parameters.eccentricity.toFixed(4)}
            valueText={`${state.parameters.eccentricity.toFixed(4)} eccentricity`}
            onChange={(value) => dispatch({ type: "parameter", key: "eccentricity", value, focus: "shape" })}
            onCommit={commitReading}
            onFocus={() => dispatch({ type: "focus", focus: "shape" })}
          />
          <div className="lab-control__facts"><span>Closest: {perihelionDistanceAu(state.parameters.eccentricity).toFixed(3)} AU</span><span>Farthest: {aphelionDistanceAu(state.parameters.eccentricity).toFixed(3)} AU</span><span>Sunlight contrast: {fluxContrast.toFixed(1)}%</span></div>

          <LabSlider
            id="lab-obliquity"
            label="Axis Tilt · Obliquity"
            value={state.parameters.obliquityDeg}
            today={PRESENT_PARAMETERS.obliquityDeg}
            min={22.1}
            max={24.5}
            step={0.01}
            minLabel="Milder seasons"
            maxLabel="Stronger seasons"
            displayValue={`${state.parameters.obliquityDeg.toFixed(2)}°`}
            valueText={`${state.parameters.obliquityDeg.toFixed(2)} degrees`}
            onChange={(value) => dispatch({ type: "parameter", key: "obliquityDeg", value, focus: "tilt" })}
            onCommit={commitReading}
            onFocus={() => dispatch({ type: "focus", focus: "tilt" })}
          />

          <LabSlider
            id="lab-precession"
            label="Season of Closest Approach · Precession"
            value={state.parameters.earthPerihelionLongitudeDeg}
            today={PRESENT_PARAMETERS.earthPerihelionLongitudeDeg}
            min={0}
            max={359.9}
            step={0.1}
            minLabel="0°"
            maxLabel="360°"
            displayValue={`${state.parameters.earthPerihelionLongitudeDeg.toFixed(1)}°`}
            valueText={`${state.parameters.earthPerihelionLongitudeDeg.toFixed(1)} degrees, ${seasonOfClosestApproach(state.parameters)}`}
            onChange={(value) => dispatch({ type: "parameter", key: "earthPerihelionLongitudeDeg", value, focus: "direction" })}
            onCommit={commitReading}
            onFocus={() => dispatch({ type: "focus", focus: "direction" })}
          />
        </section>

        <section className="lab-actions" aria-label="Lab actions">
          <div><p className="eyebrow">Visual Scale</p><div className="segmented-control"><button type="button" aria-pressed={state.scale === "5x"} onClick={() => dispatch({ type: "scale", scale: "5x" })}>Exaggerated 5×</button><button type="button" aria-pressed={state.scale === "actual"} onClick={() => dispatch({ type: "scale", scale: "actual" })}>Actual Scale</button></div></div>
          <div><p className="eyebrow">Keep This Setup</p><button className="button button--primary" type="button" onClick={shareSetup}>Share This Setup</button></div>
        </section>
        <p className="share-status" aria-live="polite">{shareStatus}</p>
        <p className="sr-only" aria-live="polite">{announcement}</p>
      </div>
    </div>
  );
}
