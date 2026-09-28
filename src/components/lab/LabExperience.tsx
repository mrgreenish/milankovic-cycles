"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import { seasonOfClosestApproach } from "@/lib/orbital/geometry";
import {
  calculateSummerInsolation,
  getMeltPressureCopy,
  getOrbitalMeltPressure,
  PRESENT_PARAMETERS,
} from "@/lib/orbital/insolation";
import {
  ORBITAL_MILESTONES,
  matchingMilestone,
} from "@/lib/orbital/milestones";
import {
  parseLabQuery,
  labPath,
  type ParsedLabQuery,
} from "@/lib/orbital/query";
import {
  ORBITAL_CONTROLS,
  PARAMETER_KEYS,
  formatSunlightDelta,
  sunlightAnnouncement,
  type ParameterKey,
} from "@/lib/orbital/controls";
import { SITE_URL } from "@/lib/site";
import type {
  OrbitScale,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import { SceneLoader } from "@/components/experience/SceneLoader";
import { ParameterControl } from "@/components/experience/ParameterControl";
import { useReducedMotion } from "@/components/experience/useReducedMotion";
import { useStickyLayout } from "@/components/experience/useStickyLayout";

type LabState = ParsedLabQuery & { visualFocus: OrbitalVisualFocus };
type Action =
  | { type: "parameter"; key: ParameterKey; value: number }
  | { type: "preset"; parameters: OrbitalParameters }
  | { type: "reset" }
  | { type: "scale"; scale: OrbitScale }
  | { type: "focus"; focus: OrbitalVisualFocus }
  | { type: "hydrate"; value: ParsedLabQuery }
  | { type: "dismiss-invalid" };
function reducer(state: LabState, action: Action): LabState {
  switch (action.type) {
    case "parameter":
      return {
        ...state,
        parameters: { ...state.parameters, [action.key]: action.value },
        visualFocus: ORBITAL_CONTROLS[action.key].focus,
      };
    case "preset":
      return {
        ...state,
        parameters: { ...action.parameters },
        invalidFields: [],
        visualFocus: "combined",
      };
    case "reset":
      return {
        parameters: { ...PRESENT_PARAMETERS },
        scale: "5x",
        invalidFields: [],
        visualFocus: "combined",
      };
    case "scale":
      return { ...state, scale: action.scale, visualFocus: "shape" };
    case "focus":
      return state.visualFocus === action.focus
        ? state
        : { ...state, visualFocus: action.focus };
    case "hydrate":
      return { ...action.value, visualFocus: "combined" };
    case "dismiss-invalid":
      return { ...state, invalidFields: [] };
  }
}
const controlIds = {
  eccentricity: "lab-eccentricity",
  obliquityDeg: "lab-obliquity",
  earthPerihelionLongitudeDeg: "lab-precession",
};

export function LabExperience() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [state, dispatch] = useReducer(
    reducer,
    searchParams,
    (params): LabState => ({
      ...parseLabQuery(params),
      visualFocus: "combined",
    }),
  );
  const lastUrl = useRef(`/lab${query ? `?${query}` : ""}`);
  const [announcement, setAnnouncement] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [manualLink, setManualLink] = useState("");
  const reducedMotion = useReducedMotion();
  useStickyLayout("lab");
  const reading = useMemo(
    () => calculateSummerInsolation(state.parameters),
    [state.parameters],
  );
  const selectedPreset = matchingMilestone(state.parameters);
  const pressure = getOrbitalMeltPressure(reading.deltaFromPresentWm2);

  useEffect(() => {
    track("lab_entry");
  }, []);
  useEffect(() => {
    const current = `${window.location.pathname}${window.location.search}`;
    // External navigation wins over local edits; our own writes are already recorded.
    if (current !== lastUrl.current) {
      const incoming = parseLabQuery(
        new URLSearchParams(window.location.search),
      );
      const canonical = labPath(incoming.parameters, incoming.scale);
      lastUrl.current = canonical;
      dispatch({ type: "hydrate", value: incoming });
      if (current !== canonical)
        window.history.replaceState(window.history.state, "", canonical);
      return;
    }
    const target = labPath(state.parameters, state.scale);
    if (current !== target) {
      lastUrl.current = target;
      // Native history keeps the URL current without a server navigation per slider tick.
      window.history.replaceState(window.history.state, "", target);
    }
  }, [query, state.parameters, state.scale]);

  const shareSetup = async () => {
    const url = `${SITE_URL}${labPath(state.parameters, state.scale)}`;
    try {
      await navigator.clipboard.writeText(url);
      track("lab_share", { method: "clipboard" });
      setShareStatus("Link copied. It includes your current settings.");
      setManualLink("");
    } catch {
      track("lab_share", { method: "manual" });
      setShareStatus("Select and copy the link below.");
      setManualLink(url);
    }
  };
  const change = (key: ParameterKey, value: number) => {
    dispatch({ type: "parameter", key, value });
    setShareStatus("");
    setManualLink("");
  };

  return (
    <div className="lab-layout">
      <header className="lab-header">
        <div>
          <p className="eyebrow">Try it yourself</p>
          <h1>Orbital lab</h1>
        </div>
        <p>Change an orbit. Watch the sunlight respond.</p>
      </header>
      <aside className="lab-scene-column" aria-label="Orbital visualization">
        <div className="lab-scene-panel">
          <SceneLoader
            parameters={state.parameters}
            scale={state.scale}
            chapter="together"
            focus={state.visualFocus}
            reducedMotion={reducedMotion}
          />
        </div>
      </aside>
      <div className="lab-panel">
        <section className="lab-result" aria-labelledby="lab-result-title">
          <div>
            <h2 id="lab-result-title">
              Summer sunlight <span>at 65°N</span>
            </h2>
            <p>
              {formatSunlightDelta(reading.deltaFromPresentWm2)}{" "}
              <small>· J2000</small>
            </p>
          </div>
          <div className="lab-result__reading">
            <strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)}</strong>
            <span>W/m²</span>
          </div>
        </section>
        {state.invalidFields.length > 0 ? (
          <div className="inline-notice" role="status">
            <p>
              Some shared values were invalid and reset to today’s reference.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: "dismiss-invalid" })}
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <section
          className="lab-section lab-controls"
          aria-labelledby="controls-heading"
        >
          <div className="lab-section__heading">
            <h2 id="controls-heading">Change one thing</h2>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                dispatch({ type: "reset" });
                setAnnouncement(
                  "All settings reset to today. " +
                    sunlightAnnouncement(PRESENT_PARAMETERS),
                );
                setShareStatus("");
                setManualLink("");
              }}
            >
              Reset all
            </button>
          </div>
          {PARAMETER_KEYS.map((parameter) => (
            <ParameterControl
              key={parameter}
              id={controlIds[parameter]}
              parameter={parameter}
              parameters={state.parameters}
              context="lab"
              onChange={(value) => change(parameter, value)}
              onFocus={() =>
                dispatch({
                  type: "focus",
                  focus: ORBITAL_CONTROLS[parameter].focus,
                })
              }
            />
          ))}
        </section>
        <p className="lab-interpretation">{getMeltPressureCopy(pressure)}</p>
        <p className="lab-caveat">
          Sunlight is one influence on ice. Oceans, greenhouse gases, snowfall,
          and existing ice also matter. These settings do not predict
          temperature or ice-sheet size.
        </p>
        <section className="lab-section" aria-labelledby="preset-heading">
          <div className="lab-section__heading">
            <h2 id="preset-heading">Compare different times</h2>
            <Link href="/sources">La2004 data ↗</Link>
          </div>
          <div className="preset-grid">
            {ORBITAL_MILESTONES.map((milestone) => (
              <button
                key={milestone.id}
                type="button"
                aria-pressed={selectedPreset?.id === milestone.id}
                onClick={() => {
                  track("lab_preset", { preset: milestone.id });
                  dispatch({
                    type: "preset",
                    parameters: milestone.parameters,
                  });
                  setAnnouncement(
                    `${milestone.label}. ${sunlightAnnouncement(milestone.parameters)}`,
                  );
                  setShareStatus("");
                  setManualLink("");
                }}
              >
                <span>{milestone.shortLabel}</span>
                <strong>{milestone.label}</strong>
                <small>
                  {Math.round(
                    milestone.expectedReading.dailyMeanTopOfAtmosphereWm2,
                  )}{" "}
                  W/m² at 65°N
                </small>
              </button>
            ))}
          </div>
          <p className="preset-description">
            {selectedPreset?.description ??
              "Your own combination. Choose a date to load all three orbital values."}
          </p>
        </section>
        <details className="science-detail lab-method">
          <summary>How to read the numbers</summary>
          <p>
            The result is daily average sunlight at the top of the atmosphere,
            at 65°N on the northern summer solstice. “Today” uses the J2000
            astronomical reference, for the year 2000.
          </p>
          <dl className="lab-result__details">
            <div>
              <dt>Daylight</dt>
              <dd>{reading.daylightHours.toFixed(1)} hours</dd>
            </div>
            <div>
              <dt>Earth–Sun distance</dt>
              <dd>{reading.earthSunDistanceAu.toFixed(3)} AU</dd>
            </div>
            <div>
              <dt>Closest approach</dt>
              <dd>{seasonOfClosestApproach(state.parameters)}</dd>
            </div>
          </dl>
          <p>
            One astronomical unit (AU) is Earth’s average distance from the Sun.
            The diagram enlarges orbit shape 5× by default; calculations always
            use the real values.
          </p>
          <p>
            Blue outlines compare the active parameter with its reference while
            keeping your other settings fixed. The sunlight difference compares
            your complete setup with all three J2000 values.
          </p>
          <Link href="/sources">Equations, data, and limitations →</Link>
        </details>
        <section className="lab-actions" aria-label="Lab actions">
          <div>
            <p className="eyebrow">Orbit shape</p>
            <div className="segmented-control">
              <button
                type="button"
                aria-pressed={state.scale === "5x"}
                onClick={() => {
                  dispatch({ type: "scale", scale: "5x" });
                  setShareStatus("");
                  setManualLink("");
                }}
              >
                Exaggerated 5×
              </button>
              <button
                type="button"
                aria-pressed={state.scale === "actual"}
                onClick={() => {
                  dispatch({ type: "scale", scale: "actual" });
                  setShareStatus("");
                  setManualLink("");
                }}
              >
                Actual scale
              </button>
            </div>
          </div>
          <div>
            <p className="eyebrow">Save your experiment</p>
            <button
              className="button button--primary"
              type="button"
              onClick={shareSetup}
            >
              Copy link to this setup <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
        <p className="share-status" aria-live="polite">
          {shareStatus}
        </p>
        {manualLink ? (
          <div className="manual-share">
            <label htmlFor="share-url">Link to your settings</label>
            <input
              id="share-url"
              name="setup-url"
              autoComplete="off"
              spellCheck={false}
              type="url"
              readOnly
              value={manualLink}
              onFocus={(event) => event.target.select()}
            />
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite" role="status">
          {announcement}
        </p>
      </div>
    </div>
  );
}
