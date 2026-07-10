"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3 } from "three";
import {
  degreesToRadians,
  displayEccentricity,
  ellipseFocusDistance,
  ellipseSemiMinorAxis,
} from "@/lib/orbital/geometry";
import type { OrbitScale, OrbitalParameters } from "@/lib/orbital/types";

export type SceneClientProps = {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  chapter: string;
  reducedMotion: boolean;
  onReady?: () => void;
  onFailure?: () => void;
};

function InvalidateOnChange({ token }: { token: string }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => invalidate(), [invalidate, token]);
  return null;
}

function OrbitalModel({
  parameters,
  scale,
  chapter,
}: Pick<SceneClientProps, "parameters" | "scale" | "chapter">) {
  const a = 5.5;
  const eccentricity = displayEccentricity(parameters.eccentricity, scale);
  const b = ellipseSemiMinorAxis(a, eccentricity);
  const c = ellipseFocusDistance(a, eccentricity);

  const orbitPoints = useMemo(() => {
    const points: Vector3[] = [];
    for (let index = 0; index <= 160; index += 1) {
      const angle = (index / 160) * Math.PI * 2;
      points.push(
        new Vector3(a * Math.cos(angle) - c, 0, b * Math.sin(angle)),
      );
    }
    return points;
  }, [a, b, c]);

  const trueAnomaly = degreesToRadians(
    270 - parameters.earthPerihelionLongitudeDeg,
  );
  const radius =
    (a * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(trueAnomaly));
  const earthPosition: [number, number, number] = [
    radius * Math.cos(trueAnomaly),
    0,
    radius * Math.sin(trueAnomaly),
  ];

  const showAxis = chapter === "axis-tilt" || chapter === "axis-direction" || chapter === "together" || chapter === "recap";
  const showLatitude = chapter === "big-idea" || chapter === "together" || chapter === "recap";

  return (
    <>
      <ambientLight intensity={0.48} />
      <pointLight position={[0, 0.7, 0]} intensity={70} distance={18} color="#f6b065" />

      <Line points={orbitPoints} color="#d8b56a" opacity={0.78} transparent lineWidth={1.7} />

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 36, 36]} />
        <meshStandardMaterial color="#f08a4b" emissive="#f08a4b" emissiveIntensity={3.4} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.61, 24, 24]} />
        <meshBasicMaterial color="#f08a4b" transparent opacity={0.075} depthWrite={false} />
      </mesh>

      <group position={earthPosition} rotation={[0, degreesToRadians(parameters.earthPerihelionLongitudeDeg), 0]}>
        <group rotation={[0, 0, degreesToRadians(parameters.obliquityDeg)]}>
          <mesh>
            <sphereGeometry args={[0.34, 48, 48]} />
            <meshStandardMaterial color="#3d83bd" roughness={0.78} metalness={0.05} />
          </mesh>
          <mesh rotation={[Math.PI / 2.7, 0, 0.4]}>
            <torusGeometry args={[0.29, 0.035, 12, 72, 2.8]} />
            <meshStandardMaterial color="#9bcfc2" roughness={0.9} />
          </mesh>
          {showAxis ? (
            <Line points={[[0, -0.72, 0], [0, 0.72, 0]]} color="#f6f0e5" lineWidth={1.7} />
          ) : null}
          {showLatitude ? (
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.27, 0]}>
              <torusGeometry args={[0.2, 0.012, 8, 48]} />
              <meshBasicMaterial color="#85c7f2" />
            </mesh>
          ) : null}
        </group>
      </group>
    </>
  );
}

export default function SceneClient({
  parameters,
  scale,
  chapter,
  onReady,
  onFailure,
}: SceneClientProps) {
  const token = `${parameters.eccentricity}-${parameters.obliquityDeg}-${parameters.earthPerihelionLongitudeDeg}-${scale}-${chapter}`;

  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 6.7, 10.5], fov: 43, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x070a12, 0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onFailure?.();
          },
          { once: true },
        );
        onReady?.();
      }}
    >
      <InvalidateOnChange token={token} />
      <OrbitalModel parameters={parameters} scale={scale} chapter={chapter} />
    </Canvas>
  );
}

