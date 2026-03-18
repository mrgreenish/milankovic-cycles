"use client";
import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Sun() {
  const sunRef = useRef();
  const lensFlareRef = useRef();

  useFrame(({ clock }) => {
    if (sunRef.current) {
      sunRef.current.material.uniforms.time.value = clock.getElapsedTime() * 0.2;
    }
  });

  const sunShader = {
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec3 baseColor = vec3(1.0, 0.6, 0.1);
        vec3 hotColor = vec3(1.0, 0.9, 0.4);

        vec2 uv = vUv;
        float t = time * 0.1;

        float pattern = hash(uv * 8.0 + vec2(t * 0.5, t * 0.7));

        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);

        vec3 color = mix(baseColor, hotColor, pattern);

        float pulse = sin(time * 0.5) * 0.05 + 0.95;
        color *= pulse;

        color += hotColor * fresnel * 0.5;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  };

  const LensFlareSystem = () => {
    const flareTexture = useMemo(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      gradient.addColorStop(0.1, "rgba(255, 230, 190, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 150, 50, 0.3)");
      gradient.addColorStop(1, "rgba(255, 100, 50, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }, []);

    return (
      <group ref={lensFlareRef} position={[0, 0, 0]}>
        <sprite position={[0, 0, 0]} scale={[2, 2, 2]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.6}
            color={0xffbb77}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite position={[0, 0, -0.2]} scale={[5, 5, 5]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.4}
            color={0xff6622}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>
    );
  };

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        color={0xffffee}
        distance={100}
        decay={1.5}
        castShadow={false}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <shaderMaterial
          args={[sunShader]}
          uniforms={sunShader.uniforms}
        />
      </mesh>
      <LensFlareSystem />
    </group>
  );
}
