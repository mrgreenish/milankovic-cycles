"use client";
import React from "react";
import {
  EffectComposer,
  Noise,
  Vignette,
  Bloom,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";

export function SceneEffects({ isMobile = false }) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={isMobile ? 0.4 : 0.8}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.4}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.3}
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
