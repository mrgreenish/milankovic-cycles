"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BackSide,
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
import type { SpaceTextures } from "./textures";

// This group lives INSIDE the existing tilt/yaw transforms. Daily rotation only
// affects the surface and weather; the polar axis and latitude ring stay fixed.
export function Earth({ textures }: { textures: SpaceTextures }) {
  const frame = useSceneFrame();
  const body = useRef<Group>(null);
  const rotating = useRef<Group>(null);
  const surfaceMaterial = useRef<ShaderMaterial>(null);
  const cloudMaterial = useRef<ShaderMaterial>(null);
  const quality = useGraphicsQuality();
  const ambientTime = useAmbientTime();
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
      uIce: { value: 0 },
      uRing: { value: 0 },
      uArctic: { value: 0 },
      uTiltDeg: { value: 23.4 },
      uClear: { value: 0 },
    }),
    [textures, config.detail],
  );

  // Layer 1 is the Earth alone: the climate globe's camera sees only this.
  useLayoutEffect(() => {
    body.current?.traverse((object) => object.layers.enable(1));
  }, [textures]);

  // The climate globe wants the 65°N line and thinner clouds whatever the main
  // view is doing. The uniforms are shared, so set them just for that pass; the
  // next frame's useFrame puts the main values back before the main pass.
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
        <mesh name="earth-surface" onBeforeRender={forInset}>
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
