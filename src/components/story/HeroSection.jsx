"use client";
import React from "react";
import { StorySection } from "./StorySection";

const CYCLES = [
  { name: "The Stretch", period: "100,000-year cycle", section: 2 },
  { name: "The Lean", period: "41,000-year cycle", section: 3 },
  { name: "The Wobble", period: "26,000-year cycle", section: 4 },
];

export function HeroSection({ onInView }) {
  const jumpTo = (i) => {
    document
      .getElementById(`section-${i}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <StorySection id={0} onInView={onInView} className="justify-center">
      <div className="w-full max-w-4xl mx-auto px-8 text-center">
        <h1 className="text-6xl md:text-8xl lg:text-9xl mb-6 leading-[0.95] text-balance">
          Why Do Ice Ages Happen?
        </h1>
        <p className="text-xl md:text-2xl text-stardust-white opacity-80 mb-3 leading-relaxed">
          The answer is written in the shape of Earth's orbit.
        </p>
        <p className="text-xs md:text-sm font-mono tracking-wider text-antique-brass mb-12">
          Built by Milutin Milanković's great-grandson
        </p>

        {/* The three cycles — a tease of the journey, each one a shortcut */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {CYCLES.map((cycle) => (
            <button
              key={cycle.section}
              onClick={() => jumpTo(cycle.section)}
              className="group border border-antique-brass/30 rounded-lg px-4 py-2.5 bg-deep-space/50 backdrop-blur-sm hover:border-antique-brass/70 hover:bg-midnight-blue/60 transition-all text-left"
            >
              <span className="block font-serif text-base md:text-lg text-pale-gold leading-snug">
                {cycle.name}
              </span>
              <span className="block text-[11px] font-mono text-stardust-white/60 group-hover:text-stardust-white/80 transition-colors">
                {cycle.period}
              </span>
            </button>
          ))}
        </div>

        {/* Custom scroll indicator — descending line */}
        <div className="scroll-indicator mt-4 text-stardust-white opacity-50 flex flex-col items-center gap-2">
          <span className="text-xs font-mono tracking-widest uppercase">
            Scroll to explore
          </span>
          <div className="w-px h-12 scroll-line" />
        </div>
      </div>
    </StorySection>
  );
}
