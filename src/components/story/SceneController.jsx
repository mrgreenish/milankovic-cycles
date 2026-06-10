"use client";
import React, { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Camera positions, lookAt targets and stage composition per section.
//
// `stage` shifts the rendered view so the 3D subject sits in the open zone
// beside the narrative column instead of behind it. Fractions of the
// viewport: positive x moves the scene right, positive y moves it up.
// Desktop cards live in a left column → scene composes right (+x).
// Mobile cards anchor to the bottom → scene composes up (+y).
const SCENE_CONFIGS = {
  0: { // Hero - close on a half-lit Earth, low in the frame behind the title
    camera: [14, 2.5, 9],
    cameraMobile: [8, 3.5, 14],
    lookAt: [20, 0, 0],
    showSun: false,
    showOrbit: false,
    showAxis: false,
    stage: { x: 0.3, y: -0.22 },
    stageMobile: { x: 0.14, y: -0.4 },
  },
  1: { // Earth & Sun - pull back to reveal the whole orbit
    camera: [0, 30, 50],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: false,
    stage: { x: 0.16, y: 0 },
    stageMobile: { x: 0, y: 0.12 },
  },
  2: { // Eccentricity - top down
    camera: [0, 55, 5],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: false,
    stage: { x: 0.16, y: 0 },
    stageMobile: { x: 0, y: 0.12 },
  },
  3: { // Axial Tilt - side view close to Earth
    camera: [18, 5, 15],
    lookAt: [20, 0, 0],
    showSun: true,
    showOrbit: false,
    showAxis: true,
    stage: { x: 0.18, y: 0 },
    stageMobile: { x: 0, y: 0.12 },
  },
  4: { // Precession - same view as tilt section, with orbit for seasonal context
    camera: [18, 5, 15],
    lookAt: [20, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: true,
    stage: { x: 0.18, y: 0 },
    stageMobile: { x: 0, y: 0.12 },
  },
  5: { // Combined - overview
    camera: [0, 35, 55],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: true,
    stage: { x: 0.16, y: 0 },
    stageMobile: { x: 0, y: 0.12 },
  },
  6: { // Playground - user controls camera; panel sits right, scene left
    camera: [0, 30, 60],
    lookAt: [0, 0, 0],
    showSun: true,
    showOrbit: true,
    showAxis: true,
    stage: { x: -0.22, y: 0 },
    stageMobile: { x: 0, y: 0.1 },
  },
  7: { // Closing - cinematic pullback
    camera: [0, 12, 30],
    lookAt: [0, 0, 0],
    showSun: false,
    showOrbit: false,
    showAxis: false,
    stage: { x: 0, y: 0 },
    stageMobile: { x: 0, y: 0 },
  },
};

export function SceneController({ currentSection, onSceneConfig, isMobile = false }) {
  const { camera, size } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 30, 60));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetShift = useRef({ x: 0, y: 0 });
  const currentShift = useRef({ x: 0, y: 0 });
  const prevSection = useRef(currentSection);

  useEffect(() => {
    const config = SCENE_CONFIGS[currentSection] || SCENE_CONFIGS[0];
    const cameraPos =
      (isMobile && config.cameraMobile) || config.camera;
    targetPos.current.set(...cameraPos);
    targetLookAt.current.set(...config.lookAt);

    const stage = (isMobile ? config.stageMobile : config.stage) || { x: 0, y: 0 };
    targetShift.current = stage;

    // When entering playground (section 6), snap camera to position once
    // then let OrbitControls take over completely — no lerping, no fighting
    if (currentSection === 6 && prevSection.current !== 6) {
      camera.position.set(...config.camera);
      currentLookAt.current.set(...config.lookAt);
      camera.lookAt(currentLookAt.current);
    }

    // When leaving playground, sync currentLookAt to wherever the user left the camera
    // so the lerp back to the next section starts from the right place
    if (currentSection !== 6 && prevSection.current === 6) {
      currentLookAt.current.set(0, 0, 0); // Reset lookAt to origin
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
  }, [currentSection, onSceneConfig, camera, isMobile]);

  useFrame(() => {
    // Stage composition applies in every section, including the playground —
    // it only offsets the projection, so OrbitControls is unaffected.
    const shift = currentShift.current;
    shift.x += (targetShift.current.x - shift.x) * 0.04;
    shift.y += (targetShift.current.y - shift.y) * 0.04;
    if (Math.abs(shift.x) > 0.002 || Math.abs(shift.y) > 0.002) {
      camera.setViewOffset(
        size.width,
        size.height,
        -shift.x * size.width,
        shift.y * size.height,
        size.width,
        size.height
      );
    } else if (camera.view?.enabled) {
      camera.clearViewOffset();
    }

    // Completely yield camera control in playground — OrbitControls owns it
    if (currentSection === 6) return;

    // For all other sections, smoothly interpolate camera position
    camera.position.lerp(targetPos.current, 0.03);
    currentLookAt.current.lerp(targetLookAt.current, 0.03);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}

export { SCENE_CONFIGS };
