"use client";
import React, { useEffect, useState } from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TODAY_ECC } from "@/lib/parameterCopy";
import { useScrollScrub, scrubSweep } from "@/lib/useScrollScrub";

const MIN = 0.005;
const MAX = 0.058;

export function EccentricitySection({ eccentricity, onEccentricityChange, onInView }) {
  // Scroll drives the parameter until the visitor grabs the dial themselves
  const [userOwned, setUserOwned] = useState(false);
  const scrub = useScrollScrub("section-2", { enabled: !userOwned });
  const revealed = userOwned || scrub > 0.35;

  useEffect(() => {
    if (userOwned) return;
    onEccentricityChange(
      scrubSweep(scrub, { min: MIN, max: MAX, today: TODAY_ECC })
    );
  }, [scrub, userOwned, onEccentricityChange]);

  return (
    <StorySection id={2} onInView={onInView} pinned>
      <div className="w-full max-w-lg px-4 md:px-12 py-4 md:py-8">
        <div className="observatory-panel p-4 md:p-8 space-y-3 md:space-y-5">
          <div>
            <h2 className="text-2xl md:text-4xl mb-1">The Stretch</h2>
            <span className="text-sm font-mono text-pale-gold opacity-80">Scientists call this: Eccentricity</span>
          </div>

          <p className="text-sm md:text-base text-stardust-white opacity-90 leading-relaxed">
            Earth's orbit slowly stretches from almost circular to more oval-shaped,
            and back again. This happens over about <strong className="text-pale-gold">100,000 years</strong>.
          </p>

          <p className="hidden md:block text-sm text-stardust-white opacity-75 leading-relaxed italic">
            Think of it like stretching a rubber band — when the orbit is more oval,
            Earth sometimes gets closer to the Sun, and sometimes farther away.
          </p>

          <StorySlider
            label="Stretch the orbit"
            scienceName="Eccentricity"
            value={eccentricity}
            onChange={(v) => {
              // Any real input — pointer or keyboard — takes over from the
              // scroll scrub; programmatic scrub updates never fire onChange.
              setUserOwned(true);
              onEccentricityChange(v);
            }}
            min={MIN}
            max={MAX}
            step={0.001}
            hint="The orbit stretches as you scroll — or grab the dial"
            minLabel="Rounder orbit"
            maxLabel="More oval orbit"
            todayMark={TODAY_ECC}
            snapToToday
            formatValue={(nextValue) => nextValue.toFixed(3)}
            onPointerDown={() => setUserOwned(true)}
          />

          {/* The payoff for watching (or playing): why this matters */}
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
                "More oval orbit",
                "Earth gets closer to the Sun at one point, farther at another",
                "This amplifies the effect of the other two cycles (~5% more/less sunlight)",
              ]}
            />
          </div>
        </div>
      </div>
    </StorySection>
  );
}
