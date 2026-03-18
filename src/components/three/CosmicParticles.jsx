"use client";
import React, { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { particleVertexShader, particleFragmentShader } from "./shaders";

export function CosmicParticles({ count = 1000 }) {
  const particlesRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      targetMouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.05;
    mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.05;
  });

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.08 + 0.02;
      const factor = size * 0.8;
      const speed = Math.random() * 0.01 + 0.002;
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      const mouseRange = Math.random() * 20 + 10;
      const mouseStrength = Math.random() * 0.1 + 0.05;
      let starType = Math.random();
      let color;
      if (starType < 0.1) color = new THREE.Color(0x4a88ff);
      else if (starType < 0.3) color = new THREE.Color(0xe8f1ff);
      else if (starType < 0.6) color = new THREE.Color(0xfff4d2);
      else if (starType < 0.8) color = new THREE.Color(0xffc982);
      else color = new THREE.Color(0xff8a61);

      temp.push({
        size, factor, speed, x, y, z, color, mouseRange, mouseStrength,
        mx: 0, my: 0, mz: 0,
        originalX: x, originalY: y, originalZ: z,
      });
    }
    return temp;
  }, [count]);

  const frameCount = useRef(0);

  useFrame(({ clock }) => {
    frameCount.current += 1;
    if (frameCount.current % 2 !== 0) return;

    const elapsedTime = clock.getElapsedTime();
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      const scales = particlesRef.current.geometry.attributes.scale.array;
      const colors = particlesRef.current.geometry.attributes.color.array;

      particles.forEach((p, i) => {
        const { originalX, originalY, originalZ, factor, speed, color, mouseRange, mouseStrength } = p;

        const mouseX = mouse.current.x * 30;
        const mouseY = mouse.current.y * 15;
        const dx = originalX - mouseX;
        const dy = originalY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let mouseInfluence = 0;
        if (dist < mouseRange) {
          mouseInfluence = (1 - dist / mouseRange) * mouseStrength;
        }

        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * mouseInfluence * mouseRange;
        const pushY = Math.sin(angle) * mouseInfluence * mouseRange;

        const ix = i * 3;
        positions[ix] = originalX + Math.sin(elapsedTime * speed + i * 0.1) * factor + pushX;
        positions[ix + 1] = originalY + Math.cos(elapsedTime * speed + i * 0.2) * factor + pushY;
        positions[ix + 2] = originalZ + Math.sin(elapsedTime * speed + i * 0.3) * factor * 0.5;

        const twinkle = Math.sin(elapsedTime * 2 + i) * 0.3 + 0.7;
        const glow = mouseInfluence > 0 ? 1 + mouseInfluence * 2 : 1;
        scales[i] = p.size * twinkle * glow;

        if (mouseInfluence > 0) {
          colors[ix] = Math.max(0, Math.min(1, color.r - mouseInfluence * 0.1));
          colors[ix + 1] = Math.max(0, Math.min(1, color.g + mouseInfluence * 0.05));
          colors[ix + 2] = Math.max(0, Math.min(1, color.b + mouseInfluence * 0.25));
        } else {
          colors[ix] = color.r;
          colors[ix + 1] = color.g;
          colors[ix + 2] = color.b;
        }
      });

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.scale.needsUpdate = true;
      particlesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={particles.length}
          array={new Float32Array(particles.length)}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        attach="material"
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
