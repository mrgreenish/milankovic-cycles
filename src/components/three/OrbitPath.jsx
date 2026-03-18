"use client";
import React from "react";
import * as THREE from "three";
import { Line, Html } from "@react-three/drei";

export function OrbitPath({ eccentricity, showLabels = true, currentSection = 0 }) {
  const a = 20;
  const b = a * (1 - 2 * eccentricity);
  const baselineB = a * (1 - 2 * 0.0167);

  const points = [];
  const baselinePoints = [];
  const seasonalMarkers = [];

  for (let theta = 0; theta <= Math.PI * 2; theta += 0.02) {
    const x = a * Math.cos(theta);
    const currentZ = b * Math.sin(theta);
    const baselineZ = baselineB * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, currentZ));
    baselinePoints.push(new THREE.Vector3(x, 0, baselineZ));
  }

  seasonalMarkers.push(new THREE.Vector3(a, 0, 0));
  seasonalMarkers.push(new THREE.Vector3(0, 0, b));
  seasonalMarkers.push(new THREE.Vector3(-a, 0, 0));
  seasonalMarkers.push(new THREE.Vector3(0, 0, -b));

  const seasonLabels = [
    "Winter (N. Hemisphere)",
    "Spring (N. Hemisphere)",
    "Summer (N. Hemisphere)",
    "Fall (N. Hemisphere)",
  ];

  // Show "closer" / "farther" labels during eccentricity section (section 2)
  const showDistanceLabels = currentSection === 2;

  return (
    <group>
      <Line
        points={baselinePoints}
        color="#2d4661"
        lineWidth={0.6}
        transparent={false}
        opacity={1}
        dashed
        dashSize={0.15}
        gapSize={0.15}
      />
      <Line
        points={baselinePoints}
        color="white"
        lineWidth={1.2}
        transparent
        opacity={0.5}
        dashed
        dashSize={0.2}
        gapSize={0.2}
      />
      <Line
        points={baselinePoints}
        color="#375a82"
        lineWidth={1.8}
        transparent
        opacity={0.2}
        dashed
        dashSize={0.25}
        gapSize={0.25}
      />

      <Line points={points} color="#cdaf7d" lineWidth={2} transparent={false} opacity={1} />
      <Line points={points} color="#e8d0a9" lineWidth={4} transparent opacity={0.7} />
      <Line points={points} color="#e8d0a9" lineWidth={6} transparent opacity={0.4} />

      {/* Distance labels for eccentricity section */}
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

      {/* Sun label */}
      <Html position={[0, 3, 0]} center>
        <div
          style={{
            color: "#fbbf24",
            fontSize: "11px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            opacity: 0.7,
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
              transparent={false}
              opacity={1}
            />
          </mesh>
          <mesh scale={1.2}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh scale={1.4}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
              transparent
              opacity={0.3}
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
}
