"use client";
import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Camera positions and lookAt targets per section
const SCENE_CONFIGS = {
  0: { // Hero - moderately close view centered on orbit, Earth always visible
    camera: [0, 15, 35],
    lookAt: [0, 0, 0],
    showSun: false,
    showOrbit: false,
    showAxis: false,
  },
  1: { // Earth & Sun - reveal orbit
    camera: [0, 30, 50],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: false,
  },
  2: { // Eccentricity - top down
    camera: [0, 55, 5],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: false,
  },
  3: { // Axial Tilt - side view close to Earth
    camera: [18, 5, 15],
    lookAt: [20, 0, 0],
    showSun: true,
    showOrbit: false,
    showAxis: true,
  },
  4: { // Precession - angled view
    camera: [15, 25, 35],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: true,
  },
  5: { // Combined - overview
    camera: [0, 35, 55],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: true,
  },
  6: { // Playground - same as combined, user takes over
    camera: [0, 30, 60],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: true,
  },
  7: { // Closing - cinematic pullback
    camera: [0, 12, 30],
    lookAt: [0, 0, 0],
    showSun: false,
    showOrbit: false,
    showAxis: false,
  },
};

export function SceneController({ currentSection, onSceneConfig }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 30, 60));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const config = SCENE_CONFIGS[currentSection] || SCENE_CONFIGS[0];
    targetPos.current.set(...config.camera);
    targetLookAt.current.set(...config.lookAt);

    // Notify parent about visibility config
    if (onSceneConfig) {
      onSceneConfig({
        showSun: config.showSun,
        showOrbit: config.showOrbit,
        showAxis: config.showAxis,
      });
    }
  }, [currentSection, onSceneConfig]);

  useFrame(() => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetPos.current, 0.03);
    currentLookAt.current.lerp(targetLookAt.current, 0.03);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

export { SCENE_CONFIGS };
