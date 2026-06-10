"use client";
import React from "react";
import { StorySection } from "./StorySection";

export function EarthSunSection({ onInView }) {
  return (
    <StorySection id={1} onInView={onInView}>
      <div className="w-full max-w-lg px-6 md:px-12 py-8">
        <div className="observatory-panel p-6 md:p-8 space-y-5">
          <h2 className="text-3xl md:text-4xl mb-4">Earth &amp; Sun</h2>
          <p className="text-lg text-stardust-white opacity-90 leading-relaxed">
            Earth orbits the Sun once a year. But that orbit isn't a perfect
            circle — and it changes over thousands of years.
          </p>
          <p className="text-base text-stardust-white opacity-75 leading-relaxed">
            These slow changes in Earth's orbit affect how much sunlight
            different parts of our planet receive. Over time, this can trigger —
            or end — entire ice ages.
          </p>

          {/* Interactive hint */}
          <div className="observatory-panel p-4 bg-deep-space bg-opacity-50">
            <p className="text-sm text-pale-gold opacity-90 leading-relaxed">
              You're looking at Earth's real path — slightly oval, not a circle.
              Three slow changes to this picture decide when ice ages come and
              go. Scroll on to meet them.
            </p>
          </div>
        </div>
      </div>
    </StorySection>
  );
}
