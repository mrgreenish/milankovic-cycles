"use client";
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { StorySection } from "./StorySection";
import { ParameterCard } from "./playground/ParameterCard";
import { TemperaturePod } from "./playground/TemperaturePod";
import { EraRibbon } from "./playground/EraRibbon";
import { MissionChip } from "./playground/MissionChip";
import { ERAS } from "@/lib/eraLookup";
import { useIsMobile } from "@/lib/useIsMobile";
import { getTodayTemperature } from "@/lib/todayClimate";
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

// "vs today" chips on each parameter card. Precession is an angle, so its
// delta is the shortest way around the circle.
const eccDelta = (v, t) => {
  const d = v - t;
  if (Math.abs(d) < 0.0008) return { atToday: true };
  return { atToday: false, text: `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(3)}` };
};
const tiltDelta = (v, t) => {
  const d = v - t;
  if (Math.abs(d) < 0.05) return { atToday: true };
  return { atToday: false, text: `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}°` };
};
const precDelta = (v, t) => {
  const d = ((((v - t) % 360) + 540) % 360) - 180;
  if (Math.abs(d) < 3) return { atToday: true };
  return { atToday: false, text: `${d > 0 ? "+" : "−"}${Math.round(Math.abs(d))}°` };
};

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
  co2Level,
  displayedTemp,
  formatNumber,
  onInView,
  isActive,
  focusedParam,
  onFocusParamChange,
  onSnapshot,
}) {
  const [activeEraKey, setActiveEraKey] = useState("today");
  const [showGraph, setShowGraph] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  // Peek by default so arriving at the playground never hijacks the scroll;
  // the nudge animation invites the tap that expands it.
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [everActive, setEverActive] = useState(false);
  const hasInitialized = useRef(false);
  const animRef = useRef(null);
  const stickyTimer = useRef(null);
  const touchStartY = useRef(null);
  const touchLastY = useRef(null);
  const isMobile = useIsMobile();

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
    };
  }, []);

  // Keep the sheet mounted after first activation so it slides away instead
  // of popping out of existence; collapse it whenever the section is left.
  useEffect(() => {
    if (isActive) {
      setEverActive(true);
    } else {
      setSheetExpanded(false);
    }
  }, [isActive]);

  // While the sheet is expanded the page must not scroll underneath it —
  // otherwise the section flips mid-interaction and the sheet disappears.
  useEffect(() => {
    if (!isMobile || !isActive || !sheetExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobile, isActive, sheetExpanded]);

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
    // On mobile the snapshot's payoff lives in the closing section — take
    // the user there, after the collapse has released the body scroll lock.
    if (isMobile) {
      setSheetExpanded(false);
      setTimeout(() => {
        document
          .getElementById("section-7")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  };

  const params = { eccentricity, axialTilt, precession };

  // Bottom-sheet drag/tap handling (mobile only)
  const handleSheetTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchLastY.current = e.touches[0].clientY;
  };
  const handleSheetTouchMove = (e) => {
    touchLastY.current = e.touches[0].clientY;
  };
  const handleSheetTouchEnd = () => {
    if (touchStartY.current === null || touchLastY.current === null) return;
    const dy = touchLastY.current - touchStartY.current;
    if (dy > 40) setSheetExpanded(false);
    else if (dy < -40) setSheetExpanded(true);
    touchStartY.current = null;
    touchLastY.current = null;
  };

  const todayTemp = getTodayTemperature();
  const peekDelta = temperature - todayTemp;
  const peekTemp = typeof displayedTemp === "number" ? displayedTemp : temperature;

  const controls = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <MissionChip temperature={temperature} />
      </div>

      <TemperaturePod
        temperature={temperature}
        displayedTemp={displayedTemp}
        iceFactor={iceFactor}
        eccentricity={eccentricity}
        axialTilt={axialTilt}
        precession={precession}
      />

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
          describeDelta={eccDelta}
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
          describeDelta={tiltDelta}
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
          describeDelta={precDelta}
          focused={focusedParam === "precession"}
          anyFocused={focusedParam !== null}
          onFocus={() => focusParam("precession")}
          onBlur={blurParam}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-blue/20">
        <button
          onClick={() => setGraphOpen((v) => !v)}
          className="text-[11px] text-stardust-white/70 hover:text-pale-gold transition-colors py-2 -my-1 flex items-center gap-1"
          aria-expanded={graphOpen}
        >
          <span
            className={[
              "inline-block transition-transform duration-200 text-pale-gold/70",
              graphOpen ? "rotate-90" : "rotate-0",
            ].join(" ")}
            aria-hidden
          >
            ▸
          </span>
          {graphOpen ? "Hide" : "Show"} 200-year history
        </button>
        <button
          onClick={handleSnapshot}
          className="celestial-button text-[11px] py-1 px-2.5"
        >
          Name this climate →
        </button>
      </div>

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
              formatNumber={formatNumber}
              style={{ width: "100%", height: "180px" }}
            />
          </Suspense>
        </div>
      )}
    </>
  );

  return (
    <StorySection id={6} onInView={handleInView} className="!items-end pb-6 md:pb-10">
      {/* Desktop: side panel */}
      <div className="hidden md:block w-full md:pl-[42%] px-4 md:pr-10">
        <div className="observatory-panel p-4 md:p-5 space-y-3 md:space-y-4 max-w-xl ml-auto">
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
              className="celestial-button text-[11px] py-1 px-2.5 whitespace-nowrap shrink-0"
              title="Reset to today's values"
            >
              Reset ↻
            </button>
          </header>
          {controls}
        </div>
      </div>

      {/* Mobile: bottom sheet over the 3D scene. Peek shows the temperature
          readout; expand to reveal the dials. Stays mounted after first
          activation so it slides in/out instead of popping. */}
      {isMobile && everActive && (
        <div
          className={[
            "md:hidden playground-sheet fixed inset-x-0 bottom-0 z-40",
            !isActive
              ? "playground-sheet--hidden"
              : sheetExpanded
              ? ""
              : "playground-sheet--peek",
          ].join(" ")}
          aria-hidden={!isActive}
        >
          <button
            type="button"
            onClick={() => setSheetExpanded((v) => !v)}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            className="relative w-full h-14 px-4 flex items-center gap-3 text-left"
            aria-expanded={sheetExpanded}
            aria-label={
              sheetExpanded ? "Collapse climate controls" : "Expand climate controls"
            }
          >
            <span
              className={[
                "absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-stardust-white/30",
                isActive && !sheetExpanded ? "peek-nudge" : "",
              ].join(" ")}
            />
            <span className="text-sm font-medium text-stardust-white truncate">
              Conduct the Climate
            </span>
            <span className="ml-auto flex items-baseline gap-1.5 font-mono shrink-0">
              <span className="text-base font-bold text-pale-gold">
                {peekTemp.toFixed(1)}°C
              </span>
              {Math.abs(peekDelta) > 0.15 && (
                <span
                  className={[
                    "text-[11px]",
                    peekDelta > 0 ? "text-temp-warm" : "text-temp-cold",
                  ].join(" ")}
                >
                  {peekDelta > 0 ? "+" : "−"}
                  {Math.abs(peekDelta).toFixed(1)}°
                </span>
              )}
            </span>
            <span
              className={[
                "text-pale-gold/70 transition-transform duration-300 shrink-0",
                sheetExpanded ? "rotate-180" : "rotate-0",
              ].join(" ")}
              aria-hidden
            >
              ▴
            </span>
          </button>

          <div
            className="playground-sheet-body px-4 space-y-3 overflow-y-auto overscroll-contain"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs text-stardust-white/60 leading-snug">
                Move one dial at a time to feel its fingerprint on Earth's
                climate. Collapse this panel to see the orbit.
              </p>
              <button
                onClick={resetToToday}
                className="celestial-button text-[11px] py-1 px-2.5 whitespace-nowrap shrink-0"
                title="Reset to today's values"
              >
                Reset ↻
              </button>
            </div>
            {controls}
            <button
              type="button"
              onClick={() => {
                setSheetExpanded(false);
                setTimeout(() => {
                  document
                    .getElementById("section-7")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 80);
              }}
              className="w-full text-center text-xs text-stardust-white/60 hover:text-pale-gold transition-colors py-3"
            >
              Continue the story ↓
            </button>
          </div>
        </div>
      )}
    </StorySection>
  );
}
