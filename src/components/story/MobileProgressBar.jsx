"use client";
import React, { useEffect, useState } from "react";

/**
 * Thin scroll-progress bar pinned to the top of the viewport.
 * Mobile counterpart to the desktop StoryProgressBar rail (hidden < md).
 */
export function MobileProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = null;
    const update = () => {
      frame = null;
      const max =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="fixed top-0 inset-x-0 h-1 z-50 md:hidden bg-stardust-white/10"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-aged-copper to-antique-brass"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
