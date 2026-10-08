"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Group, Mesh, Vector3, type Camera, type Object3D } from "three";
import {
  aphelionDistanceAu,
  degreesToRadians,
  orbitRadius,
  perihelionDistanceAu,
} from "@/lib/orbital/geometry";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type {
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import { Earth } from "./Earth";
import { createLabelProjection } from "./labelProjection";
import { bodyOrientation } from "./orientation";
import { ParamLine } from "./ParamLine";
import {
  FOCUSES,
  SEMI_MAJOR_AXIS,
  axisDirection,
  axisLength,
  orbitPoint,
  useSceneFrame,
  type SceneFrame,
} from "./SceneState";
import { Sun } from "./Sun";
import type { SpaceTextures } from "./textures";

const UP = new Vector3(0, 1, 0);
const BRASS = "#d8b56a";
const GOLD = "#ffd97a";
const ICE = "#85c7f2";
const SUN = "#f08a4b";
const TODAY = "#b7c3d6";

type Weights = Partial<Record<OrbitalVisualFocus, number>>;
function blend(frame: SceneFrame, values: Weights) {
  let sum = 0;
  for (const focus of FOCUSES) sum += frame.weight[focus] * (values[focus] ?? 0);
  return sum;
}

/** A DOM label that follows a point in the scene and fades with the active view. */
function Label({
  place,
  weight,
  fade,
  className = "",
  children,
}: {
  place: (frame: SceneFrame, out: Vector3, camera: Camera) => void;
  weight: Weights;
  /** Optional extra fade, 0 to 1, for example when another label is nearby. */
  fade?: (frame: SceneFrame) => number;
  className?: string;
  children: ReactNode;
}) {
  const frame = useSceneFrame();
  const anchor = useRef<Group>(null);
  const element = useRef<HTMLSpanElement>(null);
  const visible = useRef(false);
  const project = useMemo(() => {
    const calculate = createLabelProjection();
    return (object: Object3D, camera: Camera, size: { width: number; height: number }) =>
      calculate(object, camera, size, visible.current);
  }, []);
  useFrame(({ camera }) => {
    const opacity = blend(frame, weight) * (fade ? fade(frame) : 1);
    visible.current = opacity >= 0.03;
    if (visible.current && anchor.current)
      place(frame, anchor.current.position, camera);
    if (element.current) {
      const style = element.current.style;
      const nextOpacity = visible.current ? opacity.toFixed(3) : "0";
      const visibility = visible.current ? "visible" : "hidden";
      if (style.opacity !== nextOpacity) style.opacity = nextOpacity;
      if (style.visibility !== visibility) style.visibility = visibility;
    }
  }, -1);
  return (
    <group ref={anchor}>
      <Html
        center
        calculatePosition={project}
        zIndexRange={[2, 0]}
        style={{ pointerEvents: "none" }}
      >
        <span ref={element} className={`space-label ${className}`}>
          {children}
        </span>
      </Html>
    </group>
  );
}

function Marker({
  color,
  place,
  weight,
  size = 0.1,
}: {
  color: string;
  place: (frame: SceneFrame, out: Vector3) => void;
  weight: Weights;
  size?: number;
}) {
  const frame = useSceneFrame();
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    if (!mesh.current) return;
    place(frame, mesh.current.position);
    mesh.current.scale.setScalar(Math.max(0.0001, blend(frame, weight) * size));
  });
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1, 18, 18]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

/** 0 when Earth sits on the point, 1 once it is a little way off. */
function awayFrom(frame: SceneFrame, x: number, z: number) {
  const distance = Math.hypot(frame.earthLocal.x - x, frame.earthLocal.z - z);
  return Math.min(1, Math.max(0, (distance - 0.9) / 1.2));
}

const scratch = {
  a: new Vector3(),
  b: new Vector3(),
  c: new Vector3(),
  d: new Vector3(),
};

