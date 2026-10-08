"use client";

import dynamic from "next/dynamic";
import { displayedTime } from "@/lib/orbital/state";
import { touchLive, writeLive } from "./sceneLive";
import { useExperience } from "./ExperienceProvider";
import { useMediaQuery } from "./useMediaQuery";

const Timeline = dynamic(() => import("./Timeline").then((m) => m.Timeline), {
  ssr: false,
  loading: () => null,
});

/**
 * The clock lives over the stage on wide screens and inside the chapter on
 * narrow ones. Only one of the two is ever mounted.
 */
export function TimelinePanel({ placement }: { placement: "dock" | "inline" }) {
  const {
    parameters,
    timeKyr,
    playing,
    playTime,
    stop,
    setTime,
    inHero,
    activeChapter,
    live,
  } = useExperience();
  const wide = useMediaQuery("(min-width: 981px)");
  const here = !inHero && activeChapter === "together";
  if (placement === "dock" ? !(wide && here) : wide) return null;
  return (
    <Timeline
      variant={placement}
      parameters={parameters}
      timeKyr={displayedTime({ parameters, timeKyr })}
      onTime={setTime}
      onScrub={(kyr) => {
        // Pause before the throttled page update so the first dragged frame
        // uses the scrub transition instead of following every playback cycle.
        if (kyr !== null) stop();
        writeLive(live, { scrub: kyr });
        touchLive(live);
      }}
      playing={playing?.kind === "time"}
      onTogglePlay={() => (playing?.kind === "time" ? stop() : playTime())}
    />
  );
}
