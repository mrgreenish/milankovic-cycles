"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import { Line, Html } from "@react-three/drei";

const A = 20;
const BASELINE_B = A * (1 - 2 * 0.0167);

// The baseline (today) ellipse never changes — build it once.
const BASELINE_POINTS = (() => {
  const pts = [];
  for (let theta = 0; theta <= Math.PI * 2; theta += 0.02) {
    pts.push(new THREE.Vector3(A * Math.cos(theta), 0, BASELINE_B * Math.sin(theta)));
  }
  return pts;
})();

const SEASON_LABELS = [
  "Winter (N. Hemisphere)",
  "Spring (N. Hemisphere)",
  "Summer (N. Hemisphere)",
  "Fall (N. Hemisphere)",
];

// Shared chip styling for every in-scene annotation — observatory style,
// deliberately glow-free so labels never wash out the UI panels above them.
const labelChipStyle = {
  color: "hsl(35, 60%, 76%)",
  backgroundColor: "hsla(230, 33%, 5%, 0.8)",
  padding: "3px 9px",
  borderRadius: "9999px",
  fontSize: "11px",
  fontFamily: "'Space Mono', 'Courier New', monospace",
  whiteSpace: "nowrap",
  border: "1px solid hsla(36, 60%, 58%, 0.35)",
  letterSpacing: "0.02em",
};

export const OrbitPath = React.memo(function OrbitPath({
  eccentricity,
  showLabels = true,
  currentSection = 0,
  spotlight = null,
  isMobile = false,
}) {
  const a = A;
  const b = a * (1 - 2 * eccentricity);

  // Rebuilding these allocates ~300 vectors and forces drei's Line to
  // recompute its geometry, so only do it when the shape actually changes.
  const { points, seasonalMarkers } = useMemo(() => {
    const pts = [];
    for (let theta = 0; theta <= Math.PI * 2; theta += 0.02) {
      pts.push(new THREE.Vector3(a * Math.cos(theta), 0, b * Math.sin(theta)));
    }
    return {
      points: pts,
      seasonalMarkers: [
        new THREE.Vector3(a, 0, 0),
        new THREE.Vector3(0, 0, b),
        new THREE.Vector3(-a, 0, 0),
        new THREE.Vector3(0, 0, -b),
      ],
    };
  }, [a, b]);

  const baselinePoints = BASELINE_POINTS;
  const seasonLabels = SEASON_LABELS;

  const showDistanceLabels = currentSection === 2;

  const orbitFade =
    !spotlight
      ? 1
      : spotlight === "eccentricity"
      ? 1
      : spotlight === "axialTilt"
      ? 0.3
      : spotlight === "precession"
      ? 0.45
      : 1;
  const boost = spotlight === "eccentricity" ? 1.15 : 1;
  const markerFade = orbitFade;

  return (
    <group>
      <Line
        points={baselinePoints}
        color="#2d4661"
        lineWidth={0.6}
        transparent
        opacity={1 * orbitFade}
        dashed
        dashSize={0.15}
        gapSize={0.15}
      />
      <Line
        points={baselinePoints}
        color="white"
        lineWidth={1.2}
        transparent
        opacity={0.5 * orbitFade}
        dashed
        dashSize={0.2}
        gapSize={0.2}
      />
      <Line
        points={baselinePoints}
        color="#375a82"
        lineWidth={1.8}
        transparent
        opacity={0.2 * orbitFade}
        dashed
        dashSize={0.25}
        gapSize={0.25}
      />

      <Line
        points={points}
        color="#cdaf7d"
        lineWidth={2 * boost}
        transparent
        opacity={1 * orbitFade}
      />
      <Line
        points={points}
        color="#e8d0a9"
        lineWidth={4 * boost}
        transparent
        opacity={Math.min(1, 0.7 * boost) * orbitFade}
      />
      <Line
        points={points}
        color="#e8d0a9"
        lineWidth={6 * boost}
        transparent
        opacity={Math.min(1, 0.4 * boost) * orbitFade}
      />

      {/* Pulled in from the orbit's extremes so they never clip the viewport
          edge or collide with the progress rail / narrative column. */}
      {showDistanceLabels && (
        <>
          <Html position={[-a * (isMobile ? 0.32 : 0.55), 2, 0]} center>
            <div
              style={{
                ...labelChipStyle,
                color: "#f3978f",
                border: "1px solid rgba(227, 105, 98, 0.45)",
              }}
            >
              ← Farther from Sun
            </div>
          </Html>
          <Html position={[a * (isMobile ? 0.32 : 0.55), 2, 0]} center>
            <div
              style={{
                ...labelChipStyle,
                color: "#fbbf24",
                border: "1px solid rgba(251, 191, 36, 0.45)",
              }}
            >
              Closer to Sun →
            </div>
          </Html>
        </>
      )}

      <Html position={[0, 3, 0]} center>
        <div
          style={{
            color: "#fbbf24",
            fontSize: "11px",
            fontFamily: "'Space Mono', 'Courier New', monospace",
            whiteSpace: "nowrap",
            opacity: 0.8 * orbitFade,
          }}
        >
          Sun
        </div>
      </Html>

      {seasonalMarkers.map((position, index) => {
        // Label budget: only Winter and Summer (the pair precession actually
        // swaps) carry labels in the story; Spring/Fall labels appear only on
        // the desktop playground where there's room to read all four.
        const isKeySeason = index === 0 || index === 2;
        const showThisLabel =
          showLabels &&
          (isKeySeason || (currentSection === 6 && !isMobile));
        return (
          <group key={index} position={position}>
            <mesh>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
                transparent
                opacity={1 * markerFade}
              />
            </mesh>
            <mesh scale={1.2}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
                transparent
                opacity={0.6 * markerFade}
              />
            </mesh>
            <mesh scale={1.4}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
                transparent
                opacity={0.3 * markerFade}
              />
            </mesh>
            {showThisLabel && (
              <Html position={[0, 1, 0]} center>
                <div style={{ ...labelChipStyle, opacity: markerFade }}>
                  {seasonLabels[index]}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
});