function SunRay({ index, count }: { index: number; count: number }) {
  const offset = (index / (count - 1) - 0.5) * 1.8;
  return (
    <ParamLine
      kind="segment"
      color="#ffd9a0"
      width={1.4}
      glow
      update={(u, frame) => {
        const toSun = scratch.a.copy(frame.earthLocal).multiplyScalar(-1);
        const distance = toSun.length();
        toSun.normalize();
        const lateral = scratch.b.copy(UP).multiplyScalar(offset * frame.radius);
        u.uP.value.set(
          frame.earthLocal.x + toSun.x * (distance - 0.7) + lateral.x,
          frame.earthLocal.y + toSun.y * (distance - 0.7) + lateral.y,
          frame.earthLocal.z + toSun.z * (distance - 0.7) + lateral.z,
          0,
        );
        u.uQ.value.set(
          frame.earthLocal.x + lateral.x,
          frame.earthLocal.y + lateral.y,
          frame.earthLocal.z + lateral.z,
          0,
        );
        u.uGradient.value = 1;
        u.uOpacity.value = blend(frame, { tilt: 0.5, idea: 0.12 });
      }}
    />
  );
}

function EarthSystem({ textures }: { textures: SpaceTextures }) {
  const frame = useSceneFrame();
  const earth = useRef<Group>(null);
  const body = useRef<Group>(null);
  const arcFrame = useRef<Group>(null);
  const summerRing = useRef<Mesh>(null);
  const tip = useRef<Mesh>(null);

  useFrame(() => {
    earth.current?.position.copy(frame.earthLocal);
    if (body.current)
      bodyOrientation(frame.axisLocal, frame.yaw, body.current.quaternion);
    if (arcFrame.current) {
      arcFrame.current.position.copy(frame.earthLocal);
      arcFrame.current.rotation.y = -(frame.peri + Math.PI / 2);
    }
    if (summerRing.current) {
      summerRing.current.position.copy(frame.earthLocal);
      summerRing.current.scale.setScalar(
        Math.max(0.0001, blend(frame, { direction: 1 }) * frame.radius * 1.5),
      );
    }
    if (tip.current) {
      tip.current.position
        .copy(frame.earthLocal)
        .addScaledVector(frame.axisLocal, axisLength(frame));
      tip.current.scale.setScalar(
        Math.max(0.0001, blend(frame, { direction: 1, tilt: 0.5 }) * 0.08),
      );
    }
  });

  return (
    <>
      <group ref={earth}>
        <group ref={body}>
          <Earth textures={textures} />
        </group>
      </group>

      {/* Axis now, and today's axis for comparison */}
      <ParamLine
        kind="segment"
        color={GOLD}
        width={2.4}
        update={(u, f) => {
          const length = axisLength(f);
          u.uP.value.set(
            f.earthLocal.x - f.axisLocal.x * length,
            f.earthLocal.y - f.axisLocal.y * length,
            f.earthLocal.z - f.axisLocal.z * length,
            0,
          );
          u.uQ.value.set(
            f.earthLocal.x + f.axisLocal.x * length,
            f.earthLocal.y + f.axisLocal.y * length,
            f.earthLocal.z + f.axisLocal.z * length,
            0,
          );
          u.uOpacity.value = blend(f, {
            tilt: 1,
            direction: 0.95,
            shape: 0.55,
            timeline: 0.75,
            combined: 0.6,
          });
        }}
      />
      <ParamLine
        kind="segment"
        color={TODAY}
        width={1.6}
        dash={14}
        update={(u, f) => {
          const length = axisLength(f);
          const today = axisDirection(
            degreesToRadians(PRESENT_PARAMETERS.obliquityDeg),
            f.peri,
            scratch.c,
          );
          u.uP.value.set(
            f.earthLocal.x - today.x * length,
            f.earthLocal.y - today.y * length,
            f.earthLocal.z - today.z * length,
            0,
          );
          u.uQ.value.set(
            f.earthLocal.x + today.x * length,
            f.earthLocal.y + today.y * length,
            f.earthLocal.z + today.z * length,
            0,
          );
          u.uOpacity.value = blend(f, { tilt: 0.85 });
        }}
      />
      <ParamLine
        kind="segment"
        color={TODAY}
        width={1.2}
        dash={10}
        update={(u, f) => {
          const length = axisLength(f);
          u.uP.value.set(f.earthLocal.x, f.earthLocal.y - length, f.earthLocal.z, 0);
          u.uQ.value.set(f.earthLocal.x, f.earthLocal.y + length, f.earthLocal.z, 0);
          u.uOpacity.value = blend(f, { tilt: 0.4 });
        }}
      />
      {/* Tilt angle, measured from the vertical */}
      <group ref={arcFrame}>
        <ParamLine
          kind="arc"
          color="#ffb25a"
          width={2.6}
          segments={36}
          update={(u, f) => {
            u.uP.value.set(axisLength(f) * 0.82, 0, 0, f.tilt);
            u.uOpacity.value = blend(f, { tilt: 1 });
          }}
        />
      </group>

      {/* Precession: the axis tip circles around the vertical */}
      <ParamLine
        kind="ring"
        color={BRASS}
        width={1.6}
        segments={96}
        dash={36}
        update={(u, f) => {
          const length = axisLength(f);
          u.uP.value.set(length * Math.sin(f.tilt), length * Math.cos(f.tilt), 0, Math.PI * 2);
          u.uQ.value.set(f.earthLocal.x, f.earthLocal.y, f.earthLocal.z, 0);
          u.uOpacity.value = blend(f, { direction: 0.8 });
        }}
      />
      <mesh ref={tip}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </mesh>
      <mesh ref={summerRing} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} transparent opacity={0.9} />
      </mesh>

      {Array.from({ length: 5 }, (_, index) => (
        <SunRay key={index} index={index} count={5} />
      ))}
    </>
  );
}

