"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";
import {
  PREINDUSTRIAL_GLOBAL_C,
  averageTemperatureC,
  climateAt,
  describeClimate,
  formatTemperatureDelta,
  LGM_COOLING_C,
} from "@/lib/orbital/climate";
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
import {
  displayedTime,
  orbitalReducer,
  type OrbitalAction,
  type OrbitalState,
} from "@/lib/orbital/state";
import { iceIndexAt } from "@/lib/orbital/timeline";
import { SITE_URL } from "@/lib/site";
import type { OrbitScale, OrbitalVisualFocus } from "@/lib/orbital/types";
import { Stage } from "@/components/experience/Stage";
import { ParameterControl } from "@/components/experience/ParameterControl";
import { usePlayer, type Playing } from "@/components/experience/usePlayer";
import { useReducedMotion } from "@/components/experience/useReducedMotion";
import { useStickyLayout } from "@/components/experience/useStickyLayout";
import { stageDragFor } from "@/components/experience/stageDrag";
import {
  initialLive,
  touchLive,
  writeLive,
} from "@/components/experience/sceneLive";

const Timeline = dynamic(
  () => import("@/components/experience/Timeline").then((m) => m.Timeline),
  { ssr: false, loading: () => null },
);

type LabState = OrbitalState & {
  invalidFields: string[];
  visualFocus: OrbitalVisualFocus;
};
type Action =
  | OrbitalAction
  | { type: "focus"; focus: OrbitalVisualFocus }
  | { type: "hydrate"; value: ParsedLabQuery }
  | { type: "dismiss-invalid" };

function fromQuery(value: ParsedLabQuery): LabState {
  return {
    parameters: value.parameters,
    timeKyr: value.timeKyr,
    scale: value.scale,
    ice: value.timeKyr === null ? 0 : (iceIndexAt(value.timeKyr) ?? 0),
    invalidFields: value.invalidFields,
    visualFocus: value.timeKyr === null ? "combined" : "timeline",
  };
}

