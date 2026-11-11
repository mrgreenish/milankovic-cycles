"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long the sunlight map stays after the last move of a control. */
export const SUNLIGHT_HOLD_MS = 1600;

/**
 * True from the first call of `mark` until `holdMs` after the last one. The
 * page marks every change a visitor makes to the orbit by hand, so the scene
 * can show the sunlight map while a control moves and for a moment after.
 */
export function useRecentChange(holdMs = SUNLIGHT_HOLD_MS) {
  const [active, setActive] = useState(false);
  const timer = useRef(0);
  const mark = useCallback(() => {
    setActive(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setActive(false), holdMs);
  }, [holdMs]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [active, mark] as const;
}
