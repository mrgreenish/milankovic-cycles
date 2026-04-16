"use client";
import React, { useState, useCallback, useEffect, Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

import { Sun } from "@/components/three/Sun";
import { OrbitPath } from "@/components/three/OrbitPath";
import { OrbitingEarth } from "@/components/three/OrbitingEarth";
import { SceneEffects } from "@/components/three/SceneEffects";
import { SceneController } from "./SceneController";
import { StoryProgressBar } from "./StoryProgressBar";

import { HeroSection } from "./HeroSection";
import { EarthSunSection } from "./EarthSunSection";
import { EccentricitySection } from "./EccentricitySection";
import { AxialTiltSection } from "./AxialTiltSection";
import { PrecessionSection } from "./PrecessionSection";
import { CombinedSection } from "./CombinedSection";
import { PlaygroundSection } from "./PlaygroundSection";
import { ClosingSection } from "./ClosingSection";

import {
  calculateGlobalTemperature,
  smoothTemperature,
} from "@/lib/temperatureUtils";

import Link from "next/link";

const TOTAL_SECTIONS = 8;

export function StoryContainer() {
  // Orbital parameters
  const [eccentricity, setEccentricity] = useState(0.0167);
  const [axialTilt, setAxialTilt] = useState(23.44);
  const [precession, setPrecession] = useState(0);

  // Climate state
  const [temperature, setTemperature] = useState(10);
  const [displayedTemp, setDisplayedTemp] = useState(10);
  const [iceFactor, setIceFactor] = useState(0);
  const [co2Level] = useState(280);

  // Simulation state
  const [simulatedYear, setSimulatedYear] = useState(0);

  // Section tracking
  const [currentSection, setCurrentSection] = useState(0);

  // Playground UI state
  const [focusedParam, setFocusedParam] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  // Scene visibility
  const [sceneConfig, setSceneConfig] = useState({
    showSun: false,
    showOrbit: false,
    showAxis: false,
  });

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Earth group ref for positioning
  const earthGroupRef = useRef();

  // Derive season from current state
  const isPlaygroundSection = currentSection === 6;

  // Calculate temperature whenever params change.
  // Always use annual mean at 65°N (the Milankovitch-critical latitude) —
  // averaging across 4 seasons captures the full orbital forcing signal and
  // gives a stable reading that only changes when the user moves a slider.
  useEffect(() => {
    const seasons = [0, 0.25, 0.5, 0.75];
    let totalTemp = 0;
    let totalIce = 0;
    for (const s of seasons) {
      const data = calculateGlobalTemperature({
        latitude: 65,
        season: s,
        eccentricity,
        axialTilt,
        precession,
        co2Level,
        tempOffset: 0,
      });
      totalTemp += data.temperature;
      totalIce += data.iceFactor;
    }
    setTemperature(totalTemp / seasons.length);
    setIceFactor(totalIce / seasons.length);
  }, [eccentricity, axialTilt, precession, co2Level]);

  // Smooth temperature display using rAF
  const displayedTempRef = useRef(10);
  useEffect(() => {
    let frame;
    const tick = () => {
      const gap = Math.abs(temperature - displayedTempRef.current);
      // Snap to target when close enough to avoid permanent lag
      if (gap < 0.05) {
        if (displayedTempRef.current !== temperature) {
          displayedTempRef.current = temperature;
          setDisplayedTemp(temperature);
        }
        frame = requestAnimationFrame(tick);
        return;
      }
      const next = smoothTemperature(displayedTempRef.current, temperature, 0.5);
      displayedTempRef.current = next;
      setDisplayedTemp(next);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [temperature]);

  // Simple year counter for playground
  useEffect(() => {
    if (currentSection !== 6) return;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const delta = now - last;
      last = now;
      setSimulatedYear((prev) => prev + delta * 0.1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [currentSection]);

  const handleSectionInView = useCallback((id) => {
    setCurrentSection(id);
  }, []);

  const handleSceneConfig = useCallback((config) => {
    setSceneConfig(config);
  }, []);

  // Combined section animation handler
  const handleCombinedParamsChange = useCallback(
    ({ eccentricity: e, axialTilt: t, precession: p }) => {
      setEccentricity(e);
      setAxialTilt(t);
      setPrecession(p);
    },
    []
  );

  const formatNumber = (num) => {
    if (!isFinite(num) || Math.abs(num) > 1e21) return "0 years";
    const absNum = Math.abs(num);
    if (absNum >= 1000000) return `${(absNum / 1000000).toFixed(1)}M years`;
    if (absNum >= 1000) return `${(absNum / 1000).toFixed(1)}k years`;
    return `${Math.round(absNum)} years`;
  };

  const isPlayground = currentSection === 6;
  const effectiveFocus = isPlayground ? focusedParam : null;

  return (
    <div className="relative">
      {/* Fixed 3D Canvas */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={null}>
          <Canvas
            shadows={false}
            gl={{
              antialias: true,
              powerPreference: "high-performance",
              precision: "highp",
              toneMapping: THREE.NoToneMapping,
            }}
            dpr={[1, 2]}
            performance={{ min: 0.5 }}
          >
            <PerspectiveCamera
              makeDefault
              position={[0, 5, 15]}
              fov={50}
              near={0.1}
              far={1000}
            />
            <ambientLight intensity={0.2} />
            <directionalLight
              castShadow={false}
              position={[10, 20, 10]}
              intensity={1.5}
            />

            {/* Scene controller manages camera based on scroll section */}
            <SceneController
              currentSection={currentSection}
              onSceneConfig={handleSceneConfig}
            />

            {/* 3D Elements - visibility controlled by scene config */}
            {sceneConfig.showSun && <Sun />}
            {sceneConfig.showOrbit && (
              <OrbitPath
                eccentricity={eccentricity}
                showLabels={currentSection >= 4}
                currentSection={currentSection}
                spotlight={effectiveFocus}
              />
            )}
            <OrbitingEarth
              eccentricity={eccentricity}
              axialTilt={axialTilt}
              precession={precession}
              iceFactor={iceFactor}
              groupRefFromParent={earthGroupRef}
              showAxis={sceneConfig.showAxis}
              currentSection={currentSection}
              spotlight={effectiveFocus}
            />
            {/* OrbitControls only in playground */}
            {isPlayground && (
              <OrbitControls
                enableDamping={true}
                dampingFactor={0.05}
                minDistance={20}
                maxDistance={100}
                enablePan={true}
                enableZoom={true}
                zoomSpeed={0.8}
                rotateSpeed={0.5}
              />
            )}

            {/* Post-processing effects */}
            <SceneEffects isMobile={isMobile} />
          </Canvas>
        </Suspense>
      </div>

      {/* Navigation */}
      <nav className="fixed top-4 left-4 z-50 flex gap-3 bg-deep-space/40 backdrop-blur-sm rounded-md px-3 py-1.5">
        <Link
          href="/about"
          className="text-sm text-stardust-white opacity-60 hover:opacity-100 transition-opacity"
        >
          About
        </Link>
        <Link
          href="/faq"
          className="text-sm text-stardust-white opacity-60 hover:opacity-100 transition-opacity"
        >
          FAQ
        </Link>
      </nav>

      {/* Progress bar */}
      <StoryProgressBar
        currentSection={currentSection}
        totalSections={TOTAL_SECTIONS}
      />

      {/* Scrollable content sections */}
      <div className="relative z-10">
        <HeroSection onInView={handleSectionInView} />
        <EarthSunSection onInView={handleSectionInView} />
        <EccentricitySection
          eccentricity={eccentricity}
          onEccentricityChange={setEccentricity}
          temperature={temperature}
          onInView={handleSectionInView}
        />
        <AxialTiltSection
          axialTilt={axialTilt}
          onAxialTiltChange={setAxialTilt}
          temperature={temperature}
          onInView={handleSectionInView}
        />
        <PrecessionSection
          precession={precession}
          onPrecessionChange={setPrecession}
          temperature={temperature}
          onInView={handleSectionInView}
        />
        <CombinedSection
          onParamsChange={handleCombinedParamsChange}
          onInView={handleSectionInView}
          temperature={temperature}
        />
        <PlaygroundSection
          eccentricity={eccentricity}
          axialTilt={axialTilt}
          precession={precession}
          temperature={temperature}
          iceFactor={iceFactor}
          onEccentricityChange={setEccentricity}
          onAxialTiltChange={setAxialTilt}
          onPrecessionChange={setPrecession}
          simulatedYear={simulatedYear}
          co2Level={co2Level}
          displayedTemp={displayedTemp}
          formatNumber={formatNumber}
          onInView={handleSectionInView}
          focusedParam={focusedParam}
          onFocusParamChange={setFocusedParam}
          onSnapshot={setSnapshot}
        />
        <ClosingSection onInView={handleSectionInView} snapshot={snapshot} />
      </div>
    </div>
  );
}
