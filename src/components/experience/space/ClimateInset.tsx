"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import { useSceneFrame } from "./SceneState";

/** Where the climate globe sits in the canvas, in CSS pixels from the top-right corner. */
export type InsetRect = { size: number; right: number; top: number };

const FOV = 26;
/** Earth's angular radius as a share of the field of view. */
const FILL = 0.43;

/**
 * Draws the scene twice: the main view, then a small second view of Earth alone
 * seen from above the north pole, so ice and the 65°N line stay readable
 * whatever the main view shows. It owns the render call (priority 1).
 */
export function ClimateInset({ rect }: { rect: InsetRect | null }) {
  const frame = useSceneFrame();
  const camera = useMemo(() => {
    const inset = new PerspectiveCamera(FOV, 1, 0.05, 60);
    inset.layers.set(1);
    inset.userData.inset = true;
    return inset;
  }, []);
  const work = useMemo(
    () => ({ radial: new Vector3(), tangent: new Vector3(), dir: new Vector3() }),
    [],
  );

  useFrame(({ gl, scene, camera: main, size }) => {
    gl.setScissorTest(false);
    gl.setViewport(0, 0, size.width, size.height);
    gl.render(scene, main);
    if (!rect || rect.size < 24) return;

    const { radial, tangent, dir } = work;
    radial.copy(frame.earth).setY(0);
    if (radial.lengthSq() < 1e-6) radial.set(1, 0, 0);
    radial.normalize();
    tangent.set(-radial.z, 0, radial.x);
    // Above the pole, leaning a little toward the Sun's side, with the Sun on the left.
    dir.copy(frame.axis).addScaledVector(tangent, 0.3).addScaledVector(radial, -0.1).normalize();
    const distance = frame.radius / Math.sin(FILL * ((FOV * Math.PI) / 180));
    camera.position.copy(frame.earth).addScaledVector(dir, distance);
    camera.up.copy(tangent).multiplyScalar(-1);
    camera.lookAt(frame.earth);

    const x = Math.round(size.width - rect.right - rect.size);
    const y = Math.round(size.height - rect.top - rect.size);
    gl.setViewport(x, y, rect.size, rect.size);
    gl.setScissor(x, y, rect.size, rect.size);
    gl.setScissorTest(true);
    // Keep the picture behind (stars, orbit lines) and only clear depth, so the
    // globe sits over it like a lens rather than punching a square hole.
    const auto = gl.autoClear;
    const autoUpdate = scene.matrixWorldAutoUpdate;
    gl.autoClear = false;
    // The main pass already updated every world matrix. Only the inset camera
    // moves between passes (Earth's onBeforeRender changes uniforms), so reuse
    // those matrices instead of walking and recomputing the scene a second time.
    // Three still updates the unparented camera independently.
    scene.matrixWorldAutoUpdate = false;
    try {
      gl.clearDepth();
      gl.render(scene, camera);
    } finally {
      scene.matrixWorldAutoUpdate = autoUpdate;
      gl.autoClear = auto;
      gl.setScissorTest(false);
      gl.setViewport(0, 0, size.width, size.height);
    }
  }, 1);

  return null;
}
