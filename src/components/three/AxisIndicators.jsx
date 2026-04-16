"use client";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";

export const AxisIndicators = React.memo(function AxisIndicators({ spotlight = null }) {
  const arrow = useMemo(
    () =>
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        5,
        0xffffff,
        0.8,
        0.5
      ),
    []
  );

  const arrowOpacity =
    !spotlight
      ? 1
      : spotlight === "axialTilt"
      ? 1
      : spotlight === "precession"
      ? 0.85
      : spotlight === "eccentricity"
      ? 0.2
      : 1;

  const arrowColor =
    spotlight === "axialTilt" ? 0xfbbf24 : 0xffffff;

  useEffect(() => {
    arrow.line.material.transparent = true;
    arrow.cone.material.transparent = true;
    arrow.line.material.opacity = arrowOpacity;
    arrow.cone.material.opacity = arrowOpacity;
    arrow.line.material.color.setHex(arrowColor);
    arrow.cone.material.color.setHex(arrowColor);
    arrow.line.material.needsUpdate = true;
    arrow.cone.material.needsUpdate = true;
  }, [arrow, arrowOpacity, arrowColor]);

  useEffect(() => {
    return () => {
      arrow.line.geometry.dispose();
      arrow.line.material.dispose();
      arrow.cone.geometry.dispose();
      arrow.cone.material.dispose();
    };
  }, [arrow]);

  const labelOpacity = arrowOpacity;

  return (
    <group>
      <primitive object={arrow} />
      <Html position={[0, 5.2, 0]} center>
        <div
          style={{
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "'Courier New', Courier, monospace",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            opacity: labelOpacity,
            transition: "opacity 300ms ease",
          }}
        >
          Rotation Axis
        </div>
      </Html>
    </group>
  );
});

/**
 * Wobble cone — a dashed circle showing the path the axis tip traces
 * as precession changes. Rendered OUTSIDE the Earth's quaternion group
 * so it stays fixed while the axis moves through it.
 */
export function PrecessionCone({ axialTilt, precession, visible, spotlight = null }) {
  const { conePoints, spokeLines, markerPos } = useMemo(() => {
    const tiltRad = THREE.MathUtils.degToRad(axialTilt);
    const axisLength = 5;
    const radius = axisLength * Math.sin(tiltRad);
    const height = axisLength * Math.cos(tiltRad);
    const origin = new THREE.Vector3(0, 0, 0);

    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
    }

    const spokes = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      spokes.push([
        origin.clone(),
        new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)),
      ]);
    }

    const precRad = THREE.MathUtils.degToRad(precession);
    const mx = radius * Math.cos(precRad);
    const mz = radius * Math.sin(precRad);

    return { conePoints: pts, spokeLines: spokes, markerPos: [mx, height, mz] };
  }, [axialTilt, precession]);

  // Hide outright when a non-precession parameter has focus — we want the user
  // to see only the parameter they're manipulating.
  const hiddenBySpotlight =
    spotlight === "eccentricity" || spotlight === "axialTilt";

  if (!visible || hiddenBySpotlight) return null;

  const boost = spotlight === "precession" ? 1.4 : 1;
  const baseSpokeOp = 0.18;
  const baseRimOp = 0.55;
  const baseNorthOp = 0.3;

  return (
    <group>
      {spokeLines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#cdaf7d"
          lineWidth={1 * boost}
          transparent
          opacity={Math.min(1, baseSpokeOp * boost)}
        />
      ))}

      <Line
        points={conePoints}
        color="#e8d0a9"
        lineWidth={2 * boost}
        transparent
        opacity={Math.min(1, baseRimOp * boost)}
        dashed
        dashSize={0.3}
        gapSize={0.2}
      />

      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5.2, 0)]}
        color="#4a9eff"
        lineWidth={1}
        transparent
        opacity={baseNorthOp}
        dashed
        dashSize={0.25}
        gapSize={0.25}
      />

      <mesh position={markerPos}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={markerPos} scale={spotlight === "precession" ? 2.8 : 2.2}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={spotlight === "precession" ? 0.45 : 0.25}
        />
      </mesh>
    </group>
  );
}
