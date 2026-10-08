"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useThree, type RootState } from "@react-three/fiber";
import type { WebGLRenderer } from "three";
import type { SceneLive } from "../sceneLive";
import {
  IDLE_FPS,
  QUALITY,
  animationDelta,
  assessQuality,
  initialQuality,
  refreshInterval,
  type DeviceHints,
  type GraphicsQuality,
} from "./quality";

// Optional automation hook, never surfaced in the UI or persisted in shared URLs.
declare global {
  interface Window {
    __ORBITAL_SCENE_TEST__?: {
      time?: number;
      quality?: GraphicsQuality;
      /** Called with the scene's eased frame on every update; for tests and profiling. */
      probe?: (frame: unknown) => void;
    };
  }
}

const AmbientTimeContext = createContext<{ current: number }>({ current: 0 });
export const useAmbientTime = () => useContext(AmbientTimeContext);

const QualityContext = createContext<GraphicsQuality>("medium");
export const useGraphicsQuality = () => useContext(QualityContext);
export const animationTime = (elapsed: number) =>
  window.__ORBITAL_SCENE_TEST__?.time ?? elapsed;

/**
 * Until this time (a `performance.now()` stamp) the scene renders at its full
 * frame rate. Past it, with nothing moving, it drops to the idle rate.
 */
type Activity = { current: number };
const ActivityContext = createContext<Activity>({ current: 0 });
export const useSceneActivity = () => useContext(ActivityContext);
export function wakeScene(activity: Activity, ms: number) {
  const until = performance.now() + ms;
  if (until > activity.current) activity.current = until;
}

