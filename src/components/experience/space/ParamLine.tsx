"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  NormalBlending,
  Vector2,
  Vector4,
  type Mesh,
  type ShaderMaterial,
} from "three";
import { LINE_KIND, lineFragment, lineVertex, type LineKind } from "./lineShader";
import { useSceneFrame, type SceneFrame } from "./SceneState";

export type LineUniforms = {
  uKind: { value: number };
  uP: { value: Vector4 };
  uQ: { value: Vector4 };
  uWidth: { value: number };
  uViewport: { value: Vector2 };
  uColor: { value: Color };
  uOpacity: { value: number };
  uDash: { value: number };
  uFlow: { value: number };
  uHead: { value: number };
  uTrail: { value: number };
  uGradient: { value: number };
};

function stripGeometry(segments: number) {
  const count = (segments + 1) * 2;
  const along = new Float32Array(count);
  const side = new Float32Array(count);
  const indices: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    along[i * 2] = along[i * 2 + 1] = i / segments;
    side[i * 2] = -1;
    side[i * 2 + 1] = 1;
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new BufferGeometry();
  // Three expects a position attribute; the shader derives the real one.
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(count * 3), 3),
  );
  geometry.setAttribute("aT", new BufferAttribute(along, 1));
  geometry.setAttribute("aSide", new BufferAttribute(side, 1));
  geometry.setIndex(indices);
  return geometry;
}

/** `update` runs every frame with the eased scene state; write uniforms there. */
export function ParamLine({
  kind,
  color,
  width = 2,
  segments = 2,
  dash = 0,
  glow = false,
  update,
}: {
  kind: LineKind;
  color: string;
  width?: number;
  segments?: number;
  dash?: number;
  glow?: boolean;
  update: (uniforms: LineUniforms, frame: SceneFrame) => void;
}) {
  const frame = useSceneFrame();
  const material = useRef<ShaderMaterial>(null);
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => stripGeometry(segments), [segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo<LineUniforms>(
    () => ({
      uKind: { value: LINE_KIND[kind] },
      uP: { value: new Vector4() },
      uQ: { value: new Vector4() },
      uWidth: { value: width },
      uViewport: { value: new Vector2(1, 1) },
      uColor: { value: new Color(color) },
      uOpacity: { value: 0 },
      uDash: { value: dash },
      uFlow: { value: 0 },
      uHead: { value: 0 },
      uTrail: { value: 0 },
      uGradient: { value: 0 },
    }),
    [kind, color, width, dash],
  );
  useFrame(({ size, viewport }) => {
    const live = material.current?.uniforms as LineUniforms | undefined;
    if (!live) return;
    live.uViewport.value.set(
      (size.width * viewport.dpr) / 2,
      (size.height * viewport.dpr) / 2,
    );
    // The quad is wider than the visible core to leave room for the halo.
    live.uWidth.value = width * viewport.dpr * 1.4;
    update(live, frame);
    // The fragment shader already discards the whole line below this opacity.
    // Skip the draw call too, keeping exactly the same visible pixels.
    if (mesh.current) mesh.current.visible = live.uOpacity.value >= 0.004;
  });
  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false} renderOrder={1}>
      <shaderMaterial
        ref={material}
        vertexShader={lineVertex}
        fragmentShader={lineFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
        side={DoubleSide}
        blending={glow ? AdditiveBlending : NormalBlending}
      />
    </mesh>
  );
}
