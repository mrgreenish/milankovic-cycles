"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useThree, type RootState } from "@react-three/fiber";
import {
  animationDelta,
  assessQuality,
  initialQuality,
  QUALITY,
  type GraphicsQuality,
} from "./quality";

// Optional automation hook, never surfaced in the UI or persisted in shared URLs.
declare global {
  interface Window {
    __ORBITAL_SCENE_TEST__?: { time?: number; quality?: GraphicsQuality };
  }
}

const QualityContext = createContext<GraphicsQuality>("medium");
export const useGraphicsQuality = () => useContext(QualityContext);
export const animationTime = (elapsed: number) =>
  window.__ORBITAL_SCENE_TEST__?.time ?? elapsed;

export function SceneRuntime({
  children,
  ready,
  onReady,
  onFailure,
  quality,
  onQualityChange,
}: {
  children: ReactNode;
  ready: boolean;
  onReady?: () => void;
  onFailure?: () => void;
  quality: GraphicsQuality;
  onQualityChange: (quality: GraphicsQuality) => void;
}) {
  const get = useThree((state) => state.get);
  const callbacks = useRef({ ready, onReady, onFailure });
  useEffect(() => {
    callbacks.current = { ready, onReady, onFailure };
  }, [ready, onReady, onFailure]);

  useEffect(
    () => runRenderer(get(), callbacks, onQualityChange),
    [get, onQualityChange],
  );
  return (
    <QualityContext.Provider value={quality}>
      {children}
    </QualityContext.Provider>
  );
}

// Imperative renderer ownership is deliberately outside React's render phase.
function runRenderer(
  { gl, advance, setDpr, clock }: RootState,
  callbacks: RefObject<{
    ready: boolean;
    onReady?: () => void;
    onFailure?: () => void;
  }>,
  setQuality: (quality: GraphicsQuality) => void,
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
  let history = initialQuality();
  let warmupUntil = performance.now() + 4000;
  let failed = false;

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
    const interval = 1000 / QUALITY[activeQuality].fps;
    // Measure RAF cadence even at the 30 fps render cap, so low can recover.
    if (lastTick && now > warmupUntil) {
      tickTotal += now - lastTick;
      tickCount++;
    }
    lastTick = now;
    if (!lastRender || now - lastRender >= interval - 1) {
      elapsed += animationDelta(
        lastRender ? (now - lastRender) / 1000 : 1 / 60,
      );
      lastRender = now;
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
        !test?.quality &&
        now > warmupUntil &&
        tickCount &&
        renderCount
      ) {
        const next = assessQuality(
          history,
          tickTotal / tickCount,
          renderTotal / renderCount,
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
