"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Earth } from "./Earth";

export function OrbitingEarth({
  eccentricity,
  axialTilt,
  precession,
  iceFactor,
  groupRefFromParent,
  showAxis = true,
  currentSection = 0,
}) {
  const a = 20;
  const b = a * (1 - 2 * eccentricity);
  const groupRef = useRef();
  const earthRef = useRef();
  const [isReady, setIsReady] = useState(false);
  const orbitThetaRef = useRef(0);

  useEffect(() => {
    if (groupRefFromParent && groupRef.current) {
      groupRefFromParent.current = groupRef.current;
    }
  }, [groupRefFromParent, isReady]);

  useFrame((_, delta) => {
    if (!groupRef.current || !isReady) return;

    const isTiltFocusSection = currentSection === 3;
    if (!isTiltFocusSection) {
      orbitThetaRef.current += delta * 0.1;
    }

    const targetTheta = isTiltFocusSection ? 0 : orbitThetaRef.current;
    const targetX = a * Math.cos(targetTheta);
    const targetZ = b * Math.sin(targetTheta);
    const easing = isTiltFocusSection ? 0.16 : 0.08;

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      easing
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      easing
    );

    if (earthRef.current) {
      earthRef.current.rotation.y += 0.01;
    }
  });

  const onEarthReady = useCallback(() => setIsReady(true), []);

  return (
    <group ref={groupRef}>
      <Earth
        ref={earthRef}
        axialTilt={axialTilt}
        precession={precession}
        iceFactor={iceFactor}
        onReady={onEarthReady}
        showAxis={showAxis}
      />
    </group>
  );
}
