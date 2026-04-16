"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  earthVertexShader,
  earthFragmentShader,
  atmosphereVertexShader,
  atmosphereFragmentShader,
} from "./shaders";
import { AxisIndicators } from "./AxisIndicators";

export const Earth = React.forwardRef(
  (
    { axialTilt, precession, iceFactor, onReady, showAxis = true, spotlight = null },
    ref
  ) => {
    const [texturesLoaded, setTexturesLoaded] = useState(false);
    const [textures, setTextures] = useState(null);
    const worldPosition = useMemo(() => new THREE.Vector3(), []);

    useEffect(() => {
      const loadTextures = async () => {
        try {
          const textureLoader = new THREE.TextureLoader();
          const loadTexture = (url) =>
            new Promise((resolve, reject) => {
              textureLoader.load(
                url,
                (texture) => {
                  texture.flipY = false;
                  resolve(texture);
                },
                undefined,
                reject
              );
            });
          const [diffuse, normal, specular, night, cloud] = await Promise.all([
            loadTexture("/textures/Earth_Diffuse.jpg"),
            loadTexture("/textures/Earth_Normal.jpg"),
            loadTexture("/textures/Earth_Specular.jpg"),
            loadTexture("/textures/Earth_Night.jpg"),
            loadTexture("/textures/Earth_Cloud.png"),
          ]);
          setTextures({
            diffuseMap: diffuse,
            normalMap: normal,
            specularMap: specular,
            nightMap: night,
            cloudMap: cloud,
          });
          setTexturesLoaded(true);
          onReady?.();
        } catch (error) {
          console.error("Error loading textures:", error);
        }
      };
      loadTextures();
    }, [onReady]);

    const uniforms = useMemo(() => {
      if (!texturesLoaded || !textures) return null;
      return {
        dayTexture: { value: textures.diffuseMap },
        nightTexture: { value: textures.nightMap },
        normalMap: { value: textures.normalMap },
        specularMap: { value: textures.specularMap },
        sunDirection: { value: new THREE.Vector3(-1, 0, 0) },
        ambientLightColor: { value: new THREE.Color(0.2, 0.2, 0.2) },
        directionalLightColor: { value: new THREE.Color(1, 1, 1) },
        directionalLightDirection: {
          value: new THREE.Vector3(10, 20, 10).normalize(),
        },
        displacementScale: { value: 0.01 },
        iceFactor: { value: iceFactor },
      };
    }, [texturesLoaded, textures]);

    const atmosphereUniforms = useMemo(() => {
      if (!uniforms) return null;
      return {
        sunDirection: uniforms.sunDirection,
      };
    }, [uniforms]);

    useEffect(() => {
      if (uniforms) {
        uniforms.iceFactor.value = iceFactor;
      }
    }, [iceFactor, uniforms]);

    useFrame(() => {
      if (uniforms?.sunDirection?.value && ref?.current?.parent) {
        ref.current.parent.getWorldPosition(worldPosition);
        uniforms.sunDirection.value
          .copy(worldPosition)
          .normalize()
          .multiplyScalar(-1);
      }
    });

    const cloudRef = useRef();
    useFrame(() => {
      if (cloudRef.current) {
        cloudRef.current.rotation.y += 0.005;
      }
    });

    const combinedQuaternion = useMemo(() => {
      const tiltQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        THREE.MathUtils.degToRad(axialTilt)
      );
      const precessionQuaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        THREE.MathUtils.degToRad(precession)
      );
      return tiltQuaternion.multiply(precessionQuaternion);
    }, [axialTilt, precession]);

    if (!texturesLoaded || !uniforms || !textures) {
      return null;
    }

    return (
      <group quaternion={combinedQuaternion}>
        <mesh ref={ref} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            fragmentShader={earthFragmentShader}
            vertexShader={earthVertexShader}
            uniforms={uniforms}
            transparent={true}
          />
        </mesh>

        <mesh ref={cloudRef} scale={1.01}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhongMaterial
            map={textures.cloudMap}
            transparent={true}
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh scale={1.015}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#a8d0e6"
            transparent={true}
            opacity={iceFactor * 0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Atmosphere glow shell */}
        <mesh scale={1.06}>
          <sphereGeometry args={[1, 48, 48]} />
          <shaderMaterial
            transparent={true}
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            vertexShader={atmosphereVertexShader}
            fragmentShader={atmosphereFragmentShader}
            uniforms={atmosphereUniforms}
          />
        </mesh>

        {showAxis ? <AxisIndicators spotlight={spotlight} /> : null}
      </group>
    );
  }
);

Earth.displayName = "Earth";
