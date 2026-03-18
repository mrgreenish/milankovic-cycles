"use client";
import React, { useEffect, useRef, useState } from "react";
import { StorySection } from "./StorySection";

const ICE_AGE = { eccentricity: 0.019, axialTilt: 22.99, precession: 114 };
const TODAY = { eccentricity: 0.0167, axialTilt: 23.44, precession: 0 };
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

export function CombinedSection({ onParamsChange, onInView, temperature }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentParams, setCurrentParams] = useState(ICE_AGE);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isAnimating) return;

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
  }, [isAnimating, onParamsChange]);

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
          onParamsChange(TODAY);
        }
      },
      { threshold: 0.1 }
    );

    const el = document.getElementById("section-5");
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [onParamsChange]);

  // Interpolated temperature for display
  const iceTemp = -5;
  const todayTemp = 14;
  const displayTemp = iceTemp + (todayTemp - iceTemp) * progress;

  return (
    <StorySection id={5} onInView={handleInView}>
      <div className="w-full max-w-2xl mx-auto px-6 text-center py-8">
        <div className="observatory-panel p-6 md:p-8 space-y-6">
          <h2 className="text-3xl md:text-4xl">When All Three Align</h2>

          <p className="text-base text-stardust-white opacity-80 leading-relaxed">
            Each of these changes is small on its own. But when they line up in
            just the right way, they can push Earth into an ice age — or pull it
            back out.
          </p>

          {/* Timeline bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-stardust-white opacity-50">
              <span>21,000 years ago</span>
              <span>Today</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-blue/40">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(to right, #2563eb, #06b6d4, #84cc16, #eab308)`,
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-mono text-blue-400">
                ❄️ {iceTemp}°C
              </span>
              <span className="text-lg font-mono font-bold text-pale-gold">
                {displayTemp.toFixed(1)}°C
              </span>
              <span className="text-sm font-mono text-yellow-400">
                ☀️ {todayTemp}°C
              </span>
            </div>
          </div>

          {/* Live parameter values */}
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="observatory-panel p-2 text-center">
              <div className="text-stardust-white opacity-50">Stretch</div>
              <div className="text-pale-gold">
                {currentParams.eccentricity.toFixed(4)}
              </div>
            </div>
            <div className="observatory-panel p-2 text-center">
              <div className="text-stardust-white opacity-50">Lean</div>
              <div className="text-pale-gold">
                {currentParams.axialTilt.toFixed(2)}°
              </div>
            </div>
            <div className="observatory-panel p-2 text-center">
              <div className="text-stardust-white opacity-50">Wobble</div>
              <div className="text-pale-gold">
                {currentParams.precession.toFixed(0)}°
              </div>
            </div>
          </div>

          <div className="observatory-panel p-4 bg-deep-space bg-opacity-50">
            <p className="text-sm text-pale-gold leading-relaxed">
              The key is summer sunlight at 65° north. When summers there are
              cool enough that winter snow doesn't fully melt, ice builds up year
              after year. Eventually, massive ice sheets cover much of North
              America and Europe.
            </p>
          </div>
        </div>
      </div>
    </StorySection>
  );
}
