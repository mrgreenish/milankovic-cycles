"use client";
import React from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TemperatureIndicator } from "./TemperatureIndicator";

export function PrecessionSection({ precession, onPrecessionChange, temperature, onInView }) {
  return (
    <StorySection id={4} onInView={onInView}>
      <div className="w-full max-w-lg px-4 md:px-12 py-4 md:py-8 md:ml-auto">
        <div className="observatory-panel p-4 md:p-8 space-y-3 md:space-y-6">
          <div>
            <h2 className="text-2xl md:text-4xl mb-1">The Wobble</h2>
            <span className="text-sm font-mono text-pale-gold opacity-50">Scientists call this: Axial Precession</span>
          </div>

          <p className="text-sm md:text-base text-stardust-white opacity-80 leading-relaxed">
            Earth's tilt doesn't just lean — the <em>direction</em> of that lean slowly
            traces a circle, like a spinning top winding down. One full cycle takes
            about <strong className="text-pale-gold">26,000 years</strong>.
          </p>

          <p className="hidden md:block text-sm text-stardust-white opacity-60 leading-relaxed italic">
            Watch the dashed circle in the 3D view — that's the path the axis traces.
            This wobble changes which season happens when Earth is closest to the Sun.
            Right now, northern winters happen near the closest point.
            In 13,000 years, northern summers will instead.
          </p>

          <StorySlider
            label="Spin the wobble"
            scienceName="Precession"
            value={precession}
            onChange={onPrecessionChange}
            min={0}
            max={360}
            step={1}
            hint="Watch the axis tip move along the dashed circle above"
            minLabel="Today's orientation"
            maxLabel="Full cycle (back to start)"
            formatValue={(nextValue) => `${nextValue.toFixed(0)}°`}
          />

          <TemperatureIndicator temperature={temperature} />

          <div className="hidden md:block">
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
