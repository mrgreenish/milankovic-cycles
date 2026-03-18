"use client";
import React, { useRef, useEffect } from "react";

export function StorySection({ id, children, className = "", onInView }) {
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
      className={`story-section relative min-h-screen flex items-center ${className}`}
    >
      {children}
    </section>
  );
}
