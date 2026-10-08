"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { displayEccentricity } from "@/lib/orbital/geometry";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type {
  OrbitScale,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";
import type { SceneLive } from "./sceneLive";
import { CameraRig } from "./space/CameraRig";
import { ClimateInset, type InsetRect } from "./space/ClimateInset";
import { OrbitScene } from "./space/OrbitScene";
import { EarthGeometryProvider, InsetEarth } from "./space/Earth";
import {
  SceneStateProvider,
  MainSceneState,
  defaultTargets,
  useSceneFrame,
  type SceneTargets,
} from "./space/SceneState";
import {
  SceneRuntime,
  useGraphicsQuality,
  useSceneActivity,
  wakeScene,
} from "./space/SceneRuntime";
import { StarField } from "./space/StarField";
import { useSpaceTextures } from "./space/textures";
import { QUALITY, type GraphicsQuality } from "./space/quality";

export type SceneClientProps = {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  focus: OrbitalVisualFocus;
  /** Land ice as a share of the ice-age peak: 0 today, 1 at the peak, below 0 for less than today. */
  ice?: number;
  /** A moment in La2004, in thousands of years from J2000; null when the orbit was set by hand. */
  timeKyr?: number | null;
  clockPlaying?: boolean;
  /** Take ice from the measured record at the scene's clock rather than from `ice`. */
  iceFollowsClock?: boolean;
  /** A second, small view of Earth from above the pole; null for none. */
  inset?: InsetRect | null;
  /** Where the picture centres, as a share of the canvas width. */
  stageShift?: number;
  stageShiftY?: number;
  /** Faster easing keeps the picture in step with a playing timeline. */
  rate?: number;
  live?: SceneLive;
  reducedMotion: boolean;
  motionPaused?: boolean;
  onReady?: () => void;
  onFailure?: () => void;
};

/** Rotates everything about the Sun so the timeline can hold Earth in place. */
function World({ children }: { children: ReactNode }) {
  const frame = useSceneFrame();
  const group = useRef<Group>(null);
  useFrame(() => {
    if (group.current) group.current.rotation.y = frame.yaw;
  });
  return <group ref={group}>{children}</group>;
}

function writeTarget(
  targets: { current: SceneTargets },
  hero: number,
  timeKyr: number | null,
) {
  targets.current.heroProgress = hero;
  targets.current.timeKyr = timeKyr;
}

function SceneContents({
  parameters,
  scale,
  focus,
  ice = 0,
  timeKyr = null,
  clockPlaying = false,
  iceFollowsClock = false,
  inset = null,
  stageShift = 0,
  stageShiftY = 0,
  rate = 7,
  live,
  onAssetsReady,
  onFailure,
}: Pick<
  SceneClientProps,
  | "parameters"
  | "scale"
  | "focus"
  | "ice"
  | "timeKyr"
  | "clockPlaying"
  | "iceFollowsClock"
  | "inset"
  | "stageShift"
  | "stageShiftY"
  | "rate"
  | "live"
> & { onAssetsReady: (ready: boolean) => void; onFailure?: () => void }) {
  const quality = useGraphicsQuality();
  const activity = useSceneActivity();
  const textures = useSpaceTextures(quality, onFailure);
  useEffect(() => {
    if (textures) onAssetsReady(true);
  }, [textures, onAssetsReady]);

  const targets = useRef<SceneTargets>({ ...defaultTargets });
  const pageTime = useRef<number | null>(timeKyr);
  useEffect(() => {
    pageTime.current = timeKyr;
    // The scene reads these on its next frame; no React render per frame.
    Object.assign(targets.current, {
      focus,
      eccentricity: displayEccentricity(parameters.eccentricity, scale),
      presentEccentricity: displayEccentricity(
        PRESENT_PARAMETERS.eccentricity,
        scale,
      ),
      trueEccentricity: parameters.eccentricity,
      obliquityDeg: parameters.obliquityDeg,
      perihelionDeg: parameters.earthPerihelionLongitudeDeg,
      ice: Math.min(1.1, Math.max(-0.25, ice)),
      timeKyr: live?.current.scrub ?? timeKyr,
      clockPlaying,
      scale,
      iceFollowsClock,
      stageShift,
      stageShiftY,
      rate,
    } satisfies Partial<SceneTargets>);
    // Anything the page changes (a view, a slider, a playing clock) moves the
    // scene, so it renders at its full rate for a moment.
    wakeScene(activity, 1800);
  });

  useFrame(() => {
    // A dragged clock reaches the scene at once; otherwise it follows the page.
    writeTarget(
      targets,
      live?.current.hero ?? 0,
      live?.current.scrub ?? pageTime.current,
    );
  }, -4);

  return (
    <SceneStateProvider targets={targets}>
      <StarField />
      <EarthGeometryProvider>
        <MainSceneState>
          <CameraRig live={live} />
          {textures ? (
            <World>
              <OrbitScene parameters={parameters} textures={textures} />
            </World>
          ) : null}
        </MainSceneState>
        {textures && inset ? <InsetEarth textures={textures} /> : null}
      </EarthGeometryProvider>
      <ClimateInset rect={inset} />
    </SceneStateProvider>
  );
}

export default function SceneClient({
  motionPaused = false,
  onReady,
  onFailure,
  ...scene
}: SceneClientProps) {
  const [assetsReady, setAssetsReady] = useState(false);
  const [quality, setQuality] = useState<GraphicsQuality>("medium");

  return (
    <Canvas
      aria-hidden="true"
      frameloop="never"
      dpr={[1, QUALITY[quality].dpr]}
      camera={{ position: [0, 7.2, 11.2], fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x070a12, 0);
        gl.toneMappingExposure = 1.05;
      }}
    >
      <SceneRuntime
        ready={assetsReady}
        motionPaused={motionPaused}
        onReady={onReady}
        onFailure={onFailure}
        quality={quality}
        onQualityChange={setQuality}
        live={scene.live}
      >
        <SceneContents
          {...scene}
          onAssetsReady={setAssetsReady}
          onFailure={onFailure}
        />
      </SceneRuntime>
    </Canvas>
  );
}
