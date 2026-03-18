"use client";
import React from "react";

const SECTION_LABELS = [
  "Start",
  "Earth & Sun",
  "The Stretch",
  "The Lean",
  "The Wobble",
  "Combined",
  "Explore",
  "End",
];

const SECTION_ICONS = [
  "🌍",
  "☀️",
  "⭕",
  "📐",
  "🔄",
  "🔗",
  "🎮",
  "✨",
];

export function StoryProgressBar({ currentSection, totalSections }) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3">
      {Array.from({ length: totalSections }, (_, i) => (
        <button
          key={i}
          onClick={() => {
            const el = document.getElementById(`section-${i}`);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="group flex items-center gap-2"
          aria-label={`Go to ${SECTION_LABELS[i]}`}
        >
          {/* Label - visible on hover or when active */}
          <span
            className={`text-xs whitespace-nowrap transition-all duration-300 ${
              currentSection === i
                ? "opacity-80 text-pale-gold translate-x-0"
                : "opacity-0 group-hover:opacity-70 text-stardust-white translate-x-2 group-hover:translate-x-0"
            }`}
          >
            {SECTION_LABELS[i]}
          </span>

          {/* Dot with icon on hover */}
          <div className="relative">
            <div
              className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                currentSection === i
                  ? "w-4 h-4 bg-antique-brass shadow-lg shadow-antique-brass/50"
                  : "w-2.5 h-2.5 bg-stardust-white/30 group-hover:bg-stardust-white/60 group-hover:w-4 group-hover:h-4"
              }`}
            >
              <span
                className={`text-[8px] leading-none transition-opacity duration-200 ${
                  currentSection === i ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {SECTION_ICONS[i]}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
