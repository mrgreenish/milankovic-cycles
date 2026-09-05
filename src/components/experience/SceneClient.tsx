"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Vector3 } from "three";
import {
  degreesToRadians,
  displayEccentricity,
  ellipseFocusDistance,
  ellipseSemiMinorAxis,
  latitudeCircleGeometry,
  summerSolsticeAxisVector,
} from "@/lib/orbital/geometry";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type {
  OrbitScale,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import { Earth } from "./space/Earth";
import { Sun } from "./space/Sun";
import { StarField } from "./space/StarField";
import { SceneRuntime, useGraphicsQuality } from "./space/SceneRuntime";
import { useSpaceTextures, type SpaceTextures } from "./space/textures";
import { QUALITY, type GraphicsQuality } from "./space/quality";

export type SceneClientProps = {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  chapter: string;
  focus: OrbitalVisualFocus;
  reducedMotion: boolean;
  onReady?: () => void;
  onFailure?: () => void;
};

const SEMI_MAJOR_AXIS = 5.5;

function ellipsePoints(eccentricity: number) {
  const semiMinorAxis = ellipseSemiMinorAxis(SEMI_MAJOR_AXIS, eccentricity);
  const focusDistance = ellipseFocusDistance(SEMI_MAJOR_AXIS, eccentricity);
  const points: Vector3[] = [];
  for (let index = 0; index <= 160; index += 1) {
    const angle = (index / 160) * Math.PI * 2;
    points.push(
      new Vector3(
        SEMI_MAJOR_AXIS * Math.cos(angle) - focusDistance,
        0,
        semiMinorAxis * Math.sin(angle),
      ),
    );
  }
  return points;
}

function summerSolsticePosition(
  eccentricity: number,
  perihelionLongitudeDeg: number,
): [number, number, number] {
  const trueAnomaly = degreesToRadians(270 - perihelionLongitudeDeg);
  const radius =
    (SEMI_MAJOR_AXIS * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(trueAnomaly));
  return [radius * Math.cos(trueAnomaly), 0, radius * Math.sin(trueAnomaly)];
}

function tiltArcPoints(
  tiltDeg: number,
  perihelionLongitudeDeg: number,
  radius: number,
) {
  const points: Vector3[] = [];
  for (let index = 0; index <= 28; index += 1) {
    const axis = summerSolsticeAxisVector({
      obliquityDeg: (tiltDeg * index) / 28,
      earthPerihelionLongitudeDeg: perihelionLongitudeDeg,
    });
    points.push(new Vector3(...axis).multiplyScalar(radius));
  }
  return points;
}

function CameraRig({
  focus,
  earthPosition,
  reducedMotion,
  eccentricity,
}: {
  focus: OrbitalVisualFocus;
  earthPosition: [number, number, number];
  reducedMotion: boolean;
  eccentricity: number;
}) {
  const camera = useThree((state) => state.camera);
  const aspect = useThree(
    (state) => state.size.width / Math.max(1, state.size.height),
  );
  const currentTarget = useRef(new Vector3(0, 0, 0));

  const desiredTarget = useMemo(
    () =>
      focus === "tilt"
        ? new Vector3(...earthPosition).add(new Vector3(0, 0.18, 0))
        : new Vector3(0, 0, 0),
    [earthPosition, focus],
  );

  const desiredPosition = useMemo(() => {
    if (focus !== "tilt") {
      // Retain the existing view angle, but fit the complete orbit in tall panels.
      const base = new Vector3(0, 7.2, 11.2);
      const halfWidth = SEMI_MAJOR_AXIS * (1 + eccentricity) + 0.8;
      const visibleHalfWidth =
        Math.tan(degreesToRadians(43 / 2)) * base.length() * aspect;
      return base.multiplyScalar(Math.max(1, halfWidth / visibleHalfWidth));
    }
    const earth = new Vector3(...earthPosition);
    const radial = earth.clone().setY(0).normalize();
    const tangent = new Vector3(-radial.z, 0, radial.x);
    const distance = Math.max(1, 0.48 / aspect);
    return earth
      .add(tangent.multiplyScalar(3.6 * distance))
      .add(new Vector3(0, 1.5 * distance, 0));
  }, [earthPosition, focus, aspect, eccentricity]);

  useFrame((_, delta) => {
    const amount = reducedMotion
      ? 1
      : 1 - Math.exp(-10.46 * Math.min(delta, 0.05));

    camera.position.lerp(desiredPosition, amount);
    currentTarget.current.lerp(desiredTarget, amount);
    camera.lookAt(currentTarget.current);
  });

  return null;
}

function EarthModel({
  position,
  parameters,
  focus,
  textures,
}: {
  position: [number, number, number];
  parameters: OrbitalParameters;
  focus: OrbitalVisualFocus;
  textures: SpaceTextures;
}) {
  const closeUp = focus === "tilt";
  const radius = closeUp ? 0.56 : 0.46;
  const axisLength = closeUp ? 1.35 : 0.82;
  const latitudeRing = latitudeCircleGeometry(radius, 65);
  const axisYaw = degreesToRadians(parameters.earthPerihelionLongitudeDeg + 90);
  const axis = summerSolsticeAxisVector(parameters);
  const todayAxis = summerSolsticeAxisVector({
    obliquityDeg: PRESENT_PARAMETERS.obliquityDeg,
    earthPerihelionLongitudeDeg: parameters.earthPerihelionLongitudeDeg,
  });
  const axisPoints: [number, number, number][] = [
    axis.map((component) => -component * axisLength) as [
      number,
      number,
      number,
    ],
    axis.map((component) => component * axisLength) as [number, number, number],
  ];
  const todayAxisPoints: [number, number, number][] = [
    todayAxis.map((component) => -component * axisLength) as [
      number,
      number,
      number,
    ],
    todayAxis.map((component) => component * axisLength) as [
      number,
      number,
      number,
    ],
  ];
  const tiltArc = useMemo(
    () =>
      tiltArcPoints(
        parameters.obliquityDeg,
        parameters.earthPerihelionLongitudeDeg,
        closeUp ? 1.25 : 0.7,
      ),
    [closeUp, parameters.earthPerihelionLongitudeDeg, parameters.obliquityDeg],
  );

  return (
    <group position={position}>
      {closeUp ? (
        <>
          <Line
            points={[
              [0, -axisLength, 0],
              [0, axisLength, 0],
            ]}
            color="#a9b4c5"
            opacity={0.26}
            transparent
            lineWidth={1.2}
          />
          <Line
            points={todayAxisPoints}
            color="#85c7f2"
            opacity={0.5}
            transparent
            lineWidth={2}
          />
          <Line
            points={tiltArc}
            color="#f08a4b"
            opacity={0.95}
            transparent
            lineWidth={2.4}
          />
        </>
      ) : null}

      <group rotation={[0, axisYaw, 0]}>
        <group rotation={[0, 0, degreesToRadians(parameters.obliquityDeg)]}>
          <Earth radius={radius} textures={textures} />
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, latitudeRing.axisOffset, 0]}
          >
            <torusGeometry
              args={[latitudeRing.circleRadius, closeUp ? 0.025 : 0.014, 8, 48]}
            />
            <meshBasicMaterial color="#85c7f2" />
          </mesh>
        </group>
      </group>
      <Line
        points={axisPoints}
        color={closeUp ? "#ffd97a" : "#f6f0e5"}
        lineWidth={closeUp ? 3.6 : 1.8}
      />
    </group>
  );
}

