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
  6: { // Playground - initial position, then user takes over via OrbitControls
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
  const prevSection = useRef(currentSection);
  // Track whether we've finished the initial transition into the playground
  const playgroundSettled = useRef(false);

  useEffect(() => {
    const config = SCENE_CONFIGS[currentSection] || SCENE_CONFIGS[0];
    targetPos.current.set(...config.camera);
    targetLookAt.current.set(...config.lookAt);

    // Reset settled flag when entering playground so we lerp to initial position first
    if (currentSection === 6 && prevSection.current !== 6) {
      playgroundSettled.current = false;
    }
    // Reset when leaving playground
    if (currentSection !== 6) {
      playgroundSettled.current = false;
    }

    prevSection.current = currentSection;

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
    // In playground section, stop controlling camera once we've settled
    // so OrbitControls can take over
    if (currentSection === 6) {
      if (!playgroundSettled.current) {
        // Lerp to initial playground position
        camera.position.lerp(targetPos.current, 0.03);
        currentLookAt.current.lerp(targetLookAt.current, 0.03);
        camera.lookAt(currentLookAt.current);
        // Check if close enough to settle
        if (camera.position.distanceTo(targetPos.current) < 0.5) {
          playgroundSettled.current = true;
        }
      }
      // Once settled, do nothing — OrbitControls handles camera
      return;
    }

    // For all other sections, smoothly interpolate camera position
    camera.position.lerp(targetPos.current, 0.03);
    currentLookAt.current.lerp(targetLookAt.current, 0.03);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

export { SCENE_CONFIGS };