function reducer(state: LabState, action: Action): LabState {
  switch (action.type) {
    case "focus":
      return state.visualFocus === action.focus
        ? state
        : { ...state, visualFocus: action.focus };
    case "hydrate":
      return fromQuery(action.value);
    case "dismiss-invalid":
      return { ...state, invalidFields: [] };
    case "reset":
      return {
        ...state,
        ...orbitalReducer(state, action),
        scale: "5x",
        invalidFields: [],
        visualFocus: "combined",
      };
    case "parameter":
    case "nudge":
      return {
        ...state,
        ...orbitalReducer(state, action),
        visualFocus:
          action.type === "parameter" || action.type === "nudge"
            ? ORBITAL_CONTROLS[action.key].focus
            : state.visualFocus,
      };
    case "time":
    case "timeNudge":
      return {
        ...state,
        ...orbitalReducer(state, action),
        invalidFields: [],
        visualFocus: "timeline",
      };
    case "scale":
      return {
        ...state,
        ...orbitalReducer(state, action),
        visualFocus: "shape",
      };
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
    (params): LabState => fromQuery(parseLabQuery(params)),
  );
  const lastUrl = useRef(`/lab${query ? `?${query}` : ""}`);
  const lastWrite = useRef(0);
  const [announcement, setAnnouncement] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [manualLink, setManualLink] = useState("");
  const [playing, setPlaying] = useState<Playing>(null);
  const live = useRef({ ...initialLive });
  const reducedMotion = useReducedMotion();
  useStickyLayout("lab");
  const reading = useMemo(
    () => calculateSummerInsolation(state.parameters),
    [state.parameters],
  );
  const selectedPreset = matchingMilestone(state.parameters);
  const pressure = getOrbitalMeltPressure(reading.deltaFromPresentWm2);
  const time = displayedTime(state);

  const timeRef = useRef(state.timeKyr);
  useEffect(() => {
    timeRef.current = state.timeKyr;
  }, [state.timeKyr]);
  const stop = useCallback(() => setPlaying(null), []);
  usePlayer(playing, dispatch, () => timeRef.current, stop);

  useEffect(() => {
    track("lab_entry");
  }, []);
  useEffect(() => {
    // Playing changes the orbit thirty times a second; the URL waits for it to stop.
    if (playing) return;
    const current = `${window.location.pathname}${window.location.search}`;
    // External navigation wins over local edits; our own writes are already recorded.
    if (current !== lastUrl.current) {
      const incoming = parseLabQuery(
        new URLSearchParams(window.location.search),
      );
      const canonical = labPath(
        incoming.parameters,
        incoming.scale,
        incoming.timeKyr,
      );
      lastUrl.current = canonical;
      dispatch({ type: "hydrate", value: incoming });
      if (current !== canonical)
        window.history.replaceState(window.history.state, "", canonical);
      return;
    }
    const target = labPath(state.parameters, state.scale, state.timeKyr);
    if (current === target) return;
    const write = () => {
      lastUrl.current = target;
      lastWrite.current = performance.now();
      // Native history keeps the URL current without a server navigation.
      window.history.replaceState(window.history.state, "", target);
    };
    // A click writes at once. A dragged slider writes about three times a
    // second, which keeps it under the browsers' history-call limits.
    const wait = lastWrite.current + 300 - performance.now();
    if (wait <= 0) return write();
    const timer = window.setTimeout(write, wait);
    return () => window.clearTimeout(timer);
  }, [query, state.parameters, state.scale, state.timeKyr, playing]);

  const shareSetup = async () => {
    const url = `${SITE_URL}${labPath(state.parameters, state.scale, state.timeKyr)}`;
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
  const clearShare = () => {
    setShareStatus("");
    setManualLink("");
  };
  const change = (key: ParameterKey, value: number) => {
    setPlaying(null);
    dispatch({ type: "parameter", key, value });
    clearShare();
  };
  const goToTime = (kyr: number) => {
    setPlaying(null);
    dispatch({ type: "time", kyr });
    clearShare();
  };
  const nudgeParameter = useCallback((key: ParameterKey, delta: number) => {
    setPlaying(null);
    dispatch({ type: "nudge", key, delta });
  }, []);
  const nudgeTime = useCallback((delta: number) => {
    setPlaying(null);
    dispatch({ type: "timeNudge", delta });
  }, []);
  const drag = useMemo(
    () => stageDragFor(state.visualFocus, { nudgeParameter, nudgeTime }),
    [state.visualFocus, nudgeParameter, nudgeTime],
  );
  const climate = useMemo(
    () => climateAt(state.timeKyr, state.parameters),
    [state.timeKyr, state.parameters],
  );
  const clockPlaying = playing?.kind === "time";
  // The gauge runs from a little past the last ice age to a little past the warmest estimate.
  const gaugeMin = -(LGM_COOLING_C + 0.4);
  const gaugeSpan = 1.6 - gaugeMin;
  const thermometer =
    Math.min(1, Math.max(0, (climate.deltaTempC - gaugeMin) / gaugeSpan)) * 100;
  const todayMark = (-gaugeMin / gaugeSpan) * 100;

  return (
    <div className="lab-layout">
      <header className="lab-header">
        <div>
          <p className="eyebrow">Try it yourself</p>
          <h1>Orbital lab</h1>
        </div>
        <p>Change the orbit and watch midsummer sunlight at 65°N respond.</p>
      </header>
      <aside className="lab-stage" aria-label="Orbital visualization">
        <Stage
          variant="lab"
          focus={state.visualFocus}
          parameters={state.parameters}
          scale={state.scale}
          ice={climate.iceShare}
          timeKyr={state.timeKyr}
          iceFollowsClock
          globe={{ iceShare: climate.iceShare, deltaTempC: climate.deltaTempC }}
          reducedMotion={reducedMotion}
          live={live}
          rate={playing ? 20 : 7}
          drag={drag}
        />
      </aside>
      <div className="lab-panel">
        <section className="lab-result" aria-labelledby="lab-result-title">
          <div className="lab-reading">
            <h2 id="lab-result-title">
              Midsummer sunlight <span>at 65°N</span>
            </h2>
            <p className="lab-result__reading">
              <strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)}</strong>
              <span>W/m²</span>
            </p>
            <p className="lab-reading__note">
              {formatSunlightDelta(reading.deltaFromPresentWm2)}{" "}
              <small>· J2000</small>
            </p>
          </div>
          <div
            className="lab-reading lab-reading--temperature"
            data-trend={
              climate.deltaTempC < -0.15
                ? "cold"
                : climate.deltaTempC > 0.15
                  ? "warm"
                  : "even"
            }
          >
            <h2>
              Global temperature <span>estimate</span>
            </h2>
            <p className="lab-result__temperature" data-source={climate.source}>
              <strong>{formatTemperatureDelta(climate.deltaTempC)}</strong>
            </p>
            <p className="lab-reading__note">
              about {averageTemperatureC(climate.deltaTempC)} °C average
            </p>
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
            <h2 id="controls-heading">The three motions</h2>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setPlaying(null);
                dispatch({ type: "reset" });
                setAnnouncement(
                  "All settings reset to today. " +
                    sunlightAnnouncement(PRESENT_PARAMETERS),
                );
                clearShare();
              }}
            >
              Reset all
            </button>
          </div>
          {PARAMETER_KEYS.map((parameter) => {
            const isPlaying =
              playing?.kind === "cycle" && playing.key === parameter;
            return (
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
                playing={isPlaying}
                onTogglePlay={() =>
                  setPlaying(isPlaying ? null : { kind: "cycle", key: parameter })
                }
              />
            );
          })}
        </section>
        <section className="lab-section lab-climate" aria-labelledby="climate-heading">
          <h2 id="climate-heading">What it does to the climate</h2>
          <p className="lab-climate__estimate" aria-live="polite">
            {describeClimate(climate, state.timeKyr)}
          </p>
          <div
            className="temp-gauge"
            style={
              {
                "--temp-position": `${thermometer}%`,
                "--temp-today": `${todayMark}%`,
              } as CSSProperties
            }
            aria-hidden="true"
          >
            <span className="temp-gauge__marker" />
            <span className="temp-gauge__today" />
            <div className="temp-gauge__labels">
              <span>Last ice age −{LGM_COOLING_C} °C</span>
              <span>Before industry, about {PREINDUSTRIAL_GLOBAL_C} °C</span>
            </div>
          </div>
          <p className="lab-interpretation">{getMeltPressureCopy(pressure)}</p>
          <p className="lab-caveat">
            A rough, orbit-only estimate, not a forecast. Ice and temperature
            move together in the sea-floor record, and a world at the last ice
            age was about {LGM_COOLING_C} °C colder (Tierney et al., 2020). For
            a hand-set orbit it assumes the orbit lasts about 15,000 years.
            Real ice also depends on carbon dioxide, oceans and the ice already
            there, and today’s actual temperature is about 1.2 °C above this
            baseline because of greenhouse gases.
          </p>
        </section>
        <section className="lab-section lab-time" aria-labelledby="preset-heading">
          <div className="lab-section__heading">
            <h2 id="preset-heading">Travel in time</h2>
            <Link href="/sources">La2004 data ↗</Link>
          </div>
          <Timeline
            variant="inline"
            parameters={state.parameters}
            timeKyr={time}
            onTime={goToTime}
            onScrub={(kyr) => {
              writeLive(live, { scrub: kyr });
              touchLive(live);
            }}
            playing={clockPlaying}
            onTogglePlay={() => setPlaying(clockPlaying ? null : { kind: "time" })}
          />
          <div className="preset-grid">
            {ORBITAL_MILESTONES.map((milestone) => (
              <button
                key={milestone.id}
                type="button"
                aria-pressed={selectedPreset?.id === milestone.id}
                onClick={() => {
                  track("lab_preset", { preset: milestone.id });
                  goToTime(milestone.kyrFromJ2000);
                  setAnnouncement(
                    `${milestone.label}. ${sunlightAnnouncement(milestone.parameters)}`,
                  );
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
              "Your own combination. Pick a date, or drag the clock, to load all three orbital values for that time."}
          </p>
        </section>
        <details className="science-detail lab-method">
          <summary>How to read the numbers</summary>
          <p>
            The result is the daily average of sunlight at the top of the
            atmosphere, at 65°N on the northern summer solstice. “Today” is
            the J2000 astronomical reference, for the year 2000.
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
            One astronomical unit (AU) is Earth’s average distance from the
            Sun. The drawing stretches orbit shape five times by default; the
            calculation always uses the real value. The dashed grey outlines
            show today’s value for the part you are changing.
          </p>
          <Link href="/sources">Equations, data and limits →</Link>
        </details>
        <section className="lab-actions" aria-label="Lab actions">
          <div>
            <p className="eyebrow">Orbit drawing</p>
            <div className="segmented-control">
              <button
                type="button"
                aria-pressed={state.scale === "5x"}
                onClick={() => {
                  dispatch({ type: "scale", scale: "5x" satisfies OrbitScale });
                  clearShare();
                }}
              >
                Stretched ×5
              </button>
              <button
                type="button"
                aria-pressed={state.scale === "actual"}
                onClick={() => {
                  dispatch({ type: "scale", scale: "actual" });
                  clearShare();
                }}
              >
                True shape
              </button>
            </div>
          </div>
          <div>
            <p className="eyebrow">Share</p>
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
