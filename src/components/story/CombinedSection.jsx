"use client";
import React, { useEffect, useRef, useState } from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { ERAS } from "@/lib/eraLookup";

// Use the canonical era presets so the live 65°N reading on the climate HUD
// actually goes cold here — ad-hoc params previously read *warmer* than today.
const ICE_AGE = {
  eccentricity: ERAS.iceAge.eccentricity,
  axialTilt: ERAS.iceAge.axialTilt,
  precession: ERAS.iceAge.precession,
};
const TODAY = {
  eccentricity: ERAS.today.eccentricity,
  axialTilt: ERAS.today.axialTilt,
  precession: ERAS.today.precession,
};
const DURATION = 6000;
const PAUSE = 2000;

function easeInOut(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

function lerpParams(from, to, t) {
  return {
    eccentricity: from.eccentricity + (to.eccentricity - from.eccentricity) * t,
    axialTilt: from.axialTilt + (to.axialTilt - from.axialTilt) * t,
    precession: from.precession + (to.precession - from.precession) * t,
  };
}

export function CombinedSection({ onParamsChange, onInView }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [userOwned, setUserOwned] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentParams, setCurrentParams] = useState(ICE_AGE);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isAnimating || userOwned) return;

    let cancelled = false;

    // Single reusable function that starts one ice-age → today cycle,
    // then schedules the next after a pause. Uses a fresh startTime
    // each invocation so the closure is never stale.
    function startCycle() {
      if (cancelled) return;

      onParamsChange(ICE_AGE);
      setCurrentParams(ICE_AGE);
      setProgress(0);

      const startTime = performance.now();

      function tick(now) {
        if (cancelled) return;

        const elapsed = now - startTime;
        const p = Math.min(elapsed / DURATION, 1);
        const eased = easeInOut(p);

        const params = lerpParams(ICE_AGE, TODAY, eased);
        onParamsChange(params);
        setCurrentParams(params);
        setProgress(eased);

        if (p < 1) {
          animationRef.current = requestAnimationFrame(tick);
        } else {
          // Pause at "today", then loop
          timeoutRef.current = setTimeout(startCycle, PAUSE);
        }
      }

      // Brief pause at ice-age state before animating
      timeoutRef.current = setTimeout(() => {
        if (!cancelled) {
          animationRef.current = requestAnimationFrame(tick);
        }
      }, PAUSE);
    }

    startCycle();

    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isAnimating, userOwned, onParamsChange]);

  const handleInView = (id) => {
    setIsAnimating(true);
    onInView?.(id);
  };

  // Stop animation and reset params when leaving
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          setIsAnimating(false);
          setUserOwned(false);
          onParamsChange(TODAY);
        }
      },
      { threshold: 0.1 }
    );

    const el = document.getElementById("section-5");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [onParamsChange]);

  // User grabs the timeline (pointer or keyboard): stop the replay and let
  // them scrub history — the replay's own updates never fire onChange.
  const handleTimelineChange = (p) => {
    setUserOwned(true);
    setProgress(p);
    const params = lerpParams(ICE_AGE, TODAY, p);
    onParamsChange(params);
    setCurrentParams(params);
  };

  const yearsAgo = Math.round((1 - progress) * 21000);
  const timelineReadout =
    yearsAgo < 250 ? "Today" : `${yearsAgo.toLocaleString()} years ago`;

  return (
    <StorySection id={5} onInView={handleInView}>
      <div className="w-full max-w-lg px-4 md:px-12 py-8">
        <div className="observatory-panel p-4 md:p-8 space-y-4 md:space-y-5">
          <h2 className="text-2xl md:text-4xl">When All Three Align</h2>

          <p className="text-sm md:text-base text-stardust-white opacity-90 leading-relaxed">
            Each of these changes is small on its own. But when they line up in
            just the right way, they can push Earth into an ice age — or pull it
            back out.
          </p>

          {/* Draggable history timeline — replays on its own until grabbed */}
          <StorySlider
            label="Travel through time"
            value={progress}
            onChange={handleTimelineChange}
            min={0}
            max={1}
            step={0.001}
            hint={
              userOwned
                ? "Drag between the last ice age and today"
                : "Watch history replay — or grab the dial yourself"
            }
            minLabel="Last Ice Age"
            maxLabel="Today"
            onPointerDown={() => setUserOwned(true)}
            renderValue={() => (
              <span className="text-xs font-mono text-pale-gold opacity-90">
                {timelineReadout}
              </span>
            )}
          />

          {/* Live parameter values */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="observatory-panel p-2 text-center">
              <div className="text-stardust-white opacity-70">Stretch</div>
              <div className="text-pale-gold">
                {currentParams.eccentricity.toFixed(4)}
              </div>
            </div>
            <div className="observatory-panel p-2 text-center">
              <div className="text-stardust-white opacity-70">Lean</div>
              <div className="text-pale-gold">
                {currentParams.axialTilt.toFixed(2)}°
              </div>
            </div>
            <div className="observatory-panel p-2 text-center">
              <div className="text-stardust-white opacity-70">Wobble</div>
              <div className="text-pale-gold">
                {currentParams.precession.toFixed(0)}°
              </div>
            </div>
          </div>

          <div className="observatory-panel p-3 md:p-4 bg-deep-space bg-opacity-50">
            <p className="text-xs md:text-sm text-pale-gold leading-relaxed">
              The key is summer sunlight at 65° north — the reading on the
              climate dial. When summers there are cool enough that winter snow
              doesn't fully melt, ice builds up year after year. Eventually,
              massive ice sheets cover much of North America and Europe.
            </p>
          </div>
        </div>
      </div>
    </StorySection>
  );
}
