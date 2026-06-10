"use client";
import React, { useEffect, useState } from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TODAY_PREC } from "@/lib/parameterCopy";
import { useScrollScrub, scrubRevolution } from "@/lib/useScrollScrub";

export function PrecessionSection({ precession, onPrecessionChange, onInView }) {
  const [userOwned, setUserOwned] = useState(false);
  const scrub = useScrollScrub("section-4", { enabled: !userOwned });
  const revealed = userOwned || scrub > 0.35;

  useEffect(() => {
    if (userOwned) return;
    onPrecessionChange(scrubRevolution(scrub));
  }, [scrub, userOwned, onPrecessionChange]);

  return (
    <StorySection id={4} onInView={onInView} pinned>
      <div className="w-full max-w-lg px-4 md:px-12 py-4 md:py-8">
        <div className="observatory-panel p-4 md:p-8 space-y-3 md:space-y-5">
          <div>
            <h2 className="text-2xl md:text-4xl mb-1">The Wobble</h2>
            <span className="text-sm font-mono text-pale-gold opacity-80">Scientists call this: Axial Precession</span>
          </div>

          <p className="text-sm md:text-base text-stardust-white opacity-90 leading-relaxed">
            Earth's tilt doesn't just lean — the <em>direction</em> of that lean slowly
            traces a circle, like a spinning top winding down. One full cycle takes
            about <strong className="text-pale-gold">26,000 years</strong>.
          </p>

          <p className="hidden md:block text-sm text-stardust-white opacity-75 leading-relaxed italic">
            The dashed circle in the 3D view is the path the axis traces.
            This wobble changes which season happens when Earth is closest to the Sun.
            Right now, northern winters happen near the closest point.
            In 13,000 years, northern summers will instead.
          </p>

          <StorySlider
            label="Spin the wobble"
            scienceName="Precession"
            value={precession}
            onChange={(v) => {
              // Any real input — pointer or keyboard — takes over from the
              // scroll scrub; programmatic scrub updates never fire onChange.
              setUserOwned(true);
              onPrecessionChange(v);
            }}
            min={0}
            max={360}
            step={1}
            hint="The axis tip circles the dashed ring as you scroll — or grab the dial"
            minLabel="Today's orientation"
            maxLabel="Full cycle (back to start)"
            todayMark={TODAY_PREC}
            snapToToday
            formatValue={(nextValue) => `${nextValue.toFixed(0)}°`}
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
                "Wobble changes which hemisphere faces the Sun at closest approach",
                "When northern summers get more sunlight, ice sheets melt faster",
                "A key trigger for starting and ending ice ages",
              ]}
            />
          </div>
        </div>
      </div>
    </StorySection>
  );
}