function OrbitalModel({
  parameters,
  scale,
  focus,
  reducedMotion,
  onAssetsReady,
  onFailure,
}: Pick<
  SceneClientProps,
  "parameters" | "scale" | "focus" | "reducedMotion"
> & { onAssetsReady: (ready: boolean) => void; onFailure?: () => void }) {
  const quality = useGraphicsQuality();
  const textures = useSpaceTextures(quality, focus === "tilt", onFailure);
  useEffect(() => {
    if (textures) onAssetsReady(true);
  }, [textures, onAssetsReady]);
  const eccentricity = displayEccentricity(parameters.eccentricity, scale);
  const presentEccentricity = displayEccentricity(
    PRESENT_PARAMETERS.eccentricity,
    scale,
  );
  const orbitPoints = useMemo(
    () => ellipsePoints(eccentricity),
    [eccentricity],
  );
  const presentOrbitPoints = useMemo(
    () => ellipsePoints(presentEccentricity),
    [presentEccentricity],
  );
  const earthPosition = useMemo(
    () =>
      summerSolsticePosition(
        eccentricity,
        parameters.earthPerihelionLongitudeDeg,
      ),
    [eccentricity, parameters.earthPerihelionLongitudeDeg],
  );
  const todayDirectionPosition = useMemo(
    () =>
      summerSolsticePosition(
        eccentricity,
        PRESENT_PARAMETERS.earthPerihelionLongitudeDeg,
      ),
    [eccentricity],
  );
  const perihelion: [number, number, number] = [
    SEMI_MAJOR_AXIS * (1 - eccentricity),
    0,
    0,
  ];
  const aphelion: [number, number, number] = [
    -SEMI_MAJOR_AXIS * (1 + eccentricity),
    0,
    0,
  ];

  return (
    <>
      <CameraRig
        focus={focus}
        earthPosition={earthPosition}
        reducedMotion={reducedMotion}
        eccentricity={eccentricity}
      />
      <StarField />

      {focus === "shape" ? (
        <Line
          points={presentOrbitPoints}
          color="#85c7f2"
          opacity={0.28}
          transparent
          lineWidth={1.35}
        />
      ) : null}
      <Line
        points={orbitPoints}
        color="#d8b56a"
        opacity={focus === "tilt" ? 0.22 : 0.92}
        transparent
        lineWidth={focus === "shape" ? 2.8 : 1.7}
      />

      {focus === "shape" ? (
        <>
          <Line
            points={[[0, 0, 0], perihelion]}
            color="#f08a4b"
            opacity={0.7}
            transparent
            lineWidth={1.5}
          />
          <Line
            points={[[0, 0, 0], aphelion]}
            color="#85c7f2"
            opacity={0.55}
            transparent
            lineWidth={1.5}
          />
          <mesh position={perihelion}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshBasicMaterial color="#f08a4b" />
          </mesh>
          <mesh position={aphelion}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshBasicMaterial color="#85c7f2" />
          </mesh>
        </>
      ) : null}

      {focus === "direction" ? (
        <>
          <Line
            points={[[0, 0, 0], todayDirectionPosition]}
            color="#a9b4c5"
            opacity={0.28}
            transparent
            lineWidth={1.2}
          />
          <Line
            points={[[0, 0, 0], earthPosition]}
            color="#85c7f2"
            opacity={0.9}
            transparent
            lineWidth={2.5}
          />
          <mesh position={todayDirectionPosition}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshBasicMaterial
              color="#a9b4c5"
              transparent
              opacity={0.18}
              wireframe
            />
          </mesh>
          <mesh position={perihelion}>
            <sphereGeometry args={[0.1, 18, 18]} />
            <meshBasicMaterial color="#f08a4b" />
          </mesh>
          <mesh position={aphelion}>
            <sphereGeometry args={[0.1, 18, 18]} />
            <meshBasicMaterial color="#85c7f2" />
          </mesh>
        </>
      ) : null}

      {textures ? <Sun noise={textures.noise} /> : null}

      {focus === "combined" ? (
        <Line
          points={[[0, 0, 0], earthPosition]}
          color="#85c7f2"
          opacity={0.45}
          transparent
          lineWidth={1.3}
        />
      ) : null}

      {textures ? (
        <EarthModel
          position={earthPosition}
          parameters={parameters}
          focus={focus}
          textures={textures}
        />
      ) : null}
    </>
  );
}

export default function SceneClient({
  parameters,
  scale,
  focus,
  reducedMotion,
  onReady,
  onFailure,
}: SceneClientProps) {
  const [assetsReady, setAssetsReady] = useState(false);
  const [quality, setQuality] = useState<GraphicsQuality>("medium");

  return (
    <Canvas
      aria-hidden="true"
      frameloop="never"
      dpr={[1, QUALITY[quality].dpr]}
      camera={{ position: [0, 7.2, 11.2], fov: 43, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x070a12, 0);
        gl.toneMappingExposure = 1.05;
      }}
    >
      <SceneRuntime
        ready={assetsReady}
        onReady={onReady}
        onFailure={onFailure}
        quality={quality}
        onQualityChange={setQuality}
      >
        <OrbitalModel
          parameters={parameters}
          scale={scale}
          focus={focus}
          reducedMotion={reducedMotion}
          onAssetsReady={setAssetsReady}
          onFailure={onFailure}
        />
      </SceneRuntime>
    </Canvas>
  );
}
