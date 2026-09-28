"use client";

import type { ReactNode } from "react";

export function SourceTable({ children }: { children: ReactNode }) {
  return (
    <div
      className="source-table-wrap"
      tabIndex={0}
      role="region"
      aria-label="Orbital reference values, scroll horizontally to see all columns"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        const direction =
          event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!direction || event.altKey || event.ctrlKey || event.metaKey)
          return;
        event.preventDefault();
        event.currentTarget.scrollBy({
          left: direction * 120,
          behavior: "instant",
        });
      }}
    >
      {children}
    </div>
  );
}
