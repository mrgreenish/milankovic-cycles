"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector2, Vector3, type PerspectiveCamera } from "three";
import type { OrbitalVisualFocus } from "@/lib/orbital/types";
import {
  animationTime,
  useAmbientTime,
  useSceneActivity,
  wakeScene,
} from "./SceneRuntime";
import {
  FOCUSES,
  SEMI_MAJOR_AXIS,
  useSceneFrame,
  type SceneFrame,
} from "./SceneState";

const UP = new Vector3(0, 1, 0);
const FOV = 40;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);

type Pose = { position: Vector3; look: Vector3 };

/** Pull the camera back until the whole orbit fits the free part of the stage. */
function fitted(
  base: Vector3,
  frame: SceneFrame,
  freeAspect: number,
  /** How much of the orbit's depth shows on screen: near 1 from straight above. */
  depth: number,
) {
  const reach = SEMI_MAJOR_AXIS * (1 + frame.e) + 2.3;
  const reachDepth =
    (SEMI_MAJOR_AXIS * Math.sqrt(1 - frame.e * frame.e) + 1.6) * depth;
  const visible = TAN_HALF_FOV * base.length();
  return base.multiplyScalar(
    Math.max(1, reach / (visible * freeAspect), reachDepth / visible),
  );
}

function computePoses(
  frame: SceneFrame,
  freeAspect: number,
  poses: Record<OrbitalVisualFocus, Pose>,
  scratch: { radial: Vector3; tangent: Vector3 },
) {
  const { earth, axis, radius } = frame;
  const { radial, tangent } = scratch;
  radial.copy(earth).setY(0);
  if (radial.lengthSq() < 1e-6) radial.set(1, 0, 0);
  radial.normalize();
  tangent.set(-radial.z, 0, radial.x);
  const narrow = Math.min(1, freeAspect);

  // Title view: Earth fills the stage, lit from the left, night side to the right.
  const lift = frame.heroProgress;
  poses.hero.look.copy(earth);
  poses.hero.position
    .copy(earth)
    .addScaledVector(tangent, (4.4 + lift * 2) / Math.min(1, narrow * 1.25))
    .addScaledVector(radial, -2.4)
    .addScaledVector(UP, 0.7 + lift * 0.8);

  // Looking down at the north pole, with the Sun to the left.
  poses.idea.look.copy(earth).addScaledVector(axis, radius * 0.25);
  poses.idea.position
    .copy(earth)
    .addScaledVector(axis, (3.5 * radius) / 0.95 / Math.min(1, narrow * 1.1))
    .addScaledVector(tangent, 1.0)
    .addScaledVector(radial, -0.2);

  poses.shape.look.set(0, 0, 0);
  fitted(poses.shape.position.set(0, 16, 3), frame, freeAspect, 0.98);

  poses.tilt.look.copy(earth).addScaledVector(UP, radius * 0.3);
  poses.tilt.position
    .copy(earth)
    .addScaledVector(tangent, 4.2 / Math.min(1, narrow * 1.2))
    .addScaledVector(radial, -2.2)
    .addScaledVector(UP, 2.0);

  poses.direction.look.set(0, -0.4, 0);
  fitted(poses.direction.position.set(0, 8.5, 10.5), frame, freeAspect, 1.1);

  poses.timeline.look.set(0, 0, 0);
  fitted(poses.timeline.position.set(0, 12.5, 7), frame, freeAspect, 0.88);

  poses.combined.look.set(0, -0.3, 0);
  fitted(poses.combined.position.set(0, 7.2, 11.2), frame, freeAspect, 1.0);
}

export function CameraRig({
  live,
}: {
  live: { current: { x: number; y: number } } | undefined;
}) {
  const frame = useSceneFrame();
  const ambient = useAmbientTime();
  const activity = useSceneActivity();
  const rig = useMemo(() => {
    const poses = Object.fromEntries(
      FOCUSES.map((focus) => [
        focus,
        { position: new Vector3(), look: new Vector3() },
      ]),
    ) as Record<OrbitalVisualFocus, Pose>;
    return {
      poses,
      scratch: { radial: new Vector3(), tangent: new Vector3() },
      position: new Vector3(),
      look: new Vector3(),
      up: new Vector3(),
      polarUp: new Vector3(),
      offset: new Vector3(),
      side: new Vector3(),
      hover: new Vector2(),
    };
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const size = state.size;
    const { poses, scratch, position, look, up, polarUp, offset, side, hover } =
      rig;
    // The chapter rail takes 144px of the free width beside a wide layout.
    const freeWidth =
      size.width * (1 - 2 * Math.abs(frame.shift)) -
      (frame.shift > 0.01 ? 144 : 0);
    const freeAspect = Math.max(0.5, freeWidth / Math.max(1, size.height));
    computePoses(frame, freeAspect, poses, scratch);

    position.set(0, 0, 0);
    look.set(0, 0, 0);
    let total = 0;
    for (const focus of FOCUSES) {
      const w = frame.weight[focus];
      position.addScaledVector(poses[focus].position, w);
      look.addScaledVector(poses[focus].look, w);
      total += w;
    }
    position.multiplyScalar(1 / Math.max(total, 0.0001));
    look.multiplyScalar(1 / Math.max(total, 0.0001));

    // A slow drift and the pointer keep a still scene alive.
    const time = animationTime(ambient.current);
    // The pointer is eased, so entering, moving and leaving the stage all
    // glide instead of jumping. Leaving drifts back to centre in about a second.
    const target = live?.current ?? { x: 0, y: 0 };
    const follow = 1 - Math.exp(-3.2 * Math.min(delta, 0.05));
    const dx = (target.x - hover.x) * follow;
    const dy = (target.y - hover.y) * follow;
    hover.set(hover.x + dx, hover.y + dy);
    if (Math.abs(dx) + Math.abs(dy) > 2e-4) wakeScene(activity, 350);
    offset.copy(position).sub(look);
    offset.applyAxisAngle(UP, Math.sin(time * 0.13) * 0.035 - hover.x * 0.07);
    side.crossVectors(offset, UP).normalize();
    offset.applyAxisAngle(side, hover.y * 0.04 + Math.sin(time * 0.11) * 0.012);
    position.copy(look).add(offset);

    // The polar view turns so the Sun stays on the left of the picture.
    polarUp.copy(scratch.tangent).multiplyScalar(-1);
    up.copy(UP).lerp(polarUp, frame.weight.idea).normalize();

    camera.position.copy(position);
    camera.up.copy(up);
    camera.lookAt(look);
    camera.fov = FOV;
    camera.setViewOffset(
      size.width,
      size.height,
      -frame.shift * size.width,
      -frame.shiftY * size.height,
      size.width,
      size.height,
    );
    camera.updateProjectionMatrix();
  }, -2);

  return null;
}
