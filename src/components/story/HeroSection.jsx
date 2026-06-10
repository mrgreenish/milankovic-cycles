"use client";
import React from "react";
import { StorySection } from "./StorySection";

export function HeroSection({ onInView }) {
  return (
    <StorySection id={0} onInView={onInView} className="justify-center">
      <div className="w-full max-w-3xl mx-auto px-8 text-center">
        <h1 className="text-5xl md:text-7xl lg:text-8xl mb-6 leading-[0.95]">
          Why Do Ice Ages Happen?
        </h1>
        <p className="text-xl md:text-2xl text-stardust-white opacity-70 mb-10 leading-relaxed">
          The answer is written in the shape of Earth's orbit.
        </p>

        {/* What you'll learn mini-outline */}
        <div className="max-w-sm mx-auto text-left space-y-3 mb-16 opacity-90">
          <div className="flex items-start gap-3">
            <span className="text-pale-gold text-base font-mono mt-0.5 opacity-70">01</span>
            <p className="text-base text-stardust-white leading-relaxed">
              You'll learn about <strong className="text-pale-gold">3 slow changes</strong> in Earth's orbit
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-pale-gold text-base font-mono mt-0.5 opacity-70">02</span>
            <p className="text-base text-stardust-white leading-relaxed">
              Each one takes <strong className="text-pale-gold">thousands of years</strong>
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-pale-gold text-base font-mono mt-0.5 opacity-70">03</span>
            <p className="text-base text-stardust-white leading-relaxed">
              Together, they <strong className="text-pale-gold">cause ice ages</strong>
            </p>
          </div>
        </div>

        {/* Custom scroll indicator — descending line */}
        <div className="scroll-indicator mt-4 text-stardust-white opacity-40 flex flex-col items-center gap-2">
          <span className="text-xs font-mono tracking-widest uppercase">Scroll to explore</span>
          <div className="w-px h-12 scroll-line" />
        </div>
      </div>
    </StorySection>
  );
}
