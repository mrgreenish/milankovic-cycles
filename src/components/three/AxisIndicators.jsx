"use client";
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html, Line } from "@react-three/drei";

export const AxisIndicators = React.memo(function AxisIndicators() {
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

  useEffect(() => {
    return () => {
      arrow.line.geometry.dispose();
      arrow.line.material.dispose();
      arrow.cone.geometry.dispose();
      arrow.cone.material.dispose();
    };
  }, [arrow]);

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
export function PrecessionCone({ axialTilt, precession, visible }) {
  const { conePoints, spokeLines, markerPos } = useMemo(() => {
    const tiltRad = THREE.MathUtils.degToRad(axialTilt);
    const axisLength = 5;
    const radius = axisLength * Math.sin(tiltRad);
    const height = axisLength * Math.cos(tiltRad);
    const origin = new THREE.Vector3(0, 0, 0);

    // Dashed circle at the rim of the cone (wobble path)
    const pts = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)));
    }

    // 8 evenly-spaced spokes from origin up to the rim — makes the cone 3D shape obvious
    const spokes = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      spokes.push([
        origin.clone(),
        new THREE.Vector3(radius * Math.cos(angle), height, radius * Math.sin(angle)),
      ]);
    }

    // Current axis-tip position on the cone rim
    const precRad = THREE.MathUtils.degToRad(precession);
    const mx = radius * Math.cos(precRad);
    const mz = radius * Math.sin(precRad);

    return { conePoints: pts, spokeLines: spokes, markerPos: [mx, height, mz] };
  }, [axialTilt, precession]);

  if (!visible) return null;

  return (
    <group>
      {/* Cone spokes from Earth centre to rim — shows the 3D cone shape */}
      {spokeLines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="#cdaf7d"
          lineWidth={1}
          transparent
          opacity={0.18}
        />
      ))}

      {/* Dashed circle at rim — the wobble path */}
      <Line
        points={conePoints}
        color="#e8d0a9"
        lineWidth={2}
        transparent
        opacity={0.55}
        dashed
        dashSize={0.3}
        gapSize={0.2}
      />

      {/* Vertical "true north" reference — so you can see the axis leaning away */}
      <Line
        points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5.2, 0)]}
        color="#4a9eff"
        lineWidth={1}
        transparent
        opacity={0.3}
        dashed
        dashSize={0.25}
        gapSize={0.25}
      />

      {/* Bright marker dot at current axis-tip position */}
      <mesh position={markerPos}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={markerPos} scale={2.2}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
