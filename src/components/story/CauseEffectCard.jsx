"use client";
import React from "react";

export function CauseEffectCard({ items }) {
  return (
    <div className="observatory-panel p-4 space-y-0">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <div className="text-sm text-stardust-white leading-relaxed text-center py-2">
            {item}
          </div>
          {index < items.length - 1 && (
            <div className="flex justify-center text-pale-gold text-lg">
              ↓
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
