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

export function StoryProgressBar({ currentSection, totalSections }) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-1">
      {Array.from({ length: totalSections }, (_, i) => (
        <button
          key={i}
          onClick={() => {
            const el = document.getElementById(`section-${i}`);
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="group flex items-center gap-2 py-1"
          aria-label={`Go to ${SECTION_LABELS[i]}`}
        >
          {/* Label - visible on hover or when active */}
          <span
            className={`text-xs font-mono whitespace-nowrap transition-all duration-300 ${
              currentSection === i
                ? "opacity-80 text-pale-gold translate-x-0"
                : "opacity-0 group-hover:opacity-60 text-stardust-white translate-x-2 group-hover:translate-x-0"
            }`}
          >
            {SECTION_LABELS[i]}
          </span>

          {/* Dot connected by line */}
          <div className="relative flex flex-col items-center">
            <div
              className={`rounded-full transition-all duration-500 ${
                currentSection === i
                  ? "w-3 h-3 bg-antique-brass shadow-[0_0_8px_hsla(36,60%,58%,0.6)]"
                  : i < currentSection
                    ? "w-2 h-2 bg-antique-brass/50"
                    : "w-2 h-2 bg-stardust-white/20 group-hover:bg-stardust-white/50"
              }`}
            />
            {/* Connecting line between dots */}
            {i < totalSections - 1 && (
              <div
                className={`w-px h-3 mt-1 transition-colors duration-500 ${
                  i < currentSection ? "bg-antique-brass/30" : "bg-stardust-white/10"
                }`}
              />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
