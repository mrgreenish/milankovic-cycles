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
            Earth doesn't spin straight up — it leans to one side. This lean changes
            between 22.1° and 24.5° over about <strong className="text-pale-gold">41,000 years</strong>.
          </p>

          <p className="text-sm text-stardust-white opacity-60 leading-relaxed italic">
            Imagine tilting a lamp over your desk — the more you tilt it, the more one
            side gets bright light while the other side gets less. That's what happens
            with Earth's seasons.
          </p>

          <StorySlider
            label="Tilt Earth's axis"
            scienceName="Obliquity"
            value={axialTilt}
            onChange={onAxialTiltChange}
            min={22.1}
            max={24.5}
            step={0.1}
            hint="Watch Earth's axis tilt in the 3D view"
          />

          <TemperatureIndicator temperature={temperature} />

          <CauseEffectCard
            items={[
              "More tilt = more extreme seasons",
              "Hotter summers can melt more ice; colder winters dump more snow",
              "At maximum tilt, northern summers get enough extra heat to melt ice sheets",
            ]}
          />
        </div>
      </div>
    </StorySection>
  );
}
