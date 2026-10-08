"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { track } from "@vercel/analytics";
import type { ParameterKey } from "@/lib/orbital/controls";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import {
  initialOrbitalState,
  orbitalReducer,
  type OrbitalState,
} from "@/lib/orbital/state";
import type { OrbitScale, OrbitalVisualFocus } from "@/lib/orbital/types";
import { initialLive, touchLive, type SceneLive } from "./sceneLive";
import { useReducedMotion } from "./useReducedMotion";
import { useStickyLayout } from "./useStickyLayout";
import { usePlayer, type Playing } from "./usePlayer";

export const TOUR_CHAPTERS = [
  { id: "big-idea", label: "Ice and sun" },
  { id: "orbit-shape", label: "Stretch" },
  { id: "axis-tilt", label: "Lean" },
  { id: "axis-direction", label: "Wobble" },
  { id: "together", label: "Run the clock" },
  { id: "recap", label: "Short version" },
] as const;
export type TourChapterId = (typeof TOUR_CHAPTERS)[number]["id"];

export const CHAPTER_FOCUS: Record<TourChapterId, OrbitalVisualFocus> = {
  "big-idea": "idea",
  "orbit-shape": "shape",
  "axis-tilt": "tilt",
  "axis-direction": "direction",
  together: "timeline",
  recap: "combined",
};

const CYCLE_OF_CHAPTER: Partial<Record<TourChapterId, ParameterKey>> = {
  "orbit-shape": "eccentricity",
  "axis-tilt": "obliquityDeg",
  "axis-direction": "earthPerihelionLongitudeDeg",
};

/** Inputs the 3D scene reads every frame without a React render. */
export type LiveInputs = SceneLive["current"];

type State = OrbitalState & {
  activeChapter: TourChapterId;
  /** True above the first chapter, while the title is on screen. */
  inHero: boolean;
};
type Action =
  | { type: "chapter"; chapter: TourChapterId; inHero?: boolean }
  | Parameters<typeof orbitalReducer>[1];

const initialState: State = {
  ...initialOrbitalState,
  activeChapter: "big-idea",
  inHero: true,
};
function reducer(state: State, action: Action): State {
  if (action.type === "chapter") {
    const inHero = action.inHero ?? false;
    return state.activeChapter === action.chapter && state.inHero === inHero
      ? state
      : { ...state, activeChapter: action.chapter, inHero };
  }
  return { ...state, ...orbitalReducer(state, action) };
}

