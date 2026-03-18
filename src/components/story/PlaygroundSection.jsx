"use client";
import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { TemperatureIndicator } from "./TemperatureIndicator";

// Lazy load the heavy temperature graph - only when playground is active
const GlobalTemperatureGraph = lazy(() =>
  import("@/components/GlobalTemperatureGraph").then((mod) => ({
    default: mod.GlobalTemperatureGraph,
  }))
);

const PRESETS = {
  Today: {
    eccentricity: 0.0167,
    axialTilt: 23.44,
    precession: 0,
    description: "Current orbital configuration",
  },
  "Last Ice Age": {
    eccentricity: 0.019,
    axialTilt: 22.99,
    precession: 114,
    description:
      "21,000 years ago — massive ice sheets covered North America and Europe",
  },
  "Warm Period": {
    eccentricity: 0.0187,
    axialTilt: 24.1,
    precession: 303,
    description: "6,000 years ago — warmer climate with enhanced seasons",
  },
  Future: {
    eccentricity: 0.015,
    axialTilt: 23.2,
    precession: 90,
    description: "50,000 years from now — projected orbital state",
  },
};

// Fun challenges to make exploration purposeful
const CHALLENGES = [
  { text: "Can you create an ice age?", target: "below 5°C", check: (t) => t < 5 },
  { text: "Can you make Earth as warm as possible?", target: "above 15°C", check: (t) => t > 15 },
  { text: "Can you match today's temperature?", target: "~14°C", check: (t) => Math.abs(t - 14) < 1 },
];

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
  isMobile,
}) {
  const [activePreset, setActivePreset] = useState("Today");
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const hasInitialized = useRef(false);
  const presetAnimationRef = useRef(null);

  // Lazy-load graph and apply initial preset only when section becomes visible
  const handleInView = (id) => {
    onInView(id);
    setShowGraph(true);
    // Apply "Today" preset only the first time the playground comes into view
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const p = PRESETS["Today"];
      onEccentricityChange(p.eccentricity);
      onAxialTiltChange(p.axialTilt);
      onPrecessionChange(p.precession);
    }
  };

  const cancelPresetAnimation = () => {
    if (presetAnimationRef.current) {
      cancelAnimationFrame(presetAnimationRef.current);
      presetAnimationRef.current = null;
    }
  };

  const applyPreset = (name) => {
    cancelPresetAnimation();
    const target = PRESETS[name];
    const startEcc = eccentricity;
    const startTilt = axialTilt;
    const startPrec = precession;
    const duration = 800; // ms
    const startTime = performance.now();
    setActivePreset(name);

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic for smooth deceleration
      const ease = 1 - Math.pow(1 - t, 3);

      onEccentricityChange(startEcc + (target.eccentricity - startEcc) * ease);
      onAxialTiltChange(startTilt + (target.axialTilt - startTilt) * ease);
      onPrecessionChange(startPrec + (target.precession - startPrec) * ease);

      if (t < 1) {
        presetAnimationRef.current = requestAnimationFrame(animate);
      } else {
        presetAnimationRef.current = null;
      }
    };

    presetAnimationRef.current = requestAnimationFrame(animate);
  };

  const resetToToday = () => {
    applyPreset("Today");
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => cancelPresetAnimation();
  }, []);

  // Check challenges
  useEffect(() => {
    if (activeChallenge !== null) {
      const challenge = CHALLENGES[activeChallenge];
      if (challenge.check(temperature)) {
        setChallengeComplete(true);
      }
    }
  }, [temperature, activeChallenge]);

  const startChallenge = (index) => {
    setActiveChallenge(index);
    setChallengeComplete(false);
  };

  return (
    <StorySection id={6} onInView={handleInView} className="items-start pt-20">
      <div className="w-full max-w-lg px-6 md:px-12 py-8 space-y-4">
        <div className="observatory-panel p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl md:text-4xl mb-2">Your Turn to Explore</h2>
              <p className="text-sm text-stardust-white opacity-60">
                Now you understand the three cycles. Combine them freely and see
                what happens.
              </p>
            </div>
            <button
              onClick={resetToToday}
              className="celestial-button text-xs py-1.5 px-3 whitespace-nowrap"
              title="Reset to today's values"
            >
              Reset
            </button>
          </div>

          {/* Mobile 3D hint */}
          {isMobile && (
            <p className="text-xs text-pale-gold opacity-60 text-center">
              👆 Drag the 3D view above to rotate it
            </p>
          )}
          {!isMobile && (
            <p className="text-xs text-stardust-white opacity-40">
              🖱️ Drag the 3D view to rotate, scroll to zoom
            </p>
          )}

          <StorySlider
            label="The Stretch"
            scienceName="Eccentricity"
            value={eccentricity}
            onChange={(v) => {
              cancelPresetAnimation();
              onEccentricityChange(v);
              setActivePreset(null);
            }}
            min={0.005}
            max={0.058}
            step={0.001}
          />

          <StorySlider
            label="The Lean"
            scienceName="Obliquity"
            value={axialTilt}
            onChange={(v) => {
              cancelPresetAnimation();
              onAxialTiltChange(v);
              setActivePreset(null);
            }}
            min={22.1}
            max={24.5}
            step={0.1}
          />

          <StorySlider
            label="The Wobble"
            scienceName="Precession"
            value={precession}
            onChange={(v) => {
              cancelPresetAnimation();
              onPrecessionChange(v);
              setActivePreset(null);
            }}
            min={0}
            max={360}
            step={1}
          />

          <TemperatureIndicator temperature={temperature} />
        </div>

        {/* Challenges */}
        <div className="observatory-panel p-4 space-y-3">
          <h3 className="text-lg mb-1">Challenges</h3>
          <div className="space-y-2">
            {CHALLENGES.map((challenge, index) => (
              <button
                key={index}
                onClick={() => startChallenge(index)}
                className={`w-full text-left text-sm py-2 px-3 rounded transition-all ${
                  activeChallenge === index
                    ? challengeComplete
                      ? "bg-green-500/20 border border-green-500/50 text-green-300"
                      : "bg-antique-brass/20 border border-antique-brass/50 text-pale-gold"
                    : "bg-deep-space/50 border border-slate-blue/30 text-stardust-white opacity-70 hover:opacity-100"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>
                    {activeChallenge === index && challengeComplete ? "✅ " : "🎯 "}
                    {challenge.text}
                  </span>
                  {activeChallenge === index && !challengeComplete && (
                    <span className="text-xs opacity-60">Target: {challenge.target}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div className="observatory-panel p-4 space-y-3">
          <h3 className="text-lg mb-2">Jump to a time period</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([name]) => (
              <button
                key={name}
                onClick={() => applyPreset(name)}
                className={`celestial-button text-sm py-2 px-3 text-center transition-all ${
                  activePreset === name
                    ? "!bg-antique-brass/20 !border-antique-brass"
                    : ""
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {activePreset && PRESETS[activePreset] && (
            <p className="text-xs text-stardust-white opacity-60">
              {PRESETS[activePreset].description}
            </p>
          )}
        </div>

        {/* Temperature Graph - lazy loaded */}
        <div className="observatory-panel p-4">
          <h3 className="text-lg mb-2">Temperature over time</h3>
          {showGraph ? (
            <Suspense
              fallback={
                <div className="w-full h-[200px] flex items-center justify-center text-stardust-white opacity-40 text-sm">
                  Loading graph...
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
                style={{ width: "100%", height: "200px" }}
              />
            </Suspense>
          ) : (
            <div className="w-full h-[200px] flex items-center justify-center text-stardust-white opacity-40 text-sm">
              Scroll to playground to view graph
            </div>
          )}
        </div>
      </div>
    </StorySection>
  );
}
