"use client";
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { StorySection } from "./StorySection";
import { ParameterCard } from "./playground/ParameterCard";
import { TemperaturePod } from "./playground/TemperaturePod";
import { EraRibbon } from "./playground/EraRibbon";
import { MissionChip } from "./playground/MissionChip";
import { ERAS } from "@/lib/eraLookup";
import {
  describeEccentricity,
  describeTilt,
  describePrecession,
  formatEccentricity,
  formatTilt,
  formatPrecession,
  TODAY_ECC,
  TODAY_TILT,
  TODAY_PREC,
} from "@/lib/parameterCopy";

const GlobalTemperatureGraph = lazy(() =>
  import("@/components/GlobalTemperatureGraph").then((mod) => ({
    default: mod.GlobalTemperatureGraph,
  }))
);

const STICKY_MS = 1200;

export function PlaygroundSection({
  eccentricity,
  axialTilt,
  precession,
  temperature,
  iceFactor,
  onEccentricityChange,
  onAxialTiltChange,
  onPrecessionChange,
  simulatedYear,
  co2Level,
  displayedTemp,
  formatNumber,
  onInView,
  focusedParam,
  onFocusParamChange,
  onSnapshot,
}) {
  const [activeEraKey, setActiveEraKey] = useState("today");
  const [showGraph, setShowGraph] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);
  const hasInitialized = useRef(false);
  const animRef = useRef(null);
  const stickyTimer = useRef(null);
  const snapshotTimer = useRef(null);

  const handleInView = (id) => {
    onInView(id);
    setShowGraph(true);
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      onEccentricityChange(TODAY_ECC);
      onAxialTiltChange(TODAY_TILT);
      onPrecessionChange(TODAY_PREC);
    }
  };

  const cancelAnim = () => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  };

  const applyEra = (key) => {
    cancelAnim();
    const target = ERAS[key];
    const startEcc = eccentricity;
    const startTilt = axialTilt;
    const startPrec = precession;
    const startPrecWrapped =
      Math.abs(target.precession - startPrec) > 180
        ? target.precession > startPrec
          ? startPrec + 360
          : startPrec - 360
        : startPrec;
    const duration = 800;
    const startTime = performance.now();
    setActiveEraKey(key);

    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      onEccentricityChange(startEcc + (target.eccentricity - startEcc) * ease);
      onAxialTiltChange(startTilt + (target.axialTilt - startTilt) * ease);
      const nextPrec =
        startPrecWrapped + (target.precession - startPrecWrapped) * ease;
      onPrecessionChange(((nextPrec % 360) + 360) % 360);
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(tick);
  };

  const resetToToday = () => applyEra("today");

  useEffect(() => {
    return () => {
      cancelAnim();
      clearTimeout(stickyTimer.current);
      clearTimeout(snapshotTimer.current);
    };
  }, []);

  const handleEccentricityInput = useCallback(
    (v) => {
      cancelAnim();
      onEccentricityChange(v);
      setActiveEraKey(null);
    },
    [onEccentricityChange]
  );
  const handleAxialTiltInput = useCallback(
    (v) => {
      cancelAnim();
      onAxialTiltChange(v);
      setActiveEraKey(null);
    },
    [onAxialTiltChange]
  );
  const handlePrecessionInput = useCallback(
    (v) => {
      cancelAnim();
      onPrecessionChange(v);
      setActiveEraKey(null);
    },
    [onPrecessionChange]
  );

  const focusParam = (key) => {
    clearTimeout(stickyTimer.current);
    onFocusParamChange?.(key);
  };

  const blurParam = () => {
    clearTimeout(stickyTimer.current);
    stickyTimer.current = setTimeout(() => {
      onFocusParamChange?.(null);
    }, STICKY_MS);
  };

  const handleSnapshot = () => {
    onSnapshot?.({
      temperature,
      eccentricity,
      axialTilt,
      precession,
      eraKey: activeEraKey,
    });
    setSnapshotSaved(true);
    clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => setSnapshotSaved(false), 2500);
  };

  const params = { eccentricity, axialTilt, precession };

  return (
    <StorySection id={6} onInView={handleInView} className="!items-end pb-0 md:pb-10">
      <div className="w-full px-0 md:pl-[42%] md:px-4 md:pr-10">
        {/* On mobile this is a bottom sheet capped at ~55vh so the 3D scene
            stays visible while sliders are dragged; desktop keeps the panel */}
        <div className="observatory-panel p-4 md:p-5 space-y-3 md:space-y-4 w-full md:max-w-xl md:ml-auto max-md:max-h-[55vh] max-md:overflow-y-auto max-md:overscroll-contain max-md:rounded-b-none max-md:rounded-t-2xl">
          {/* Sticky readout: handle, header, mission, temperature stay visible
              while the control list scrolls underneath on mobile */}
          <div className="max-md:sticky max-md:top-0 max-md:z-10 max-md:-mx-4 max-md:-mt-4 max-md:px-4 max-md:pt-2 max-md:pb-3 max-md:bg-deep-space/95 max-md:backdrop-blur-sm space-y-3">
            <div
              className="md:hidden mx-auto h-1 w-10 rounded-full bg-stardust-white/25"
              aria-hidden="true"
            />
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl leading-tight">
                  Conduct the Climate
                </h2>
                <p className="text-xs text-stardust-white/60 leading-snug mt-1">
                  Move one dial at a time to feel its fingerprint on Earth's
                  climate — then play them together.
                </p>
              </div>
              <button
                onClick={resetToToday}
                className="celestial-button text-xs py-1 px-2.5 whitespace-nowrap shrink-0"
                title="Reset to today's values"
              >
                Reset ↻
              </button>
            </header>

            <div className="flex flex-wrap items-center gap-2">
              <MissionChip temperature={temperature} />
            </div>

            <TemperaturePod
              temperature={temperature}
              iceFactor={iceFactor}
              eccentricity={eccentricity}
              axialTilt={axialTilt}
              precession={precession}
              focusedParam={focusedParam}
            />
          </div>

          <EraRibbon
            params={params}
            activeKey={activeEraKey}
            onSelect={applyEra}
          />

          <div className="space-y-2.5">
            <ParameterCard
              kind="stretch"
              label="Stretch"
              scienceName="Eccentricity"
              value={eccentricity}
              onChange={handleEccentricityInput}
              min={0.005}
              max={0.058}
              step={0.001}
              todayValue={TODAY_ECC}
              formatValue={formatEccentricity}
              describe={describeEccentricity}
              focused={focusedParam === "eccentricity"}
              anyFocused={focusedParam !== null}
              onFocus={() => focusParam("eccentricity")}
              onBlur={blurParam}
            />
            <ParameterCard
              kind="lean"
              label="Lean"
              scienceName="Obliquity"
              value={axialTilt}
              onChange={handleAxialTiltInput}
              min={22.1}
              max={24.5}
              step={0.1}
              todayValue={TODAY_TILT}
              formatValue={formatTilt}
              describe={describeTilt}
              focused={focusedParam === "axialTilt"}
              anyFocused={focusedParam !== null}
              onFocus={() => focusParam("axialTilt")}
              onBlur={blurParam}
            />
            <ParameterCard
              kind="wobble"
              label="Wobble"
              scienceName="Precession"
              value={precession}
              onChange={handlePrecessionInput}
              min={0}
              max={360}
              step={1}
              todayValue={TODAY_PREC}
              formatValue={formatPrecession}
              describe={describePrecession}
              focused={focusedParam === "precession"}
              anyFocused={focusedParam !== null}
              onFocus={() => focusParam("precession")}
              onBlur={blurParam}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-blue/20">
            <button
              onClick={() => setGraphOpen((v) => !v)}
              className="text-xs text-stardust-white/70 hover:text-pale-gold transition-colors"
              aria-expanded={graphOpen}
            >
              {graphOpen ? "▾ Hide" : "▸ Show"} 200-year history
            </button>
            <button
              onClick={handleSnapshot}
              className="celestial-button text-xs py-1 px-2.5"
            >
              {snapshotSaved ? "Saved ✓" : "Name this climate →"}
            </button>
          </div>
          <p
            className={`text-xs text-pale-gold text-right transition-opacity duration-300 ${
              snapshotSaved ? "opacity-90" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {snapshotSaved
              ? "Your climate is saved — you'll see it again at the end ↓"
              : " "}
          </p>

          {graphOpen && showGraph && (
            <div className="pt-1">
              <Suspense
                fallback={
                  <div className="w-full h-[180px] flex items-center justify-center text-stardust-white/40 text-xs">
                    Loading graph…
                  </div>
                }
              >
                <GlobalTemperatureGraph
                  axialTilt={axialTilt}
                  eccentricity={eccentricity}
                  precession={precession}
                  temperature={displayedTemp}
                  iceFactor={iceFactor}
                  co2Level={co2Level}
                  simulatedYear={simulatedYear}
                  formatNumber={formatNumber}
                  style={{ width: "100%", height: "180px" }}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </StorySection>
  );
}
