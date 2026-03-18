"use client";
import React from "react";
import { StorySection } from "./StorySection";

export function HeroSection({ onInView }) {
  return (
    <StorySection id={0} onInView={onInView} className="justify-center">
      <div className="w-full max-w-2xl mx-auto px-6 text-center">
        <h1 className="text-5xl md:text-7xl mb-6 leading-tight">
          Why Do Ice Ages Happen?
        </h1>
        <p className="text-xl md:text-2xl text-stardust-white opacity-70 mb-8 leading-relaxed">
          The answer is written in the shape of Earth's orbit.
        </p>

        {/* What you'll learn mini-outline */}
        <div className="max-w-sm mx-auto text-left space-y-3 mb-12 opacity-60">
          <div className="flex items-start gap-3">
            <span className="text-pale-gold text-lg mt-0.5">①</span>
            <p className="text-sm text-stardust-white leading-relaxed">
              You'll learn about <strong className="text-pale-gold">3 slow changes</strong> in Earth's orbit
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-pale-gold text-lg mt-0.5">②</span>
            <p className="text-sm text-stardust-white leading-relaxed">
              Each one takes <strong className="text-pale-gold">thousands of years</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-pale-gold text-lg mt-0.5">③</span>
            <p className="text-sm text-stardust-white leading-relaxed">
              Together, they <strong className="text-pale-gold">cause ice ages</strong>
            </p>
          </div>
        </div>

        <div className="animate-bounce mt-4 text-stardust-white opacity-40">
          <svg
            className="w-8 h-8 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
          <span className="text-sm mt-2 block">Scroll to explore</span>
        </div>
      </div>
    </StorySection>
  );
}
