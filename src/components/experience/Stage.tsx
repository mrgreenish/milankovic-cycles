"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { track } from "@vercel/analytics";
import { formatTemperatureDelta } from "@/lib/orbital/climate";
import { formatSunlightDelta } from "@/lib/orbital/controls";
import { seasonOfClosestApproach } from "@/lib/orbital/geometry";
import { calculateSummerInsolation } from "@/lib/orbital/insolation";
import type {
  OrbitScale,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import { GLOBE_POSTER } from "./globePoster.generated";
import { OrbitalPoster } from "./OrbitalPoster";
import { touchLive, writeLive, type SceneLive } from "./sceneLive";
import type { InsetRect } from "./space/ClimateInset";
import { useMediaQuery } from "./useMediaQuery";

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

/**
 * A rendered frame of the title globe, shown while the 3D scene loads. It is
 * sized and placed like the live Earth, so the scene fades in over it unseen.
 */
function GlobePoster() {
  return (
    <div className="scene-viewport__globe" aria-hidden="true">
      <div
        className="globe-poster"
        style={{ "--globe-ratio": GLOBE_POSTER.ratio } as CSSProperties}
      >
        {/* A fixed, pre-sized sprite: the image optimizer would add nothing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={GLOBE_POSTER.src}
          srcSet={GLOBE_POSTER.srcSet}
          sizes="(max-width: 980px) 64vw, 66vh"
          width={1000}
          height={1000}
          alt=""
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

/** What the climate globe reports: ice against its ice-age peak, and temperature. */
export type ClimateGlobe = { iceShare: number; deltaTempC: number } | null;

const COLD = [133, 199, 242];
const NEUTRAL = [240, 230, 210];
const WARM = [240, 138, 75];

/** Cream at today's temperature, ice blue when colder, amber when warmer. */
function temperatureColor(deltaTempC: number) {
  const [target, share] =
    deltaTempC < 0
      ? [COLD, Math.min(1, -deltaTempC / 5)]
      : [WARM, Math.min(1, deltaTempC / 0.7)];
  const mix = NEUTRAL.map((value, index) =>
    Math.round(value + (target[index] - value) * share),
  );
  return `rgb(${mix.join(" ")})`;
}

function iceCaption(iceShare: number) {
  if (iceShare < -0.02) return "less ice than today";
  const percent = Math.round(iceShare * 100);
  return percent === 0 ? "no ice beyond today’s" : `ice at ${percent}% of its peak`;
}

/** Size and place of the climate globe for the stage it sits in, or null if there is no room. */
function insetFor(
  variant: "tour" | "lab",
  width: number,
  height: number,
): InsetRect | null {
  if (width < 300 || height < 170) return null;
  if (variant === "tour")
    return { size: Math.round(Math.min(250, Math.max(150, width * 0.17))), right: 72, top: 92 };
  return width >= 520
    ? { size: Math.round(Math.min(210, width * 0.3)), right: 14, top: 14 }
    : { size: 88, right: 8, top: 8 };
}

export type StageDrag = {
  hint: string;
  /** Receives each horizontal drag step as a share of the stage width. */
  onDelta: (fraction: number) => void;
} | null;

/** Summer sunlight at 65°N over the last 800,000 years runs from 431 to 552 W/m². */
const GAUGE_MIN = 425;
const GAUGE_MAX = 558;
const gaugePosition = (wm2: number) =>
  Math.min(100, Math.max(0, ((wm2 - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100));

function SunlightHud({
  parameters,
  focus,
}: {
  parameters: OrbitalParameters;
  focus: OrbitalVisualFocus;
}) {
  const reading = calculateSummerInsolation(parameters);
  const today = calculateSummerInsolation({
    ...parameters,
    eccentricity: 0.016702362,
    obliquityDeg: 23.439291,
    earthPerihelionLongitudeDeg: 102.917945,
  });
  const style = {
    "--hud-current": `${gaugePosition(reading.dailyMeanTopOfAtmosphereWm2)}%`,
    "--hud-today": `${gaugePosition(today.dailyMeanTopOfAtmosphereWm2)}%`,
  } as CSSProperties;
  return (
    <div
      className="scene-guide"
      data-focus={focus}
      data-hidden={focus === "hero" ? "true" : "false"}
      style={style}
      aria-hidden="true"
    >
      <p className="scene-guide__label">Midsummer sun · 65°N</p>
      <p className="scene-guide__value">
        <strong>{Math.round(reading.dailyMeanTopOfAtmosphereWm2)}</strong>
        <span>W/m²</span>
        <em>{formatSunlightDelta(reading.deltaFromPresentWm2)}</em>
      </p>
      <div className="scene-guide__track">
        <span className="scene-guide__today-marker" />
        <span className="scene-guide__current-marker" />
      </div>
      <div className="scene-guide__labels">
        <span>Weaker</span>
        <span>Stronger</span>
      </div>
    </div>
  );
}

function describeView(
  focus: OrbitalVisualFocus,
  parameters: OrbitalParameters,
  wm2: number,
) {
  switch (focus) {
    case "shape":
      return `Orbit shape. Eccentricity ${parameters.eccentricity.toFixed(4)}; the grey dashed outline is today's orbit.`;
    case "tilt":
      return `Earth's axis tilted ${parameters.obliquityDeg.toFixed(2)} degrees; the grey dashed line is today's 23.44 degrees.`;
    case "direction":
      return `Earth at northern midsummer. Closest approach to the Sun falls in ${seasonOfClosestApproach(parameters).toLowerCase()}; the grey line marks where summer falls today.`;
    case "idea":
      return `Earth seen from above the north pole with the 65 degree north line marked.`;
    default:
      return `Earth and Sun producing ${Math.round(wm2)} watts per square metre at 65 degrees north in midsummer.`;
  }
}

/** Where the picture's centre sits when text takes the left of a wide screen. */
function useStageShift(enabled: boolean) {
  const [shift, setShift] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const measure = () => {
      const column = document.querySelector<HTMLElement>(".story-column");
      const wide = window.matchMedia("(min-width: 981px)").matches;
      if (!column || !wide) return setShift(0);
      // Centre the picture between the text and the chapter rail.
      const edge = column.getBoundingClientRect().right + 32;
      setShift(Math.min(0.3, Math.max(0, (edge - 72) / (2 * window.innerWidth))));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);
  return shift;
}

export function Stage({
  variant,
  focus,
  parameters,
  scale,
  ice,
  reducedMotion,
  live,
  rate = 7,
  drag = null,
  onScale,
  timeKyr = null,
  iceFollowsClock = false,
  globe = null,
  children,
}: {
  variant: "tour" | "lab";
  focus: OrbitalVisualFocus;
  parameters: OrbitalParameters;
  scale: OrbitScale;
  ice: number;
  reducedMotion: boolean;
  live: SceneLive;
  rate?: number;
  drag?: StageDrag;
  onScale?: (scale: OrbitScale) => void;
  /** The moment shown, so the scene can step through time smoothly; null for a hand-set orbit. */
  timeKyr?: number | null;
  iceFollowsClock?: boolean;
  /** When set, a second small view of Earth from above the pole shows ice and temperature. */
  globe?: ClimateGlobe;
  children?: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setBox({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const inset = useMemo(
    () => (globe ? insetFor(variant, box.width, box.height) : null),
    [globe, variant, box.width, box.height],
  );
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const shift = useStageShift(variant === "tour");
  // The clock's chart takes the lower part of a wide stage, so the picture rises.
  // On a phone the readout and chapter bar cover the top, so the picture drops.
  const compact = useMediaQuery("(max-width: 980px)");
  const shiftY =
    focus === "timeline" && shift > 0
      ? -0.15
      : variant === "tour" && compact && focus !== "hero"
        ? 0.1
        : // The climate globe takes the top corner of the lab's stage.
          variant === "lab" && inset && inset.size > 100
          ? 0.1
          : 0;
  useEffect(() => {
    // A motion-preference change destroys the Canvas; its old readiness must not
    // hide the poster while a fresh renderer and texture bundle are starting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (reducedMotion) setReady(false);
  }, [reducedMotion]);

  const reading = calculateSummerInsolation(parameters);
  const poster = (
    <OrbitalPoster parameters={parameters} scale={scale} focus={focus} />
  );
  const handleFailure = useCallback(() => {
    setFailed(true);
    track("webgl_fallback");
  }, []);
  const handleReady = useCallback(() => setReady(true), []);

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    writeLive(live, {
      x: ((event.clientX - box.left) / box.width) * 2 - 1,
      y: ((event.clientY - box.top) / box.height) * 2 - 1,
    });
    touchLive(live);
    if (dragFrom.current === null || !drag) return;
    const step = event.clientX - dragFrom.current;
    dragFrom.current = event.clientX;
    drag.onDelta(step / box.width);
  };
  const endDrag = () => {
    dragFrom.current = null;
    setDragging(false);
  };

  return (
    <div
      ref={stageRef}
      className={`stage stage--${variant}`}
      data-focus={focus}
      data-hero={focus === "hero" ? "true" : "false"}
    >
      <div
        className="scene-viewport"
        role="img"
        aria-label={describeView(focus, parameters, reading.dailyMeanTopOfAtmosphereWm2)}
        data-ready={ready && !failed && !reducedMotion ? "true" : "false"}
      >
        {variant === "tour" && (focus === "hero" || focus === "idea") ? (
          <GlobePoster />
        ) : (
          <div className="scene-viewport__poster">{poster}</div>
        )}
        {!failed && !reducedMotion ? (
          <SceneErrorBoundary fallback={poster} onFailure={handleFailure}>
            <div className="scene-viewport__canvas">
              <SceneClient
                parameters={parameters}
                scale={scale}
                focus={focus}
                ice={ice}
                timeKyr={timeKyr}
                iceFollowsClock={iceFollowsClock}
                inset={inset}
                stageShift={shift}
                stageShiftY={shiftY}
                rate={rate}
                live={live}
                reducedMotion={reducedMotion}
                motionPaused={motionPaused}
                onReady={handleReady}
                onFailure={handleFailure}
              />
            </div>
          </SceneErrorBoundary>
        ) : null}
      </div>
      <div
        className="stage__drag"
        data-active={drag ? "true" : "false"}
        data-dragging={dragging ? "true" : "false"}
        onPointerDown={(event) => {
          if (!drag || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          dragFrom.current = event.clientX;
          setDragging(true);
        }}
        onPointerMove={move}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          writeLive(live, { x: 0, y: 0 });
          touchLive(live);
        }}
      />
      <SunlightHud parameters={parameters} focus={focus} />
      {inset && globe && ready && !failed && !reducedMotion ? (
        <div
          className="climate-globe"
          style={
            {
              top: inset.top,
              right: inset.right,
              width: inset.size,
              "--temp-color": temperatureColor(globe.deltaTempC),
            } as CSSProperties
          }
          aria-hidden="true"
        >
          <span
            className="climate-globe__ring"
            style={{ height: inset.size }}
          />
          <p className="climate-globe__caption">
            <strong>{formatTemperatureDelta(globe.deltaTempC)}</strong>
            <span>{iceCaption(globe.iceShare)}</span>
          </p>
        </div>
      ) : null}
      <div className="stage__toolbar">
        {drag ? (
          <span className="stage__hint" aria-hidden="true">
            {drag.hint}
          </span>
        ) : null}
        {onScale && focus === "shape" ? (
          <div className="segmented-control" role="group" aria-label="Orbit drawing">
            <button
              type="button"
              aria-pressed={scale === "5x"}
              onClick={() => onScale("5x")}
            >
              Stretched ×5
            </button>
            <button
              type="button"
              aria-pressed={scale === "actual"}
              onClick={() => onScale("actual")}
            >
              True shape
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className="motion-button"
          aria-pressed={motionPaused || reducedMotion}
          disabled={reducedMotion || failed}
          onClick={() => setMotionPaused((paused) => !paused)}
        >
          <span aria-hidden="true">
            {motionPaused || reducedMotion ? "▷" : "Ⅱ"}
          </span>
          {reducedMotion
            ? "Reduced motion"
            : failed
              ? "Static diagram"
              : motionPaused
                ? "Resume motion"
                : "Pause motion"}
        </button>
      </div>
      {children}
    </div>
  );
}
