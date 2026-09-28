"use client";
import { useEffect, useRef } from "react";

/** Share the measured sticky stack with anchor navigation and focus scrolling. */
export function useStickyLayout(kind: "tour" | "lab") {
  const offset = useRef(80);
  useEffect(() => {
    const selectors =
      kind === "tour"
        ? [".site-header", ".tour-progress", ".tour-scene-column"]
        : [".site-header", ".lab-scene-column", ".lab-result"];
    const elements = selectors
      .map((selector) => document.querySelector<HTMLElement>(selector))
      .filter((element): element is HTMLElement => element !== null);
    const measure = () => {
      const mobile = window.matchMedia("(max-width: 980px)").matches;
      const heights = elements.map((element) => {
        if (!mobile && element.matches(".tour-scene-column, .lab-scene-column"))
          return 0;
        return getComputedStyle(element).position === "sticky"
          ? element.getBoundingClientRect().height
          : 0;
      });
      offset.current =
        Math.ceil(heights.reduce((total, height) => total + height, 0)) + 16;
      document.documentElement.style.setProperty(
        "--reading-offset",
        `${offset.current}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    elements.forEach((element) => observer.observe(element));
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--reading-offset");
    };
  }, [kind]);
  return offset;
}
