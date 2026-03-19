"use client";
import React from "react";
import { StorySection } from "./StorySection";
import { StorySlider } from "./StorySlider";
import { CauseEffectCard } from "./CauseEffectCard";
import { TemperatureIndicator } from "./TemperatureIndicator";

export function AxialTiltSection({ axialTilt, onAxialTiltChange, temperature, onInView }) {
  return (
    <StorySection id={3} onInView={onInView}>
      <div className="w-full max-w-lg px-6 md:px-12 py-8 md:ml-auto">
        <div className="observatory-panel p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-3xl md:text-4xl mb-1">The Lean</h2>
            <span className="text-sm font-mono text-pale-gold opacity-50">Scientists call this: Obliquity / Axial Tilt</span>
          </div>

          <p className="text-base text-stardust-white opacity-80 leading-relaxed">
            Earth does not spin straight up. Its axis leans, and that lean shifts
            between 22.1° and 24.5° over about <strong className="text-pale-gold">41,000 years</strong>.
          </p>

          <p className="text-sm text-stardust-white opacity-60 leading-relaxed italic">
            More lean makes summers and winters more intense. Less lean softens the
            seasons. Today, Earth sits near <strong className="text-pale-gold not-italic">23.4°</strong>.
          </p>

          <StorySlider
            label="Tilt Earth's axis"
            scienceName="Obliquity"
            value={axialTilt}
            onChange={onAxialTiltChange}
            min={22.1}
            max={24.5}
            step={0.1}
            hint="Watch the white axis line lean farther from vertical"
            minLabel="Less tilt, milder seasons"
            maxLabel="More tilt, stronger seasons"
            formatValue={(nextValue) => `${nextValue.toFixed(1)}°`}
          />

          <TemperatureIndicator temperature={temperature} />

          <CauseEffectCard
            items={[
              "More tilt creates bigger summer and winter contrasts",
              "Stronger northern summers can melt leftover winter snow and ice",
              "That summer melt matters most for whether ice sheets grow or retreat",
            ]}
          />
        </div>
      </div>
    </StorySection>
  );
}
