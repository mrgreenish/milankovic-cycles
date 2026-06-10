"use client";
import React, { useRef, useEffect } from "react";

export function StorySection({
  id,
  children,
  className = "",
  onInView,
  pinned = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !onInView) return;

    // Use rootMargin to create a detection zone in the middle 40% of the viewport
    // This prevents multiple sections from triggering at once
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onInView(id);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "-30% 0px -30% 0px",
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id, onInView]);

  return (
    <section
      ref={ref}
      id={`section-${id}`}
      className={`story-section relative ${
        pinned ? "story-section--pinned" : ""
      }`}
    >
      {/* Pinned sections are taller than the viewport; this inner wrapper
          sticks while the scroll drives the 3D scene behind it. */}
      <div
        className={`story-sticky ${
          pinned ? "sticky top-0" : ""
        } flex items-center ${className}`}
      >
        {children}
      </div>
    </section>
  );
}
