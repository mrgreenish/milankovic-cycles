"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { track } from "@vercel/analytics";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type { OrbitScale, OrbitalParameters } from "@/lib/orbital/types";
import { useReducedMotion } from "./useReducedMotion";
import { useStickyLayout } from "./useStickyLayout";

export const TOUR_CHAPTERS = [
  { id: "big-idea", label: "The idea" },
  { id: "orbit-shape", label: "Orbit shape" },
  { id: "axis-tilt", label: "Axis tilt" },
  { id: "axis-direction", label: "Precession" },
  { id: "together", label: "Together" },
  { id: "recap", label: "Recap" },
] as const;
export type TourChapterId = (typeof TOUR_CHAPTERS)[number]["id"];
type ParameterKey = keyof OrbitalParameters;
type State = {
  activeChapter: TourChapterId;
  parameters: OrbitalParameters;
  scale: OrbitScale;
};
type Action =
  | { type: "chapter"; chapter: TourChapterId }
  | { type: "parameter"; key: ParameterKey; value: number }
  | { type: "reset" }
  | { type: "scale"; scale: OrbitScale };
const initialState: State = {
  activeChapter: "big-idea",
  parameters: { ...PRESENT_PARAMETERS },
  scale: "5x",
};
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "chapter":
      return state.activeChapter === action.chapter
        ? state
        : { ...state, activeChapter: action.chapter };
    case "parameter":
      return {
        ...state,
        parameters: { ...state.parameters, [action.key]: action.value },
      };
    case "reset":
      return { ...state, parameters: { ...PRESENT_PARAMETERS } };
    case "scale":
      return { ...state, scale: action.scale };
  }
}
type ExperienceContextValue = State & {
  reducedMotion: boolean;
  setParameter: (key: ParameterKey, value: number) => void;
  resetParameter: (key: ParameterKey) => void;
  resetAll: () => void;
  setScale: (scale: OrbitScale) => void;
  goToChapter: (chapter: TourChapterId) => void;
};
const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const reducedMotion = useReducedMotion();
  const offset = useStickyLayout("tour");
  const navigation = useRef<{ chapter: TourChapterId; until: number } | null>(
    null,
  );
  const completed = useRef(false);

  const navigate = useCallback(
    (chapter: TourChapterId, push: boolean, smooth: boolean) => {
      const target = document.getElementById(chapter);
      if (!target) return;
      navigation.current = { chapter, until: performance.now() + 1400 };
      dispatch({ type: "chapter", chapter });
      if (push && window.location.hash !== `#${chapter}`) {
        window.history.pushState(window.history.state, "", `#${chapter}`);
      }
      target.scrollIntoView({
        behavior: smooth ? "smooth" : "instant",
        block: "start",
      });
      target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    },
    [],
  );

  useEffect(() => {
    const sections = [
      ...document.querySelectorAll<HTMLElement>("[data-tour-step]"),
    ];
    let frame = 0;
    const update = () => {
      frame = 0;
      const pending = navigation.current;
      if (pending) {
        const top =
          document.getElementById(pending.chapter)?.getBoundingClientRect()
            .top ?? 0;
        if (
          Math.abs(top - offset.current) > 3 &&
          performance.now() < pending.until
        )
          return;
        navigation.current = null;
      }
      // The reading line is below ALL pinned UI, including the mobile scene.
      const positions = sections.map((section) => ({
        section,
        top: section.getBoundingClientRect().top,
      }));
      const active = positions
        .filter(({ top }) => top <= offset.current + 64)
        .at(-1)?.section;
      if (!active) {
        dispatch({ type: "chapter", chapter: "big-idea" });
        if (
          TOUR_CHAPTERS.some(
            (chapter) => `#${chapter.id}` === window.location.hash,
          )
        ) {
          window.history.replaceState(
            window.history.state,
            "",
            window.location.pathname + window.location.search,
          );
        }
        return;
      }
      const chapter = active.id as TourChapterId;
      dispatch({ type: "chapter", chapter });
      if (window.location.hash !== `#${chapter}`)
        window.history.replaceState(window.history.state, "", `#${chapter}`);
      if (chapter === "recap" && !completed.current) {
        completed.current = true;
        track("tour_completion");
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const interrupt = () => {
      navigation.current = null;
    };
    const restore = () => {
      const chapter = TOUR_CHAPTERS.find(
        (item) => `#${item.id}` === window.location.hash,
      );
      if (chapter) navigate(chapter.id, false, false);
      else if (!window.location.hash) {
        navigation.current = null;
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };
    // Wait for the sticky measurements before positioning a direct link.
    const initialFrame = requestAnimationFrame(restore);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("scrollend", schedule);
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("scrollend", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
    };
  }, [navigate, offset]);

  const setParameter = useCallback(
    (key: ParameterKey, value: number) =>
      dispatch({ type: "parameter", key, value }),
    [],
  );
  const resetParameter = useCallback(
    (key: ParameterKey) =>
      dispatch({ type: "parameter", key, value: PRESENT_PARAMETERS[key] }),
    [],
  );
  const resetAll = useCallback(() => dispatch({ type: "reset" }), []);
  const setScale = useCallback(
    (scale: OrbitScale) => dispatch({ type: "scale", scale }),
    [],
  );
  const goToChapter = useCallback(
    (chapter: TourChapterId) => {
      track("chapter_navigation", { chapter });
      navigate(chapter, true, !reducedMotion);
    },
    [navigate, reducedMotion],
  );
  const value = useMemo(
    () => ({
      ...state,
      reducedMotion,
      setParameter,
      resetParameter,
      resetAll,
      setScale,
      goToChapter,
    }),
    [
      state,
      reducedMotion,
      setParameter,
      resetParameter,
      resetAll,
      setScale,
      goToChapter,
    ],
  );
  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}
export function useOptionalExperience() {
  return useContext(ExperienceContext);
}

export function useExperience() {
  const context = useOptionalExperience();
  if (!context)
    throw new Error("useExperience must be used within ExperienceProvider");
  return context;
}
