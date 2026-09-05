"use client";

import { useMemo, useRef } from "react";
import type { ShaderMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { animationTime, useGraphicsQuality } from "./SceneRuntime";

function stars() {
  let seed = 7331;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const positions = new Float32Array(850 * 3);
  const brightness = new Float32Array(850);
  for (let i = 0; i < 850; i++) {
    const y = random() * 2 - 1,
      angle = random() * Math.PI * 2,
      radius = Math.sqrt(1 - y * y);
    positions.set(
      [Math.cos(angle) * radius * 42, y * 42, Math.sin(angle) * radius * 42],
      i * 3,
    );
    brightness[i] = 0.2 + Math.pow(random(), 3) * 0.8;
  }
  return { positions, brightness };
}

export function StarField() {
  const data = useMemo(() => stars(), []);
  const material = useRef<ShaderMaterial>(null);
  const quality = useGraphicsQuality();
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uDpr: { value: 1 } }),
    [],
  );
  useFrame(({ clock, gl }) => {
    if (material.current) {
      material.current.uniforms.uTime.value = animationTime(clock.elapsedTime);
      material.current.uniforms.uDpr.value = gl.getPixelRatio();
    }
  });
  return (
    <points name="distant-stars" frustumCulled={false} renderOrder={-10}>
      <bufferGeometry
        drawRange={{ start: 0, count: quality === "low" ? 400 : 850 }}
      >
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-brightness"
          args={[data.brightness, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={
          /* glsl */ `
          attribute float brightness;
          uniform float uDpr;
          varying float vBrightness;
          void main() {
            vBrightness = brightness;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (0.7 + brightness * 1.6) * uDpr;
          }
        `
        }
        fragmentShader={
          /* glsl */ `
          uniform float uTime;
          varying float vBrightness;
          void main() {
            float distanceToCenter = length(gl_PointCoord - 0.5) * 2.0;
            float alpha = (1.0 - smoothstep(0.0, 1.0, distanceToCenter)) * vBrightness * 0.65;
            alpha *= 0.96 + 0.04 * sin(uTime * 0.3 + vBrightness * 150.0);
            gl_FragColor = vec4(mix(vec3(0.67, 0.8, 1.0), vec3(1.0, 0.88, 0.7), vBrightness), alpha);
            #include <colorspace_fragment>
          }
        `
        }
      />
    </points>
  );
}
