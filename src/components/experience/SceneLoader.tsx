"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import { track } from "@vercel/analytics";
import type { OrbitScale, OrbitalParameters } from "@/lib/orbital/types";
import { OrbitalPoster } from "./OrbitalPoster";

const SceneClient = dynamic(() => import("./SceneClient"), {
  ssr: false,
  loading: () => null,
});

class SceneErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SceneLoader({
  parameters,
  scale,
  chapter,
  reducedMotion,
}: {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  chapter: string;
  reducedMotion: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const poster = <OrbitalPoster parameters={parameters} scale={scale} />;
  const handleFailure = () => {
    setFailed(true);
    track("webgl_fallback");
  };

  return (
    <div
      className="scene-viewport"
      role="img"
      aria-label="Interactive orbital diagram showing Earth, its tilted axis, and the Sun at one focus of the orbit"
      data-ready={ready && !failed ? "true" : "false"}
    >
      <div className="scene-viewport__poster">{poster}</div>
      {!failed && !reducedMotion ? (
        <SceneErrorBoundary fallback={poster} onFailure={handleFailure}>
          <div className="scene-viewport__canvas">
            <SceneClient
              parameters={parameters}
              scale={scale}
              chapter={chapter}
              reducedMotion={reducedMotion}
              onReady={() => setReady(true)}
              onFailure={handleFailure}
            />
          </div>
        </SceneErrorBoundary>
      ) : null}
    </div>
  );
}