type ExperienceContextValue = State & {
  reducedMotion: boolean;
  live: RefObject<LiveInputs>;
  playing: Playing;
  /** A view the title buttons are previewing while the pointer rests on them. */
  preview: OrbitalVisualFocus | null;
  setPreview: (focus: OrbitalVisualFocus | null) => void;
  setParameter: (key: ParameterKey, value: number) => void;
  resetParameter: (key: ParameterKey) => void;
  resetAll: () => void;
  nudgeParameter: (key: ParameterKey, delta: number) => void;
  setScale: (scale: OrbitScale) => void;
  setTime: (kyr: number) => void;
  nudgeTime: (delta: number) => void;
  playTime: () => void;
  playCycle: (key: ParameterKey) => void;
  stop: () => void;
  goToChapter: (chapter: TourChapterId) => void;
};
const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [playing, setPlaying] = useState<Playing>(null);
  const [preview, setPreview] = useState<OrbitalVisualFocus | null>(null);
  const reducedMotion = useReducedMotion();
  const offset = useStickyLayout("tour");
  const live = useRef<LiveInputs>({ ...initialLive });
  const navigation = useRef<{ chapter: TourChapterId; until: number } | null>(
    null,
  );
  const completed = useRef(false);
  const timeRef = useRef<number | null>(null);
  useEffect(() => {
    timeRef.current = state.timeKyr;
  }, [state.timeKyr]);

  const stop = useCallback(() => setPlaying(null), []);
  usePlayer(playing, dispatch, () => timeRef.current, stop);

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
    const hero = document.getElementById("hero");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (hero) {
        const height = Math.max(1, hero.offsetHeight);
        live.current.hero = Math.min(1, Math.max(0, window.scrollY / height));
      }
      // Scrolling moves the camera between views, so the scene renders at full rate.
      touchLive(live);
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
      // On a wide screen text and scene share the page, so a chapter takes over
      // once it reaches the middle. On a phone the line sits below the pinned stage.
      const wide = window.matchMedia("(min-width: 981px)").matches;
      const line = wide ? window.innerHeight * 0.45 : offset.current + 64;
      const positions = sections.map((section) => ({
        section,
        top: section.getBoundingClientRect().top,
      }));
      const active = positions.filter(({ top }) => top <= line).at(-1)?.section;
      if (!active) {
        dispatch({ type: "chapter", chapter: "big-idea", inHero: true });
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
    schedule();
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

  // Leaving the chapter that owns a playing clock or cycle stops it.
  const activeChapter = state.activeChapter;
  const inHero = state.inHero;
  useEffect(() => {
    if (!playing) return;
    const owner: TourChapterId =
      playing.kind === "time"
        ? "together"
        : playing.key === "eccentricity"
          ? "orbit-shape"
          : playing.key === "obliquityDeg"
            ? "axis-tilt"
            : "axis-direction";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (inHero || activeChapter !== owner) setPlaying(null);
  }, [playing, activeChapter, inHero]);

  // Each cycle chapter plays itself once on the first visit, so the motion
  // is the first thing seen. Touching any control cancels it.
  const shown = useRef(new Set<TourChapterId>());
  const touched = useRef(false);
  useEffect(() => {
    touched.current = false;
    if (inHero || reducedMotion) return;
    const key = CYCLE_OF_CHAPTER[activeChapter];
    if (!key || shown.current.has(activeChapter)) return;
    const timer = window.setTimeout(() => {
      shown.current.add(activeChapter);
      if (!touched.current) setPlaying({ kind: "cycle", key, once: true });
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [activeChapter, inHero, reducedMotion]);

  const setParameter = useCallback((key: ParameterKey, value: number) => {
    touched.current = true;
    setPlaying(null);
    dispatch({ type: "parameter", key, value });
  }, []);
  const resetParameter = useCallback((key: ParameterKey) => {
    touched.current = true;
    setPlaying(null);
    dispatch({ type: "parameter", key, value: PRESENT_PARAMETERS[key] });
  }, []);
  const resetAll = useCallback(() => {
    touched.current = true;
    setPlaying(null);
    dispatch({ type: "reset" });
  }, []);
  const nudgeParameter = useCallback((key: ParameterKey, delta: number) => {
    touched.current = true;
    setPlaying(null);
    dispatch({ type: "nudge", key, delta });
  }, []);
  const nudgeTime = useCallback((delta: number) => {
    touched.current = true;
    setPlaying(null);
    dispatch({ type: "timeNudge", delta });
  }, []);
  const setScale = useCallback(
    (scale: OrbitScale) => dispatch({ type: "scale", scale }),
    [],
  );
  const setTime = useCallback((kyr: number) => {
    touched.current = true;
    setPlaying(null);
    dispatch({ type: "time", kyr });
  }, []);
  const playTime = useCallback(() => {
    track("timeline_play");
    setPlaying({ kind: "time" });
  }, []);
  const playCycle = useCallback((key: ParameterKey) => {
    touched.current = true;
    track("cycle_play", { parameter: key });
    setPlaying({ kind: "cycle", key });
  }, []);
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
      live,
      playing,
      preview,
      setPreview,
      setParameter,
      resetParameter,
      resetAll,
      nudgeParameter,
      nudgeTime,
      setScale,
      setTime,
      playTime,
      playCycle,
      stop,
      goToChapter,
    }),
    [
      state,
      reducedMotion,
      playing,
      preview,
      setParameter,
      resetParameter,
      resetAll,
      nudgeParameter,
      nudgeTime,
      setScale,
      setTime,
      playTime,
      playCycle,
      stop,
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
