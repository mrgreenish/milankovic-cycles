"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  type Group,
  type Texture,
  type ShaderMaterial,
} from "three";
import {
  coronaFragment,
  coronaVertex,
  prominenceFragment,
  sphereVertex,
  sunFragment,
} from "./shaders";
import { animationTime, useGraphicsQuality } from "./SceneRuntime";
import { QUALITY } from "./quality";

function ribbonGeometry() {
  const positions = [],
    uvs = [],
    indices = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = (t - 0.5) * 0.6;
    const height = Math.sin(t * Math.PI) * 0.13;
    const radius = 0.398 + height;
    for (const side of [-1, 1]) {
      positions.push(
        Math.sin(angle) * radius,
        Math.cos(angle) * radius,
        side * (0.002 + Math.sin(t * Math.PI) * 0.009),
      );
      uvs.push(t, (side + 1) / 2);
    }
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  return geometry;
}

function Prominence({ index }: { index: number }) {
  const geometry = useMemo(() => ribbonGeometry(), []);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSeed: { value: index * 1.7 } }),
    [index],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (material.current)
      material.current.uniforms.uTime.value = animationTime(clock.elapsedTime);
  });
  return (
    <mesh
      geometry={geometry}
      rotation={[0.45 + index * 0.72, index * 1.61, index * 2.4]}
    >
      <shaderMaterial
        ref={material}
        vertexShader={
          "varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"
        }
        fragmentShader={prominenceFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={DoubleSide}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

export function Sun({ noise }: { noise: Texture }) {
  const quality = useGraphicsQuality();
  const rotating = useRef<Group>(null);
  const surfaceMaterial = useRef<ShaderMaterial>(null);
  const glowMaterial = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDetail: { value: QUALITY[quality].detail },
      uNoise: { value: noise },
    }),
    [noise, quality],
  );
  useFrame(({ clock }) => {
    if (surfaceMaterial.current)
      surfaceMaterial.current.uniforms.uTime.value = animationTime(
        clock.elapsedTime,
      );
    if (glowMaterial.current)
      glowMaterial.current.uniforms.uTime.value = animationTime(
        clock.elapsedTime,
      );
    if (rotating.current)
      rotating.current.rotation.y = animationTime(clock.elapsedTime) * 0.016;
  });
  return (
    <group name="sun-visual" scale={1.25}>
      <group ref={rotating}>
        <mesh name="sun-surface">
          <sphereGeometry args={[0.4, 48, 32]} />
          <shaderMaterial
            ref={surfaceMaterial}
            vertexShader={sphereVertex}
            fragmentShader={sunFragment}
            uniforms={uniforms}
          />
        </mesh>
        {quality !== "low" ? <Prominence index={0} /> : null}
        {quality === "high" ? (
          <>
            <Prominence index={1} />
            <Prominence index={2} />
          </>
        ) : null}
      </group>
      <mesh name="solar-corona" frustumCulled={false}>
        <planeGeometry args={[3, 3]} />
        <shaderMaterial
          ref={glowMaterial}
          vertexShader={coronaVertex}
          fragmentShader={coronaFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