function deviceHints(gl: WebGLRenderer): DeviceHints {
  const nav = navigator as Navigator & { deviceMemory?: number };
  let software = false;
  try {
    const context = gl.getContext();
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const name = info ? String(context.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    software = /swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch {
    // Some browsers hide the renderer name; treat that as a normal GPU.
  }
  return {
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    memoryGb: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    software,
  };
}

export function SceneRuntime({
  children,
  ready,
  onReady,
  onFailure,
  quality,
  motionPaused = false,
  onQualityChange,
  live,
}: {
  children: ReactNode;
  ready: boolean;
  onReady?: () => void;
  onFailure?: () => void;
  quality: GraphicsQuality;
  motionPaused?: boolean;
  onQualityChange: (quality: GraphicsQuality) => void;
  live?: SceneLive;
}) {
  const get = useThree((state) => state.get);
  const ambientTime = useMemo(() => ({ current: 0 }), []);
  const activity = useMemo<Activity>(() => ({ current: 0 }), []);
  const callbacks = useRef({ ready, onReady, onFailure, motionPaused });
  useEffect(() => {
    callbacks.current = { ready, onReady, onFailure, motionPaused };
  }, [ready, onReady, onFailure, motionPaused]);

  useEffect(
    () => runRenderer(get(), callbacks, onQualityChange, ambientTime, activity, live),
    [get, onQualityChange, ambientTime, activity, live],
  );
  return (
    <QualityContext.Provider value={quality}>
      <AmbientTimeContext.Provider value={ambientTime}>
        <ActivityContext.Provider value={activity}>
          {children}
        </ActivityContext.Provider>
      </AmbientTimeContext.Provider>
    </QualityContext.Provider>
  );
}

// Imperative renderer ownership is deliberately outside React's render phase.
function runRenderer(
  { gl, advance, setDpr, clock }: RootState,
  callbacks: RefObject<{
    ready: boolean;
    motionPaused: boolean;
    onReady?: () => void;
    onFailure?: () => void;
  }>,
  setQuality: (quality: GraphicsQuality) => void,
  ambientTime: { current: number },
  activity: Activity,
  live: SceneLive | undefined,
) {
  const canvas = gl.domElement;
  let inView = false;
  let frame = 0;
  let lastTick = 0;
  let lastRender = 0;
  let elapsed = clock.elapsedTime;
  let frameCount = 0;
  let sampleStart = 0;
  let tickTotal = 0;
  let tickCount = 0;
  let renderTotal = 0;
  let renderCount = 0;
  let announced = false;
  let history = initialQuality(deviceHints(gl));
  let warmupUntil = performance.now() + 4000;
  let failed = false;
  // The display's own rhythm, learned from the first frames while the scene is
  // still light. Slowness is judged against it, so a screen that is capped at
  // 30 Hz (power saving, remote desktop) is not mistaken for a struggling GPU.
  const gaps: number[] = [];
  let skipped = 0;
  let calibrated = false;
  let refreshMs = 1000 / 60;
  let width = 0;
  let height = 0;

  function applyQuality(next: GraphicsQuality) {
    setQuality(next);
    setDpr(Math.min(window.devicePixelRatio || 1, QUALITY[next].dpr));
    canvas.dataset.quality = next;
  }
  applyQuality(window.__ORBITAL_SCENE_TEST__?.quality ?? history.quality);

  function fail() {
    failed = true;
    cancelAnimationFrame(frame);
    callbacks.current.onFailure?.();
  }
  const previousShaderError = gl.debug.onShaderError;
  gl.debug.onShaderError = (context, program, vertex, fragment) => {
    console.error(
      "Orbital shader failed",
      context.getProgramInfoLog(program),
      context.getShaderInfoLog(vertex),
      context.getShaderInfoLog(fragment),
    );
    fail();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    fail();
  };
  canvas.addEventListener("webglcontextlost", contextLost);

  function tick(now: number) {
    if (!inView || document.hidden || failed) return;
    const test = window.__ORBITAL_SCENE_TEST__;
    const activeQuality = test?.quality ?? history.quality;
    if (canvas.dataset.quality !== activeQuality) applyQuality(activeQuality);
    if (lastTick) {
      const gap = now - lastTick;
      if (!calibrated) {
        if (++skipped > 8) gaps.push(gap);
        if (gaps.length >= 90) {
          refreshMs = refreshInterval(gaps);
          calibrated = true;
          canvas.dataset.refreshMs = refreshMs.toFixed(1);
        }
      }
      // Measure RAF cadence even when rendering is capped, so a tier can recover.
      if (now > warmupUntil) {
        tickTotal += gap;
        tickCount++;
      }
    }
    lastTick = now;

    // Full rate while something moves or the visitor is interacting; otherwise
    // the slow ambient motion (a turning Earth, drifting clouds) needs only 30.
    const busy =
      now < activity.current || (live ? now - live.current.stamp < 700 : false);
    const cap = QUALITY[activeQuality].fps;
    const resting = callbacks.current.motionPaused ? 2 : IDLE_FPS;
    const interval = 1000 / (busy ? cap : Math.min(cap, resting));
    // A resized canvas is blank until it is drawn again.
    const resized = canvas.width !== width || canvas.height !== height;
    if (!lastRender || resized || now - lastRender >= interval - 1) {
      const step = animationDelta(
        lastRender ? (now - lastRender) / 1000 : 1 / 60,
      );
      elapsed += step;
      // The scene holds still until it can be seen, so its first frame matches
      // the loading placeholder.
      if (!callbacks.current.motionPaused && callbacks.current.ready)
        ambientTime.current += step;
      canvas.dataset.motion = callbacks.current.motionPaused
        ? "paused"
        : "running";
      canvas.dataset.ambientTime = ambientTime.current.toFixed(3);
      canvas.dataset.pace = busy ? "full" : "idle";
      lastRender = now;
      width = canvas.width;
      height = canvas.height;
      const start = performance.now();
      try {
        advance(elapsed, true);
      } catch {
        fail();
        return;
      }
      if (failed) return;
      const cost = performance.now() - start;
      renderTotal += cost;
      renderCount++;
      frameCount++;
      if (!announced && callbacks.current.ready) {
        announced = true;
        callbacks.current.onReady?.();
      }
    }
    if (now - sampleStart >= 2000) {
      if (
        announced &&
        calibrated &&
        !test?.quality &&
        now > warmupUntil &&
        tickCount &&
        renderCount
      ) {
        const next = assessQuality(
          history,
          tickTotal / tickCount,
          renderTotal / renderCount,
          refreshMs,
        );
        if (next.quality !== history.quality) {
          applyQuality(next.quality);
          warmupUntil = now + 4000;
        }
        history = next;
      }
      canvas.dataset.frames = String(frameCount);
      canvas.dataset.fps = (
        renderCount / Math.max(0.001, (now - sampleStart) / 1000)
      ).toFixed(1);
      canvas.dataset.rafMs = tickCount
        ? (tickTotal / tickCount).toFixed(2)
        : "warming";
      canvas.dataset.renderMs = renderCount
        ? (renderTotal / renderCount).toFixed(2)
        : "0";
      canvas.dataset.drawCalls = String(gl.info.render.calls);
      canvas.dataset.triangles = String(gl.info.render.triangles);
      canvas.dataset.textures = String(gl.info.memory.textures);
      canvas.dataset.geometries = String(gl.info.memory.geometries);
      sampleStart = now;
      tickTotal = tickCount = renderTotal = renderCount = 0;
    }
    frame = requestAnimationFrame(tick);
  }

  function syncVisibility() {
    cancelAnimationFrame(frame);
    lastTick = lastRender = 0;
    tickTotal = tickCount = renderTotal = renderCount = 0;
    sampleStart = performance.now();
    warmupUntil = sampleStart + 3000;
    history.slowWindows = history.fastWindows = 0;
    const active = inView && !document.hidden && !failed;
    canvas.dataset.animation = active ? "running" : "paused";
    if (active) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      syncVisibility();
    },
    { threshold: 0 },
  );
  observer.observe(canvas);
  document.addEventListener("visibilitychange", syncVisibility);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", syncVisibility);
    canvas.removeEventListener("webglcontextlost", contextLost);
    gl.debug.onShaderError = previousShaderError;
  };
}
