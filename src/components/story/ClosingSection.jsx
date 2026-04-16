"use client";
import React, { useState } from "react";
import Link from "next/link";
import { StorySection } from "./StorySection";
import { ERAS } from "@/lib/eraLookup";

function buildSnapshotLine(snapshot) {
  if (!snapshot) return null;
  const { temperature, eraKey } = snapshot;
  // Comparison is against today's 65°N annual mean (~-8°C in the playground
  // calibration), the same scale as the TemperaturePod reading.
  const todayTemp = -8;
  const delta = temperature - todayTemp;
  const absDelta = Math.abs(delta);
  const direction = delta > 0 ? "warmer" : "colder";
  const magnitude =
    absDelta < 0.5
      ? "nearly identical to"
      : `${absDelta.toFixed(1)}°C ${direction} than`;
  const eraRef =
    eraKey && ERAS[eraKey] ? ` — like ${ERAS[eraKey].shortLabel}` : "";
  return `You tuned a climate ${magnitude} today${eraRef}.`;
}

export function ClosingSection({ onInView, snapshot }) {
  const [copied, setCopied] = useState(false);
  const snapshotLine = buildSnapshotLine(snapshot);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = "I just learned why ice ages happen — it's all about Earth's orbit! Check out this interactive explainer:";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Why Do Ice Ages Happen?",
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
    }
  };

  return (
    <StorySection id={7} onInView={onInView} className="justify-center">
      <div className="w-full max-w-2xl mx-auto px-6 text-center space-y-8">
        {/* Summary of what they learned */}
        <div className="observatory-panel p-6 space-y-3">
          {snapshotLine && (
            <p className="text-sm text-antique-brass font-mono uppercase tracking-wider opacity-80">
              {snapshotLine}
            </p>
          )}
          <p className="text-lg text-pale-gold font-medium">
            You now understand the 3 orbital cycles that drive ice ages
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-stardust-white opacity-60 font-mono">
            <span>The Stretch</span>
            <span className="opacity-30">/</span>
            <span>The Lean</span>
            <span className="opacity-30">/</span>
            <span>The Wobble</span>
          </div>
        </div>

        {/* Quote */}
        <div className="observatory-panel p-8 md:p-12 space-y-6">
          <blockquote className="text-2xl md:text-3xl text-pale-gold leading-relaxed italic">
            "The purpose of the theory is to explain the alternation of ice ages
            and warm periods — not by invoking catastrophes, but through the
            slow, relentless changes in Earth's orbit."
          </blockquote>
          <p className="text-sm text-stardust-white opacity-50">
            — Milutin Milankovic, who figured this out in the 1920s with just a
            pencil, paper, and years of calculations.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/about"
            className="celestial-button text-center px-6 py-3"
          >
            About Milanković
          </Link>
          <Link
            href="/faq"
            className="celestial-button text-center px-6 py-3"
          >
            Deeper Questions
          </Link>
          <button
            onClick={handleShare}
            className="celestial-button text-center px-6 py-3"
          >
            {copied ? "Copied!" : "Share This"}
          </button>
        </div>

        {/* Start over */}
        <button
          onClick={scrollToTop}
          className="text-sm text-stardust-white opacity-50 hover:opacity-90 transition-opacity flex items-center gap-2 mx-auto"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          Start over from the beginning
        </button>

        {/* Personal connection */}
        <div className="pt-4 border-t border-stardust-white/10">
          <p className="text-sm text-stardust-white opacity-50">
            Built by Filip van Harreveld — great-grandson of Milutin Milankovic
          </p>
        </div>
      </div>
    </StorySection>
  );
}
