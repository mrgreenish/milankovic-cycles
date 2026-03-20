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

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 baseColor = vec3(1.0, 0.6, 0.1);
        vec3 hotColor = vec3(1.0, 0.9, 0.4);

        vec2 uv = vUv;
        float t = time * 0.1;

        float pattern = fbm(uv * 6.0 + vec2(t * 0.3, t * 0.2));
        float pattern2 = fbm(uv * 10.0 - vec2(t * 0.2, t * 0.4));
        float combined = pattern * 0.7 + pattern2 * 0.3;

        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);

        vec3 color = mix(baseColor, hotColor, combined);

        float pulse = sin(time * 0.5) * 0.05 + 0.95;
        color *= pulse;

        color += hotColor * fresnel * 0.5;

        // Push into HDR range for bloom
        color *= 1.8;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  };

  const LensFlareSystem = () => {
    const flareTexture = useMemo(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      gradient.addColorStop(0.1, "rgba(255, 230, 190, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 150, 50, 0.3)");
      gradient.addColorStop(1, "rgba(255, 100, 50, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }, []);

    return (
      <group ref={lensFlareRef} position={[0, 0, 0]}>
        <sprite position={[0, 0, 0]} scale={[3, 3, 3]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.6}
            color={0xffbb77}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite position={[0, 0, -0.2]} scale={[7, 7, 7]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.4}
            color={0xff6622}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite position={[0, 0, -0.4]} scale={[12, 12, 12]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.15}
            color={0xff4400}
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
        intensity={3}
        color={0xffffee}
        distance={100}
        decay={1.5}
        castShadow={false}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <shaderMaterial
          args={[sunShader]}
          uniforms={sunShader.uniforms}
        />
      </mesh>
      <LensFlareSystem />
    </group>
  );
}