const SEASONS = [
  { label: "Spring", longitude: 0 },
  { label: "Summer", longitude: 90 },
  { label: "Autumn", longitude: 180 },
  { label: "Winter", longitude: 270 },
] as const;

export function OrbitScene({
  parameters,
  textures,
}: {
  parameters: OrbitalParameters;
  textures: SpaceTextures;
}) {
  const a = SEMI_MAJOR_AXIS;
  const todayAnomaly =
    (3 * Math.PI) / 2 - degreesToRadians(PRESENT_PARAMETERS.earthPerihelionLongitudeDeg);
  const trueE = parameters.eccentricity;
  const live = useRef<HTMLSpanElement>(null);
  const frame = useSceneFrame();
  useFrame(() => {
    if (!live.current) return;
    const distance = orbitRadius(frame.anomaly, frame.targets.trueEccentricity);
    const text = `${distance.toFixed(3)} AU`;
    if (live.current.textContent !== text) live.current.textContent = text;
  });

  return (
    <>
      <Sun noise={textures.noise} />

      {/* Orbits */}
      <ParamLine
        kind="ellipse"
        color={BRASS}
        width={2.2}
        segments={180}
        update={(u, f) => {
          const b = a * Math.sqrt(1 - f.e * f.e);
          u.uP.value.set(a, b, a * f.e, 0);
          u.uOpacity.value = blend(f, {
            hero: 0,
            idea: 0.12,
            shape: 1,
            tilt: 0.1,
            direction: 0.9,
            timeline: 0.9,
            combined: 0.9,
          });
        }}
      />
      <ParamLine
        kind="ellipse"
        color={TODAY}
        width={1.6}
        segments={180}
        dash={70}
        update={(u, f) => {
          const b = a * Math.sqrt(1 - f.presentE * f.presentE);
          u.uP.value.set(a, b, a * f.presentE, 0);
          u.uOpacity.value = blend(f, { shape: 0.85 });
        }}
      />

      {/* Closest and farthest points */}
      <ParamLine
        kind="segment"
        color={SUN}
        width={1.6}
        update={(u, f) => {
          u.uP.value.set(0, 0, 0, 0);
          u.uQ.value.set(a * (1 - f.e), 0, 0, 0);
          u.uOpacity.value = blend(f, { shape: 0.8, direction: 0.5, timeline: 0.35 });
        }}
      />
      <ParamLine
        kind="segment"
        color={ICE}
        width={1.6}
        update={(u, f) => {
          u.uP.value.set(0, 0, 0, 0);
          u.uQ.value.set(-a * (1 + f.e), 0, 0, 0);
          u.uOpacity.value = blend(f, { shape: 0.65, direction: 0.4, timeline: 0.3 });
        }}
      />
      <Marker
        color={SUN}
        size={0.12}
        weight={{ shape: 1, direction: 0.9, timeline: 0.6 }}
        place={(f, out) => out.set(a * (1 - f.e), 0, 0)}
      />
      <Marker
        color={ICE}
        size={0.12}
        weight={{ shape: 1, direction: 0.9, timeline: 0.6 }}
        place={(f, out) => out.set(-a * (1 + f.e), 0, 0)}
      />
      <Label
        weight={{ shape: 1 }}
        fade={(f) => awayFrom(f, a * (1 - f.e), 0)}
        place={(f, out) => out.set(a * (1 - f.e), 0, 0.75)}
      >
        Closest
        <small>{perihelionDistanceAu(trueE).toFixed(3)} AU</small>
      </Label>
      <Label
        weight={{ shape: 1 }}
        fade={(f) => awayFrom(f, -a * (1 + f.e), 0)}
        className="space-label--ice"
        place={(f, out) => out.set(-a * (1 + f.e), 0, 0.75)}
      >
        Farthest
        <small>{aphelionDistanceAu(trueE).toFixed(3)} AU</small>
      </Label>

      {/* Where northern summer falls */}
      <ParamLine
        kind="segment"
        color={BRASS}
        width={2}
        update={(u, f) => {
          u.uP.value.set(0, 0, 0, 0);
          u.uQ.value.set(f.earthLocal.x, f.earthLocal.y, f.earthLocal.z, 0);
          u.uOpacity.value = blend(f, { direction: 0.9, combined: 0.3, timeline: 0.4 });
        }}
      />
      <ParamLine
        kind="segment"
        color={TODAY}
        width={1.4}
        dash={24}
        update={(u, f) => {
          const r = orbitRadius(todayAnomaly, f.e) * a;
          const point = orbitPoint(r, todayAnomaly, scratch.d);
          u.uP.value.set(0, 0, 0, 0);
          u.uQ.value.set(point.x, point.y, point.z, 0);
          u.uOpacity.value = blend(f, { direction: 0.75 });
        }}
      />
      <Label
        weight={{ direction: 1 }}
        fade={(f) => {
          const point = orbitPoint(orbitRadius(todayAnomaly, f.e) * a, todayAnomaly, scratch.d);
          return Math.min(1, Math.max(0, (point.distanceTo(f.earthLocal) - 0.8) / 1.4));
        }}
        className="space-label--today"
        place={(f, out) =>
          orbitPoint(orbitRadius(todayAnomaly, f.e) * a * 1.12 + 0.35, todayAnomaly, out)
        }
      >
        Summer today
      </Label>
      {SEASONS.map(({ label, longitude }) => (
        <Label
          key={label}
          weight={{ direction: label === "Summer" ? 0 : 0.85 }}
          place={(f, out) => {
            const anomaly = degreesToRadians(longitude + 180) - f.peri;
            return orbitPoint(orbitRadius(anomaly, f.e) * a + 0.65, anomaly, out);
          }}
        >
          {label}
        </Label>
      ))}

      <EarthSystem textures={textures} />

      {/* Labels that follow Earth */}
      <Label
        weight={{ direction: 1 }}
        className="space-label--summer"
        place={(f, out) => {
          out.copy(f.earthLocal);
          out.y += f.radius * 2.6 + 0.55;
        }}
      >
        Northern summer
      </Label>
      <Label
        weight={{ shape: 1 }}
        place={(f, out) => out.copy(f.earthLocal).add(scratch.b.set(0, 0, -(f.radius + 0.5)))}
      >
        <span ref={live} />
      </Label>
      <Label
        weight={{ tilt: 1 }}
        place={(f, out) => {
          const half = f.tilt / 2;
          out
            .set(-Math.sin(half), Math.cos(half), 0)
            .applyAxisAngle(UP, -(f.peri + Math.PI / 2))
            .multiplyScalar(axisLength(f) * 1.1)
            .add(f.earthLocal);
        }}
      >
        <TiltReadout value={parameters.obliquityDeg} />
      </Label>
      <Label
        weight={{ tilt: 1, idea: 1 }}
        className="space-label--ring"
        place={(f, out, camera) => {
          // The ring point that faces the camera, found in world space.
          const facing = scratch.a.copy(camera.position).sub(f.earth);
          facing.addScaledVector(f.axis, -facing.dot(f.axis)).normalize();
          out
            .copy(f.earth)
            .addScaledVector(f.axis, f.radius * Math.sin(degreesToRadians(65)))
            .addScaledVector(facing, f.radius * Math.cos(degreesToRadians(65)) + 0.28)
            .applyAxisAngle(UP, -f.yaw);
        }}
      >
        65°N
      </Label>
    </>
  );
}

function TiltReadout({ value }: { value: number }) {
  return <>{value.toFixed(2)}°</>;
}
