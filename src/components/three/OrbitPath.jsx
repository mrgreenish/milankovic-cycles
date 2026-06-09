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

export const OrbitPath = React.memo(function OrbitPath({
  eccentricity,
  showLabels = true,
  currentSection = 0,
  spotlight = null,
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

      {showDistanceLabels && (
        <>
          <Html position={[-a + 2, 2, 0]} center>
            <div
              style={{
                color: "#ef4444",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                whiteSpace: "nowrap",
                border: "1px solid rgba(239, 68, 68, 0.4)",
              }}
            >
              ← Farther from Sun
            </div>
          </Html>
          <Html position={[a - 2, 2, 0]} center>
            <div
              style={{
                color: "#fbbf24",
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "600",
                whiteSpace: "nowrap",
                border: "1px solid rgba(251, 191, 36, 0.4)",
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
            fontWeight: "500",
            whiteSpace: "nowrap",
            opacity: 0.7 * orbitFade,
            textShadow: "0 0 8px rgba(251, 191, 36, 0.5)",
          }}
        >
          Sun ☀️
        </div>
      </Html>

      {seasonalMarkers.map((position, index) => (
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
          {showLabels && (
            <Html position={[0, 1, 0]} center>
              <div
                style={{
                  color: "white",
                  backgroundColor: "rgba(205, 175, 125, 0.6)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(232, 208, 169, 0.8)",
                  textShadow: "0 0 10px rgba(232, 208, 169, 1)",
                  boxShadow: "0 0 20px rgba(205, 175, 125, 0.5)",
                  opacity: markerFade,
                }}
              >
                {seasonLabels[index]}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
});
