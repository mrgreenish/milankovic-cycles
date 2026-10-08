"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  BackSide,
  SphereGeometry,
  type Camera,
  type Group,
  type ShaderMaterial,
} from "three";
import {
  atmosphereFragment,
  cloudsFragment,
  earthFragment,
  sphereVertex,
} from "./shaders";
import { QUALITY } from "./quality";
import {
  animationTime,
  useAmbientTime,
  useGraphicsQuality,
} from "./SceneRuntime";
import { useSceneFrame } from "./SceneState";
import { bodyOrientation } from "./orientation";
import type { SpaceTextures } from "./textures";

const GeometryContext = createContext<SphereGeometry | null>(null);

/** Both camera views and all Earth layers reuse one set of sphere buffers. */
export function EarthGeometryProvider({ children }: { children: ReactNode }) {
  const quality = useGraphicsQuality();
  const segments = QUALITY[quality].segments;
  const geometry = useMemo(
    () => new SphereGeometry(1, segments, segments / 2),
    [segments],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <GeometryContext.Provider value={geometry}>
      {children}
    </GeometryContext.Provider>
  );
}

// This group lives INSIDE the existing tilt/yaw transforms. Daily rotation only
// affects the surface and weather; the polar axis and latitude ring stay fixed.
export function Earth({
  textures,
  layer = 0,
}: {
  textures: SpaceTextures;
  layer?: 0 | 1;
}) {
  const frame = useSceneFrame();
  const body = useRef<Group>(null);
  const rotating = useRef<Group>(null);
  const surfaceMaterial = useRef<ShaderMaterial>(null);
  const cloudMaterial = useRef<ShaderMaterial>(null);
  const quality = useGraphicsQuality();
  const ambientTime = useAmbientTime();
  const config = QUALITY[quality];
  const geometry = useContext(GeometryContext);
  if (!geometry) throw new Error("Earth needs an EarthGeometryProvider");
  const uniforms = useMemo(
    () => ({
      uDay: { value: textures.day },
      uSurface: { value: textures.detail },
      uNight: { value: textures.night },
      uClouds: { value: textures.clouds },
      uNoise: { value: textures.noise },
      uTime: { value: 0 },
      uDetail: { value: config.detail },
      uIce: { value: 0 },
      uRing: { value: 0 },
      uArctic: { value: 0 },
      uTiltDeg: { value: 23.4 },
      uClear: { value: 0 },
    }),
    [textures, config.detail],
  );

  // The main and climate cameras draw their own pose, using the same geometry.
  useLayoutEffect(() => {
    body.current?.traverse((object) => object.layers.set(layer));
  }, [textures, layer]);

  // The climate globe keeps the 65°N line and thinner clouds whatever the main
  // view is doing. Surface and cloud layers share this globe's uniforms.
  const forInset = (_renderer: unknown, _scene: unknown, camera: Camera) => {
    if (!camera.userData.inset) return;
    const live = surfaceMaterial.current?.uniforms;
    if (!live) return;
    live.uRing.value = 1;
    live.uArctic.value = 0;
    live.uClear.value = 0.8;
  };

  useFrame(() => {
    const time = animationTime(ambientTime.current);
    const { weight } = frame;
    const live = surfaceMaterial.current?.uniforms;
    if (live) {
      live.uIce.value = frame.ice;
      live.uRing.value = Math.min(
        1,
        Math.max(weight.idea, weight.tilt, 0.7 * weight.timeline),
      );
      live.uArctic.value = weight.tilt;
      live.uTiltDeg.value = (frame.tilt * 180) / Math.PI;
      live.uClear.value = Math.max(weight.idea * 0.9, weight.tilt * 0.7);
    }
    if (body.current) body.current.scale.setScalar(frame.radius);
    if (surfaceMaterial.current)
      surfaceMaterial.current.uniforms.uTime.value = time;
    if (cloudMaterial.current)
      cloudMaterial.current.uniforms.uTime.value = time;
    if (rotating.current)
      rotating.current.rotation.y = 2.8 + time * 0.025 + frame.spin;
  });

  return (
    <group ref={body} name="earth-visual">
      <group ref={rotating}>
        <mesh name="earth-surface" geometry={geometry} onBeforeRender={forInset}>
          <shaderMaterial
            ref={surfaceMaterial}
            vertexShader={sphereVertex}
            fragmentShader={earthFragment}
            uniforms={uniforms}
          />
        </mesh>
        <mesh name="earth-clouds" geometry={geometry} scale={1.009} renderOrder={2}>
          <shaderMaterial
            ref={cloudMaterial}
            vertexShader={sphereVertex}
            fragmentShader={cloudsFragment}
            uniforms={uniforms}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh
        name="earth-atmosphere"
        geometry={geometry}
        scale={quality === "low" ? 1.025 : 1.035}
        renderOrder={3}
      >
        <shaderMaterial
          vertexShader={sphereVertex}
          fragmentShader={atmosphereFragment}
          side={BackSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** The top globe keeps the original clock, orientation, spin and shading. */
export function InsetEarth({ textures }: { textures: SpaceTextures }) {
  const frame = useSceneFrame();
  const world = useRef<Group>(null);
  const position = useRef<Group>(null);
  const body = useRef<Group>(null);
  useFrame(() => {
    if (world.current) world.current.rotation.y = frame.yaw;
    position.current?.position.copy(frame.earthLocal);
    if (body.current)
      bodyOrientation(frame.axisLocal, frame.yaw, body.current.quaternion);
  });
  return (
    <group ref={world} name="climate-earth-world">
      <group ref={position}>
        <group ref={body}>
          <Earth textures={textures} layer={1} />
        </group>
      </group>
    </group>
  );
}
