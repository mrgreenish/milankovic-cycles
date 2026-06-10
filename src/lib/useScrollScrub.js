"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Maps the scroll position of a pinned story section to 0..1 progress.
 * 0 = section top reaches the viewport top (card just pinned),
 * 1 = section bottom reaches the viewport bottom (pin about to release).
 *
 * Used to drive an orbital parameter from scroll so every visitor sees the
 * effect of each cycle, even if they never touch a slider.
 */
export function useScrollScrub(sectionId, { enabled = true } = {}) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const el = document.getElementById(sectionId);
    if (!el) return;

    const update = () => {
      frame.current = null;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      setProgress(Math.min(1, Math.max(0, -rect.top / total)));
    };
    const onScroll = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [sectionId, enabled]);

  return progress;
}

function easeInOut(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

/**
 * Sweep a parameter across its full range as the user scrolls through a
 * pinned section, always returning home to today's value:
 * hold today → rise to max → fall to min → settle back at today.
 */
export function scrubSweep(p, { min, max, today }) {
  if (p < 0.1) return today;
  if (p < 0.45) return today + (max - today) * easeInOut((p - 0.1) / 0.35);
  if (p < 0.8) return max + (min - max) * easeInOut((p - 0.45) / 0.35);
  return min + (today - min) * easeInOut((p - 0.8) / 0.2);
}

/**
 * Precession is an angle: one full revolution per scrub, ending back at 0°.
 */
export function scrubRevolution(p) {
  if (p < 0.1) return 0;
  if (p > 0.9) return 0;
  return 360 * easeInOut((p - 0.1) / 0.8);
}
