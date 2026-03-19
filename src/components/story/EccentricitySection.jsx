"use client";
import React from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TemperatureIndicator } from "./TemperatureIndicator";

export function EccentricitySection({ eccentricity, onEccentricityChange, temperature, onInView }) {
  return (
    <StorySection id={2} onInView={onInView}>
      <div className="w-full max-w-lg px-6 md:px-12 py-8">
        <div className="observatory-panel p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-3xl md:text-4xl mb-1">The Stretch</h2>
            <span className="text-sm font-mono text-pale-gold opacity-50">Scientists call this: Eccentricity</span>
          </div>

          <p className="text-base text-stardust-white opacity-80 leading-relaxed">
            Earth's orbit slowly stretches from almost circular to more oval-shaped,
            and back again. This happens over about <strong className="text-pale-gold">100,000 years</strong>.
          </p>

          <p className="text-sm text-stardust-white opacity-60 leading-relaxed italic">
            Think of it like stretching a rubber band — when the orbit is more oval,
            Earth sometimes gets closer to the Sun, and sometimes farther away.
          </p>

          <StorySlider
            label="Stretch the orbit"
            scienceName="Eccentricity"
            value={eccentricity}
            onChange={onEccentricityChange}
            min={0.005}
            max={0.058}
            step={0.001}
            hint="Watch the orbit shape change above"
            minLabel="Rounder orbit"
            maxLabel="More oval orbit"
            formatValue={(nextValue) => nextValue.toFixed(3)}
          />

          <TemperatureIndicator temperature={temperature} />

          <CauseEffectCard
            items={[
              "More oval orbit",
              "Earth gets closer to the Sun at one point, farther at another",
              "This amplifies the effect of the other two cycles (~5% more/less sunlight)",
            ]}
          />
        </div>
      </div>
    </StorySection>
  );
}
