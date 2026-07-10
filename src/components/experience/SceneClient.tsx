"use client";

import { useEffect, useMemo, useRef } from "react";
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
  return [
    radius * Math.cos(trueAnomaly),
    0,
    radius * Math.sin(trueAnomaly),
  ];
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

function InvalidateOnChange({ token }: { token: string }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => invalidate(), [invalidate, token]);
  return null;
}

function CameraRig({
  focus,
  earthPosition,
  reducedMotion,
}: {
  focus: OrbitalVisualFocus;
  earthPosition: [number, number, number];
  reducedMotion: boolean;
}) {
  const { camera, invalidate } = useThree();
  const currentTarget = useRef(new Vector3(0, 0, 0));

  const desiredTarget = useMemo(
    () =>
      focus === "tilt"
        ? new Vector3(...earthPosition).add(new Vector3(0, 0.18, 0))
        : new Vector3(0, 0, 0),
    [earthPosition, focus],
  );

  const desiredPosition = useMemo(() => {
    if (focus !== "tilt") return new Vector3(0, 7.2, 11.2);
    const earth = new Vector3(...earthPosition);
    const radial = earth.clone().setY(0).normalize();
    const tangent = new Vector3(-radial.z, 0, radial.x);
    return earth
      .add(tangent.multiplyScalar(3.6))
      .add(new Vector3(0, 1.5, 0));
  }, [earthPosition, focus]);

  useEffect(() => invalidate(), [desiredPosition, desiredTarget, invalidate]);

  useFrame(() => {
    const positionDistance = camera.position.distanceTo(desiredPosition);
    const targetDistance = currentTarget.current.distanceTo(desiredTarget);
    const amount = reducedMotion ? 1 : 0.16;

    camera.position.lerp(desiredPosition, amount);
    currentTarget.current.lerp(desiredTarget, amount);
    camera.lookAt(currentTarget.current);

    if (!reducedMotion && (positionDistance > 0.004 || targetDistance > 0.004)) {
      invalidate();
    }
  });

  return null;
}

function EarthModel({
  position,
  parameters,
  focus,
}: {
  position: [number, number, number];
  parameters: OrbitalParameters;
  focus: OrbitalVisualFocus;
}) {
  const closeUp = focus === "tilt";
  const radius = closeUp ? 0.56 : focus === "direction" ? 0.43 : 0.36;
  const axisLength = closeUp ? 1.35 : 0.82;
  const latitudeRing = latitudeCircleGeometry(radius, 65);
  const axisYaw = degreesToRadians(
    parameters.earthPerihelionLongitudeDeg + 90,
  );
  const axis = summerSolsticeAxisVector(parameters);
  const todayAxis = summerSolsticeAxisVector({
    obliquityDeg: PRESENT_PARAMETERS.obliquityDeg,
    earthPerihelionLongitudeDeg: parameters.earthPerihelionLongitudeDeg,
  });
  const axisPoints: [number, number, number][] = [
    axis.map((component) => -component * axisLength) as [number, number, number],
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
    [
      closeUp,
      parameters.earthPerihelionLongitudeDeg,
      parameters.obliquityDeg,
    ],
  );

  return (
    <group position={position}>
      {closeUp ? (
        <>
          <Line
            points={[[0, -axisLength, 0], [0, axisLength, 0]]}
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
          <mesh>
            <sphereGeometry args={[radius, 48, 48]} />
            <meshStandardMaterial
              color="#3d83bd"
              roughness={0.74}
              metalness={0.05}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2.7, 0, 0.4]}>
            <torusGeometry
              args={[radius * 0.86, radius * 0.07, 12, 72, 2.8]}
            />
            <meshStandardMaterial color="#9bcfc2" roughness={0.9} />
          </mesh>
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, latitudeRing.axisOffset, 0]}
          >
            <torusGeometry
              args={[
                latitudeRing.circleRadius,
                closeUp ? 0.025 : 0.014,
                8,
                48,
              ]}
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
}: Pick<
  SceneClientProps,
  "parameters" | "scale" | "focus" | "reducedMotion"
>) {
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
      />
      <ambientLight intensity={0.54} />
      <pointLight
        position={[0, 0.7, 0]}
        intensity={75}
        distance={18}
        color="#f6b065"
      />

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

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 36, 36]} />
        <meshStandardMaterial
          color="#f08a4b"
          emissive="#f08a4b"
          emissiveIntensity={3.4}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.64, 24, 24]} />
        <meshBasicMaterial
          color="#f08a4b"
          transparent
          opacity={0.075}
          depthWrite={false}
        />
      </mesh>

      {focus === "combined" ? (
        <Line
          points={[[0, 0, 0], earthPosition]}
          color="#85c7f2"
          opacity={0.45}
          transparent
          lineWidth={1.3}
        />
      ) : null}

      <EarthModel
        position={earthPosition}
        parameters={parameters}
        focus={focus}
      />
    </>
  );
}

export default function SceneClient({
  parameters,
  scale,
  chapter,
  focus,
  reducedMotion,
  onReady,
  onFailure,
}: SceneClientProps) {
  const token = `${parameters.eccentricity}-${parameters.obliquityDeg}-${parameters.earthPerihelionLongitudeDeg}-${scale}-${chapter}-${focus}`;

  return (
    <Canvas
      aria-hidden="true"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 7.2, 11.2], fov: 43, near: 0.1, far: 100 }}
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
      <OrbitalModel
        parameters={parameters}
        scale={scale}
        focus={focus}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
