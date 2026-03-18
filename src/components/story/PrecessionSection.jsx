"use client";
import React from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TemperatureIndicator } from "./TemperatureIndicator";

export function PrecessionSection({ precession, onPrecessionChange, temperature, onInView }) {
  return (
    <StorySection id={4} onInView={onInView}>
      <div className="w-full max-w-lg px-6 md:px-12 py-8">
        <div className="observatory-panel p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-3xl md:text-4xl mb-1">The Wobble</h2>
            <span className="text-sm font-mono text-pale-gold opacity-50">Scientists call this: Axial Precession</span>
          </div>

          <p className="text-base text-stardust-white opacity-80 leading-relaxed">
            Earth's axis slowly wobbles in a circle, like a spinning top that's winding
            down. One full wobble takes about <strong className="text-pale-gold">26,000 years</strong>.
          </p>

          <p className="text-sm text-stardust-white opacity-60 leading-relaxed italic">
            This wobble changes which season happens when Earth is closest to the Sun.
            Right now, Northern Hemisphere winter happens near the closest point.
            In 13,000 years, it'll be summer instead.
          </p>

          <StorySlider
            label="Spin the wobble"
            scienceName="Precession"
            value={precession}
            onChange={onPrecessionChange}
            min={0}
            max={360}
            step={1}
          />

          <TemperatureIndicator temperature={temperature} />

          <CauseEffectCard
            items={[
              "Wobble changes which hemisphere faces the Sun at closest approach",
              "When northern summers get more sunlight, ice sheets melt faster",
              "A key trigger for starting and ending ice ages",
            ]}
          />
        </div>
      </div>
    </StorySection>
  );
}
