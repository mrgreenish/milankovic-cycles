"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Earth } from "./Earth";
import { PrecessionCone } from "./AxisIndicators";

export function OrbitingEarth({
  eccentricity,
  axialTilt,
  precession,
  iceFactor,
  groupRefFromParent,
  showAxis = true,
  currentSection = 0,
  spotlight = null,
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

    const isPinnedSection = currentSection === 3 || currentSection === 4;
    if (!isPinnedSection) {
      orbitThetaRef.current += delta * 0.1;
    }

    const targetTheta = isPinnedSection ? 0 : orbitThetaRef.current;
    const targetX = a * Math.cos(targetTheta);
    const targetZ = b * Math.sin(targetTheta);
    const easing = isPinnedSection ? 0.16 : 0.08;

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
      // Slow rotation during precession section so wobble is the main visible motion
      const rotSpeed = currentSection === 4 ? 0.002 : 0.01;
      earthRef.current.rotation.y += rotSpeed;
    }
  });

  const onEarthReady = useCallback(() => setIsReady(true), []);

  // Show the precession cone in sections where precession is relevant
  const showPrecessionCone = showAxis && (currentSection === 4 || currentSection === 5 || currentSection === 6);

  return (
    <group ref={groupRef}>
      <Earth
        ref={earthRef}
        axialTilt={axialTilt}
        precession={precession}
        iceFactor={iceFactor}
        onReady={onEarthReady}
        showAxis={showAxis}
        spotlight={spotlight}
      />
      {/* Precession cone is outside Earth's quaternion group so it stays fixed */}
      <PrecessionCone
        axialTilt={axialTilt}
        precession={precession}
        visible={showPrecessionCone}
        spotlight={spotlight}
      />
    </group>
  );
}
