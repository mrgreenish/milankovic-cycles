"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, type Group, type ShaderMaterial } from "three";
import {
  atmosphereFragment,
  cloudsFragment,
  earthFragment,
  sphereVertex,
} from "./shaders";
import { QUALITY } from "./quality";
import { animationTime, useGraphicsQuality } from "./SceneRuntime";
import type { SpaceTextures } from "./textures";

// This group lives INSIDE the existing tilt/yaw transforms. Daily rotation only
// affects the surface and weather; the polar axis and latitude ring stay fixed.
export function Earth({
  radius,
  textures,
}: {
  radius: number;
  textures: SpaceTextures;
}) {
  const rotating = useRef<Group>(null);
  const surfaceMaterial = useRef<ShaderMaterial>(null);
  const cloudMaterial = useRef<ShaderMaterial>(null);
  const quality = useGraphicsQuality();
  const config = QUALITY[quality];
  const uniforms = useMemo(
    () => ({
      uDay: { value: textures.day },
      uSurface: { value: textures.detail },
      uNight: { value: textures.night },
      uClouds: { value: textures.clouds },
      uNoise: { value: textures.noise },
      uTime: { value: 0 },
      uDetail: { value: config.detail },
    }),
    [textures, config.detail],
  );

  useFrame(({ clock }) => {
    const time = animationTime(clock.elapsedTime);
    if (surfaceMaterial.current)
      surfaceMaterial.current.uniforms.uTime.value = time;
    if (cloudMaterial.current)
      cloudMaterial.current.uniforms.uTime.value = time;
    if (rotating.current) rotating.current.rotation.y = 2.8 + time * 0.025;
  });

  return (
    <group scale={radius} name="earth-visual">
      <group ref={rotating}>
        <mesh name="earth-surface">
          <sphereGeometry args={[1, config.segments, config.segments / 2]} />
          <shaderMaterial
            ref={surfaceMaterial}
            vertexShader={sphereVertex}
            fragmentShader={earthFragment}
            uniforms={uniforms}
          />
        </mesh>
        <mesh name="earth-clouds" scale={1.009} renderOrder={2}>
          <sphereGeometry args={[1, config.segments, config.segments / 2]} />
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
        scale={quality === "low" ? 1.025 : 1.035}
        renderOrder={3}
      >
        <sphereGeometry args={[1, config.segments, config.segments / 2]} />
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
