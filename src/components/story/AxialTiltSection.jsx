"use client";
import React, { useEffect, useState } from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TODAY_TILT } from "@/lib/parameterCopy";
import { useScrollScrub, scrubSweep } from "@/lib/useScrollScrub";

const MIN = 22.1;
const MAX = 24.5;

export function AxialTiltSection({ axialTilt, onAxialTiltChange, onInView }) {
  const [userOwned, setUserOwned] = useState(false);
  const scrub = useScrollScrub("section-3", { enabled: !userOwned });
  const revealed = userOwned || scrub > 0.35;

  useEffect(() => {
    if (userOwned) return;
    onAxialTiltChange(scrubSweep(scrub, { min: MIN, max: MAX, today: TODAY_TILT }));
  }, [scrub, userOwned, onAxialTiltChange]);

  return (
    <StorySection id={3} onInView={onInView} pinned>
      <div className="w-full max-w-lg px-4 md:px-12 py-4 md:py-8">
        <div className="observatory-panel p-4 md:p-8 space-y-3 md:space-y-5">
          <div>
            <h2 className="text-2xl md:text-4xl mb-1">The Lean</h2>
            <span className="text-sm font-mono text-pale-gold opacity-80">Scientists call this: Obliquity / Axial Tilt</span>
          </div>

          <p className="text-sm md:text-base text-stardust-white opacity-90 leading-relaxed">
            Earth does not spin straight up. Its axis leans, and that lean shifts
            between 22.1° and 24.5° over about <strong className="text-pale-gold">41,000 years</strong>.
          </p>

          <p className="hidden md:block text-sm text-stardust-white opacity-75 leading-relaxed italic">
            More lean makes summers and winters more intense. Less lean softens the
            seasons. Today, Earth sits near <strong className="text-pale-gold not-italic">23.4°</strong>.
          </p>

          <StorySlider
            label="Tilt Earth's axis"
            scienceName="Obliquity"
            value={axialTilt}
            onChange={onAxialTiltChange}
            min={MIN}
            max={MAX}
            step={0.1}
            hint="The white axis line leans as you scroll — or grab the dial"
            minLabel="Less tilt, milder seasons"
            maxLabel="More tilt, stronger seasons"
            todayMark={TODAY_TILT}
            snapToToday
            formatValue={(nextValue) => `${nextValue.toFixed(1)}°`}
            onPointerDown={() => setUserOwned(true)}
          />

          <div
            className={[
              "transition-all duration-700",
              revealed
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3 pointer-events-none max-h-0 overflow-hidden",
            ].join(" ")}
            aria-hidden={!revealed}
          >
            <CauseEffectCard
              items={[
                "More tilt creates bigger summer and winter contrasts",
                "Stronger northern summers can melt leftover winter snow and ice",
                "That summer melt matters most for whether ice sheets grow or retreat",
              ]}
            />
          </div>
        </div>
      </div>
    </StorySection>
  );
}
