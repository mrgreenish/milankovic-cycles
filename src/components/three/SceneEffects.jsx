"use client";
import React from "react";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function SceneEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.5}
      />
      <Vignette
        offset={0.5}
        darkness={0.4}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
