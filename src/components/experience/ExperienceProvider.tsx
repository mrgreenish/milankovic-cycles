"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import { track } from "@vercel/analytics";
import type {
  OrbitScale,
  OrbitalParameters,
} from "@/lib/orbital/types";

export const TOUR_CHAPTERS = [
  { id: "big-idea", label: "Big Idea" },
  { id: "orbit-shape", label: "Orbit Shape" },
  { id: "axis-tilt", label: "Axis Tilt" },
  { id: "axis-direction", label: "Axis Direction" },
  { id: "together", label: "Together" },
  { id: "recap", label: "Recap" },
] as const;

export type TourChapterId = (typeof TOUR_CHAPTERS)[number]["id"];

type ExperienceState = {
  activeChapter: TourChapterId;
  parameters: OrbitalParameters;
  interactionOwner: "chapter-default" | "user";
  scale: OrbitScale;
  reducedMotion: boolean;
};

type ParameterKey = keyof OrbitalParameters;

type Action =
  | { type: "set-chapter"; chapter: TourChapterId }
  | { type: "set-parameter"; key: ParameterKey; value: number }
  | { type: "reset-parameter"; key: ParameterKey }
  | { type: "reset-all" }
  | { type: "set-scale"; scale: OrbitScale }
  | { type: "set-reduced-motion"; reducedMotion: boolean };

const initialState: ExperienceState = {
  activeChapter: "big-idea",
  parameters: { ...PRESENT_PARAMETERS },
  interactionOwner: "chapter-default",
  scale: "5x",
  reducedMotion: false,
};

function reducer(state: ExperienceState, action: Action): ExperienceState {
  switch (action.type) {
    case "set-chapter":
      return { ...state, activeChapter: action.chapter };
    case "set-parameter":
      return {
        ...state,
        parameters: { ...state.parameters, [action.key]: action.value },
        interactionOwner: "user",
      };
    case "reset-parameter":
      return {
        ...state,
        parameters: {
          ...state.parameters,
          [action.key]: PRESENT_PARAMETERS[action.key],
        },
        interactionOwner: "chapter-default",
      };
    case "reset-all":
      return {
        ...state,
        parameters: { ...PRESENT_PARAMETERS },
        interactionOwner: "chapter-default",
      };
    case "set-scale":
      return { ...state, scale: action.scale };
    case "set-reduced-motion":
      return { ...state, reducedMotion: action.reducedMotion };
  }
}

type ExperienceContextValue = ExperienceState & {
  setParameter: (key: ParameterKey, value: number) => void;
  resetParameter: (key: ParameterKey) => void;
  resetAll: () => void;
  setScale: (scale: OrbitScale) => void;
  goToChapter: (chapter: TourChapterId) => void;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () =>
      dispatch({ type: "set-reduced-motion", reducedMotion: media.matches });
    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-tour-step]"),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const chapter = visible.target.id as TourChapterId;
        dispatch({ type: "set-chapter", chapter });
        window.history.replaceState(null, "", `#${chapter}`);
      },
      { rootMargin: "-24% 0px -58% 0px", threshold: [0, 0.15, 0.4] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const setParameter = useCallback((key: ParameterKey, value: number) => {
    dispatch({ type: "set-parameter", key, value });
  }, []);

  const resetParameter = useCallback((key: ParameterKey) => {
    dispatch({ type: "reset-parameter", key });
  }, []);

  const resetAll = useCallback(() => dispatch({ type: "reset-all" }), []);
  const setScale = useCallback(
    (scale: OrbitScale) => dispatch({ type: "set-scale", scale }),
    [],
  );

  const goToChapter = useCallback(
    (chapter: TourChapterId) => {
      const target = document.getElementById(chapter);
      if (!target) return;
      track("chapter_navigation", { chapter });
      if (chapter === "recap") track("tour_completion");
      target.scrollIntoView({
        behavior: state.reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      window.history.replaceState(null, "", `#${chapter}`);
      window.requestAnimationFrame(() => {
        target.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
      });
    },
    [state.reducedMotion],
  );

  const value = useMemo<ExperienceContextValue>(
    () => ({
      ...state,
      setParameter,
      resetParameter,
      resetAll,
      setScale,
      goToChapter,
    }),
    [state, setParameter, resetParameter, resetAll, setScale, goToChapter],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const context = useContext(ExperienceContext);
  if (!context) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return context;
}
