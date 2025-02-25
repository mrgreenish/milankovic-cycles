"use client";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import "./globals.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { GlobalTemperatureGraph } from '@/components/GlobalTemperatureGraph';
import IntroOverlay from '@/components/IntroOverlay';
import { 
  calculateGlobalTemperature, 
  normalizeTemperature, 
  smoothTemperature 
} from '@/lib/temperatureUtils';

//
// CREATE A INTRO PAGE WITH INTRODUCTION AND A BUTTON TO GO TO THE SIMULATION

/*
  This simulation illustrates key ideas behind Milankovitch cycles:
  - Eccentricity, axial tilt, and precession all affect the amount and timing of sunlight (insolation) that Earth receives.
  - The model uses simplified approximations to modulate a baseline temperature.
  - Temperature feedbacks (like ice–albedo) are introduced via a logistic function.
  - Seasonal variations are added as a sine wave.
  
  Note: The formulas here are simplified for clarity and educational purposes.
*/

// ------------------------------------------------------------------
// COMPONENT: Dynamic Axis Indicators
// ------------------------------------------------------------------
function AxisIndicators({ axialTilt, precession }) {
  const arrowRef = useRef();

  return (
    <group>
      <primitive
        object={
          new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            5,
            0xffffff,
            0.8,
            0.5
          )
        }
        ref={arrowRef}
      />
      <Html position={[0, 5.2, 0]} center>
        <div
          style={{
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "'Courier New', Courier, monospace",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          Rotation Axis
        </div>
      </Html>
    </group>
  );
}

// ------------------------------------------------------------------
// SHADERS
// ------------------------------------------------------------------
const vertexShader = `
  uniform vec3 sunDirection;
  uniform float displacementScale;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vec3 displacedPosition = position + normal * (sin(10.0 * uv.x) * cos(10.0 * uv.y) * displacementScale);
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D normalMap;
  uniform sampler2D specularMap;
  uniform vec3 sunDirection;
  
  uniform vec3 ambientLightColor;
  uniform vec3 directionalLightColor;
  uniform vec3 directionalLightDirection;
  uniform float temperature;
  uniform float precession; // Used to dynamically adjust lighting
  uniform float iceFactor;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    vec3 normal = normalize(vNormal);
    
    float sunInfluence = dot(normal, normalize(sunDirection));
    float mixValue = smoothstep(-0.2, 0.2, sunInfluence);
    
    vec4 color = mix(nightColor, dayColor, mixValue);
    
    // Atmospheric scattering effect (simplified)
    vec3 atmosphereColor = vec3(0.6, 0.8, 1.0);
    float atmosphere = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
    color.rgb += atmosphereColor * atmosphere * max(0.0, sunInfluence) * 0.3;
    
    float nightGlow = pow(max(0.0, -sunInfluence), 2.0) * 0.3;
    color.rgb += nightColor.rgb * nightGlow;
    
    // Basic diffuse lighting calculation
    vec3 lightDir = normalize(directionalLightDirection);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 lighting = ambientLightColor + directionalLightColor * diff;
    color.rgb *= lighting;
    
    vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    color.rgb = mix(gray, color.rgb, iceFactor);
    gl_FragColor = color;
  }
`;

// New Sun shaders with noise, displacement, and brightness mapping

// Vertex shader – displaces vertices using a simplex noise function.

//////////////////////
// VERTEX SHADER
//////////////////////
const sunVertexShader = `
uniform float time;
uniform float displacementStrength;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewPos;

// Simplex noise (Ashima)
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g, l.zxy);
  vec3 i2 = max(g, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod289(i);
  vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z);
  vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy;
  vec4 y = y_*ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 g0 = vec3(a0.xy,h.x);
  vec3 g1 = vec3(a0.zw,h.y);
  vec3 g2 = vec3(a1.xy,h.z);
  vec3 g3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g0,g0), dot(g1,g1), 
                                 dot(g2,g2), dot(g3,g3)));
  g0 *= norm.x;
  g1 *= norm.y;
  g2 *= norm.z;
  g3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1),
                          dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(g0,x0), dot(g1,x1),
                                dot(g2,x2), dot(g3,x3) ) );
}

void main() {
  vUv = uv;
  vWorldNormal = normalize(normalMatrix * normal);

  // Displace vertices by noise for a wavy surface
  float noiseVal = snoise(position * 3.0 + time * 0.2);
  vec3 displaced = position + normal * noiseVal * displacementStrength;

  // Calculate camera-space position for limb darkening
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPos = -mvPosition.xyz; // camera-space view vector

  gl_Position = projectionMatrix * mvPosition;
}
`;

//////////////////////
// FRAGMENT SHADER
//////////////////////

const sunFragmentShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewPos;

// Reuse the same simplex noise & fBm as before
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}
vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}
float snoise(vec3 v) {
  // ... same as in vertex
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g, l.zxy);
  vec3 i2 = max(g, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0*C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0*C.xxx;
  i = mod289(i);
  vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0*floor(p*ns.z*ns.z);
  vec4 x_ = floor(j*ns.z);
  vec4 y_ = floor(j - 7.0*x_);
  vec4 x = x_*ns.x + ns.yyyy;
  vec4 y = y_*ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 g0 = vec3(a0.xy,h.x);
  vec3 g1 = vec3(a0.zw,h.y);
  vec3 g2 = vec3(a1.xy,h.z);
  vec3 g3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g0,g0), dot(g1,g1), 
                                 dot(g2,g2), dot(g3,g3)));
  g0 *= norm.x;
  g1 *= norm.y;
  g2 *= norm.z;
  g3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1),
                          dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(g0,x0), dot(g1,x1),
                                dot(g2,x2), dot(g3,x3) ) );
}

float fbm(vec3 pos) {
  float total = 0.0;
  float amp   = 0.5;
  float freq  = 1.0;
  for (int i = 0; i < 5; i++) {
    total += amp * snoise(pos * freq);
    freq  *= 2.0;
    amp   *= 0.5;
  }
  return total;
}

// Domain-warping helper for swirling
vec2 swirlUV(vec2 uv, float angle, vec2 center) {
  vec2 offset = uv - center;
  float r = length(offset);
  float phi = atan(offset.y, offset.x) + angle * (1.0 - r);
  return center + vec2(cos(phi), sin(phi)) * r;
}

void main() {
  // Basic radial gradient for brightness
  float dist = distance(vUv, vec2(0.5));
  // Start with more pronounced falloff
  float radial = 1.0 - smoothstep(0.2, 0.65, dist);

  // Warp the UVs to create swirling patterns
  vec2 warpedUV = swirlUV(vUv, time * 0.3, vec2(0.5));

  // Sample fBm with the warped UV
  float noiseVal = fbm(vec3(warpedUV * 10.0, time * 0.2));

  // Combine radial + noise for base brightness
  float brightness = radial + noiseVal * 0.2;

  // Mild limb darkening based on the angle between view direction and normal
  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(vViewPos);
  float NdotV = dot(N, V); 
  // Shift the exponent or multiplier to taste
  float limb = pow(clamp(1.0 - NdotV, 0.0, 1.0), 0.6);

  // Combine everything:
  // - Baseline color from orange to yellow
  // - Subtle dimming from limbDarkening
  // - Optionally clamp brightness to avoid saturating whites
  vec3 baseColor = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), brightness);
  baseColor *= (1.0 - 0.4 * limb);

  // Slightly darken random "sunspot" patches
  // if noiseVal < some threshold, we blend in a darker brown
  if (noiseVal < 0.0) {
    baseColor = mix(baseColor, vec3(0.3, 0.2, 0.05), 0.4);
  }

  // Final output
  gl_FragColor = vec4(baseColor, 1.0);
}
`;

// ------------------------------------------------------------------
// COMPONENT: Earth (with axis indicator overlay and clouds)
// ------------------------------------------------------------------
const Earth = React.forwardRef(
  ({ axialTilt, precession, temperature, iceFactor, onReady }, ref) => {
    const [texturesLoaded, setTexturesLoaded] = useState(false);
    const [textures, setTextures] = useState(null);

    // Load textures asynchronously.
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

    // Pass uniforms to the shader.
    const uniforms = React.useMemo(() => {
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
        temperature: { value: temperature },
        precession: { value: precession },
        displacementScale: { value: 0.01 },
        iceFactor: { value: iceFactor },
      };
    }, [texturesLoaded, textures, temperature, precession, iceFactor]);

    // Update sun direction relative to the Earth's current world position.
    useFrame(({ clock }) => {
      if (uniforms?.sunDirection?.value && ref.current?.parent) {
        const worldPosition = new THREE.Vector3();
        ref.current.parent.getWorldPosition(worldPosition);
        uniforms.sunDirection.value
          .copy(worldPosition)
          .normalize()
          .multiplyScalar(-1);
      }
    });

    // Rotate the cloud layer slowly.
    const cloudRef = useRef();
    useFrame(() => {
      if (cloudRef.current) {
        cloudRef.current.rotation.y += 0.005;
      }
    });

    if (!texturesLoaded || !uniforms || !textures) {
      return null;
    }

    // Create a quaternion for the axial tilt
    const tiltQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(axialTilt)
    );

    // Create a quaternion for the precession
    const precessionQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(precession)
    );

    // Combine the rotations - tilt first, then precession
    const combinedQuaternion = tiltQuaternion.multiply(precessionQuaternion);

    return (
      <group quaternion={combinedQuaternion}>
        {/* Earth surface */}
        <mesh ref={ref} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
            uniforms={uniforms}
            transparent={true}
          />
        </mesh>

        {/* Cloud layer */}
        <mesh ref={cloudRef} scale={1.01}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhongMaterial
            map={textures.cloudMap}
            transparent={true}
            opacity={0.4}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Ice overlay (grows with the ice factor) */}
        <mesh scale={1.03}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial
            color="#a8d0e6"
            transparent={true}
            opacity={iceFactor * 0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Axis indicator */}
        <AxisIndicators axialTilt={axialTilt} precession={precession} />
      </group>
    );
  }
);

// ------------------------------------------------------------------
// COMPONENT: OrbitPath with seasonal markers
// ------------------------------------------------------------------
function OrbitPath({ eccentricity }) {
  const a = 20;
  const b = a * (1 - 2 * eccentricity);
  const baselineB = a * (1 - 2 * 0.0167); // Baseline orbit for reference

  const points = [];
  const baselinePoints = [];
  const seasonalMarkers = [];

  // Generate orbit points and seasonal markers (every 90°)
  for (let theta = 0; theta <= Math.PI * 2; theta += 0.02) {
    const x = a * Math.cos(theta);
    const currentZ = b * Math.sin(theta);
    const baselineZ = baselineB * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, currentZ));
    baselinePoints.push(new THREE.Vector3(x, 0, baselineZ));

    if (
      Math.abs(theta - Math.PI / 2) < 0.02 ||
      Math.abs(theta - Math.PI) < 0.02 ||
      Math.abs(theta - (3 * Math.PI) / 2) < 0.02 ||
      Math.abs(theta) < 0.02
    ) {
      seasonalMarkers.push(new THREE.Vector3(x, 0, currentZ));
    }
  }

  return (
    <group>
      {/* Baseline orbit with subtle visibility */}
      <Line 
        points={baselinePoints} 
        color="#2a4858" 
        lineWidth={1}
        transparent={false}
        opacity={1}
      />
      <Line 
        points={baselinePoints} 
        color="#2a4858" 
        lineWidth={2}
        transparent
        opacity={0.5}
      />
      <Line 
        points={baselinePoints} 
        color="#2a4858" 
        lineWidth={3}
        transparent
        opacity={0.2}
      />

      {/* Current orbit with enhanced visibility */}
      <Line 
        points={points} 
        color="#8b5cf6" 
        lineWidth={2}
        transparent={false}
        opacity={1}
      />
      <Line 
        points={points} 
        color="#8b5cf6" 
        lineWidth={4}
        transparent
        opacity={0.7}
      />
      <Line 
        points={points} 
        color="#8b5cf6" 
        lineWidth={6}
        transparent
        opacity={0.4}
      />

      {/* Seasonal markers with enhanced visibility */}
      {seasonalMarkers.map((position, index) => (
        <group key={index} position={position}>
          {/* Core sphere with solid visibility */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial 
              color={index % 2 === 0 ? "#8b5cf6" : "#ec4899"}
              transparent={false}
              opacity={1}
            />
          </mesh>
          {/* Inner glow */}
          <mesh scale={1.2}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial 
              color={index % 2 === 0 ? "#8b5cf6" : "#ec4899"}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Outer glow */}
          <mesh scale={1.4}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial 
              color={index % 2 === 0 ? "#8b5cf6" : "#ec4899"}
              transparent
              opacity={0.3}
            />
          </mesh>
          <Html position={[0, 1, 0]} center>
            <div
              style={{
                color: "white",
                backgroundColor: "rgba(139, 92, 246, 0.6)",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(139, 92, 246, 0.8)",
                textShadow: "0 0 10px rgba(139, 92, 246, 1)",
                boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)",
              }}
            >
              {index === 0
                ? "Perihelion"
                : index === 1
                ? "Spring Equinox"
                : index === 2
                ? "Aphelion"
                : "Autumn Equinox"}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: OrbitingEarth with position marker
// ------------------------------------------------------------------
function OrbitingEarth({
  eccentricity,
  axialTilt,
  precession,
  temperature,
  iceFactor,
  normTemp,
}) {
  const a = 20;
  const b = a * (1 - 2 * eccentricity);
  const groupRef = useRef();
  const earthRef = useRef();
  const markerRef = useRef();
  const [isReady, setIsReady] = useState(false);

  // Animate Earth's position along its orbit.
  useFrame(({ clock }) => {
    if (!groupRef.current || !isReady) return;
    const theta = clock.getElapsedTime() * 0.1;
    const x = a * Math.cos(theta);
    const z = b * Math.sin(theta);
    groupRef.current.position.set(x, 0, z);
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.01;
    }
    if (markerRef.current) {
      markerRef.current.position.set(x, 0, z);
      // Change marker color based on distance (conceptual)
      const distance = Math.sqrt(x * x + z * z);
      const markerColor =
        distance < a ? new THREE.Color(1, 0, 0) : new THREE.Color(0, 0, 1);
      markerRef.current.material.color = markerColor;
    }
  });

  const onEarthReady = useCallback(() => setIsReady(true), []);

  return (
    <group ref={groupRef}>
      <Earth
        ref={earthRef}
        axialTilt={axialTilt}
        precession={precession}
        temperature={temperature}
        iceFactor={iceFactor}
        onReady={onEarthReady}
      />
      {/* Marker sphere for Earth's current position */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: NarrativeOverlay
// Provides clear, plain-language explanations for noobs.
// ------------------------------------------------------------------
function NarrativeOverlay({
  simulatedYear,
  temperature,
  iceFactor,
  eccentricity,
  axialTilt,
  precession,
  formatNumber,
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const eccentricityMessage =
    eccentricity > 0.0167
      ? "High eccentricity: The orbit is more elliptical, which can cause stronger seasonal contrasts."
      : "Low eccentricity: The orbit is nearly circular, leading to more consistent seasonal differences.";

  const axialTiltMessage =
    axialTilt > 23.5
      ? "High axial tilt: Steeper tilt means hotter summers and colder winters."
      : axialTilt < 23.5
      ? "Low axial tilt: A shallower tilt produces milder seasonal differences."
      : "Normal axial tilt: Standard seasonal patterns are observed.";

  const precessionMessage = `Precession at ${precession.toFixed(
    0
  )}°: This shifts the timing of seasons relative to Earth's orbit.`;

  const temperatureMessage =
    temperature < 5
      ? "Cooling trend: Reduced summer insolation may trigger more ice formation."
      : temperature > 15
      ? "Warming trend: Increased summer insolation leads to warmer conditions."
      : "Stable climate: A balance between sunlight and feedbacks is maintained.";

  const causeEffectExplanation =
    "Cause and Effect: Variations in eccentricity, axial tilt, and precession alter the amount and timing of sunlight (insolation), driving seasonal temperature differences. Feedbacks, such as ice formation, can amplify these changes.";

  // Format the year for display: use "BP" (Before Present) for historical years, 
  // and "AP" (After Present) or just the year for future
  const formattedYear = () => {
    const year = Math.floor(simulatedYear);
    if (year < 0) {
      // Historical year (negative) - show as "X BP" (Before Present)
      return `${formatNumber(Math.abs(year))} BP`;
    } else if (year > 0) {
      // Future year - show as year with optional "AP" for clarity with larger timeframes
      return year > 1000 ? `${formatNumber(year)} AP` : `${formatNumber(year)}`;
    } else {
      // Current year (0)
      return "Present Day";
    }
  };

  return (
    <Card 
      className="card backdrop-blur-xl bg-black/20 border-white/10 overflow-hidden relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur" />
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-gradient text-glow flex items-baseline gap-3">
          <span className="text-xl font-semibold">Current Cycle States</span>
          <span className="text-sm font-medium text-white/60 tracking-wide inline-block min-w-[150px] text-right">
            ({formattedYear()})
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        <div className="space-y-4">
          <div className="flex items-start space-x-3 transition-all duration-300 hover:translate-x-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 animate-pulse" />
            <p className="text-white/90 leading-relaxed tracking-wide text-balance">
              {eccentricityMessage}
            </p>
          </div>
          
          <div className="flex items-start space-x-3 transition-all duration-300 hover:translate-x-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 mt-2 animate-pulse" />
            <p className="text-white/90 leading-relaxed tracking-wide text-balance">
              {axialTiltMessage}
            </p>
          </div>
          
          <div className="flex items-start space-x-3 transition-all duration-300 hover:translate-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 animate-pulse" />
            <p className="text-white/90 leading-relaxed tracking-wide text-balance">
              {precessionMessage}
            </p>
          </div>
          
          <div className="flex items-start space-x-3 transition-all duration-300 hover:translate-x-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2 animate-pulse" />
            <p className={cn(
              "leading-relaxed tracking-wide text-balance transition-colors duration-500",
              temperature < 5 ? "text-blue-400" : temperature > 15 ? "text-red-400" : "text-white/90"
            )}>
              {temperatureMessage}
            </p>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-white/70 text-sm italic leading-relaxed tracking-wide font-light text-balance">
            {causeEffectExplanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// COMPONENT: CycleComparisonPanel
// ------------------------------------------------------------------
function CycleComparisonPanel({
  eccentricity,
  axialTilt,
  precession,
  baselineEccentricity,
  baselineAxialTilt,
  baselinePrecession,
  onEccentricityChange,
  onAxialTiltChange,
  onPrecessionChange,
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Card 
      className="card backdrop-blur-xl bg-black/20 border-white/10 overflow-hidden relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur" />
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-gradient text-glow">Milanković Cycles</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-8 relative z-10">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-sm text-white/80 font-medium">Eccentricity</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl text-white font-bold tracking-tight">{eccentricity.toFixed(4)}</span>
                  <span className="text-xs text-white/60">baseline: {baselineEccentricity}</span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
            </div>
            <Slider
              defaultValue={[eccentricity]}
              value={[eccentricity]}
              min={0.001}
              max={0.2}
              step={0.001}
              onValueChange={([value]) => onEccentricityChange(value)}
              className="[&>span]:bg-gradient-to-r [&>span]:from-purple-500 [&>span]:to-pink-500 [&>span]:shadow-lg [&>span]:shadow-purple-500/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-sm text-white/80 font-medium">Axial Tilt</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl text-white font-bold tracking-tight">{axialTilt.toFixed(1)}°</span>
                  <span className="text-xs text-white/60">baseline: {baselineAxialTilt}°</span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse" />
            </div>
            <Slider
              defaultValue={[axialTilt]}
              value={[axialTilt]}
              min={10}
              max={45}
              step={0.1}
              onValueChange={([value]) => onAxialTiltChange(value)}
              className="[&>span]:bg-gradient-to-r [&>span]:from-blue-500 [&>span]:to-cyan-500 [&>span]:shadow-lg [&>span]:shadow-blue-500/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-sm text-white/80 font-medium">Precession</span>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl text-white font-bold tracking-tight">{precession.toFixed(0)}°</span>
                  <span className="text-xs text-white/60">baseline: {baselinePrecession}°</span>
                </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
            </div>
            <Slider
              defaultValue={[precession]}
              value={[precession]}
              min={0}
              max={360}
              step={1}
              onValueChange={([value]) => onPrecessionChange(value)}
              className="[&>span]:bg-gradient-to-r [&>span]:from-emerald-500 [&>span]:to-teal-500 [&>span]:shadow-lg [&>span]:shadow-emerald-500/50"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// COMPONENT: SeasonalInsolationGraph
// ------------------------------------------------------------------
function SeasonalInsolationGraph({
  axialTilt,
  eccentricity,
  precession,
  style,
}) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with a semi-transparent dark background
    ctx.fillStyle = "rgba(3, 0, 20, 0.3)";
    ctx.fillRect(0, 0, width, height);

    // Graph margins and dimensions
    const margin = { top: 30, right: 60, bottom: 40, left: 60 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Parameters for insolation calculation
    const latitudes = Array.from({ length: 37 }, (_, i) => -90 + i * 5); // -90 to 90° in 5° steps
    const seasons = Array.from({ length: 48 }, (_, i) => i * 7.5); // 0° to 360° in 7.5° steps
    const solarConstant = 1361; // W/m²

    // Calculate insolation with improved physics
    const insolationData = [];
    let maxInsolation = 0;
    let minInsolation = Infinity;

    latitudes.forEach((lat) => {
      const latRad = THREE.MathUtils.degToRad(lat);
      const row = [];

      seasons.forEach((season) => {
        const seasonRad = THREE.MathUtils.degToRad(season);
        const tiltRad = THREE.MathUtils.degToRad(axialTilt);

        // Solar declination calculation
        const solarDeclination = Math.asin(Math.sin(tiltRad) * Math.sin(seasonRad));
        
        // Day length calculation
        const cosHourAngle = -Math.tan(latRad) * Math.tan(solarDeclination);
        const hourAngle = Math.abs(cosHourAngle) <= 1 ? Math.acos(cosHourAngle) : Math.PI;

        // Distance variation due to orbital eccentricity
        const meanOrbitalDistance = 1 - eccentricity * eccentricity / 2;
        const trueAnomaly = seasonRad + THREE.MathUtils.degToRad(precession);
        const distanceFactor = (1 - eccentricity * Math.cos(trueAnomaly)) / meanOrbitalDistance;

        // Daily insolation calculation (W/m²)
        let insolation = (solarConstant / (Math.PI * distanceFactor * distanceFactor)) * 
          (hourAngle * Math.sin(latRad) * Math.sin(solarDeclination) + 
           Math.cos(latRad) * Math.cos(solarDeclination) * Math.sin(hourAngle));

        // Account for permanent ice coverage near poles
        if (Math.abs(lat) > 75) {
          insolation *= 0.6; // Higher albedo in polar regions
        }

        insolation = Math.max(0, insolation);
        maxInsolation = Math.max(maxInsolation, insolation);
        minInsolation = Math.min(minInsolation, insolation);
        row.push(insolation);
      });
      insolationData.push(row);
    });

    // Draw the enhanced heatmap
    const cellWidth = graphWidth / seasons.length;
    const cellHeight = graphHeight / latitudes.length;

    // Create gradient for more intuitive visualization
    insolationData.forEach((row, latIndex) => {
      row.forEach((value, seasonIndex) => {
        const x = margin.left + seasonIndex * cellWidth;
        const y = margin.top + latIndex * cellHeight;

        // Normalize value between 0 and 1
        const normalizedValue = (value - minInsolation) / (maxInsolation - minInsolation);

        // Enhanced color gradient using HSL
        const h = 240 - normalizedValue * 240; // Blue (cold) to Red (hot)
        const s = 80 + normalizedValue * 20; // Increased saturation for higher values
        const l = 20 + normalizedValue * 50; // Brighter for higher values
        ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
      });
    });

    // Add month labels
    const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    months.forEach((month, i) => {
      const x = margin.left + (i * graphWidth / 12) + (graphWidth / 24);
      ctx.fillText(month, x, height - 10);
    });

    // Add latitude labels
    ctx.textAlign = "right";
    [-90, -60, -30, 0, 30, 60, 90].forEach(lat => {
      const y = margin.top + ((lat + 90) * graphHeight / 180);
      ctx.fillText(`${lat}°`, margin.left - 10, y + 4);
    });

    // Add title and legend
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    ctx.font = "14px Inter";
    ctx.fillText("Daily Solar Insolation (W/m²)", width / 2, 20);

    // Add color scale
    const legendWidth = 20;
    const legendHeight = graphHeight;
    const legendX = width - margin.right + 20;
    const legendY = margin.top;

    // Draw color scale
    for (let i = 0; i < legendHeight; i++) {
      const normalizedValue = 1 - (i / legendHeight);
      const h = 240 - normalizedValue * 240;
      const s = 80 + normalizedValue * 20;
      const l = 20 + normalizedValue * 50;
      ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      ctx.fillRect(legendX, legendY + i, legendWidth, 1);
    }

    // Add scale values
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "left";
    ctx.font = "12px Inter";
    [maxInsolation, (maxInsolation + minInsolation) / 2, minInsolation].forEach((value, i) => {
      const y = legendY + (i * legendHeight / 2);
      ctx.fillText(`${Math.round(value)}`, legendX + legendWidth + 5, y + 4);
    });

  }, [axialTilt, eccentricity, precession]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={300}
      style={{
        ...style,
        width: "600px",
        height: "300px",
      }}
    />
  );
}

// ------------------------------------------------------------------
// COMPONENT: Home – main simulation component
// ------------------------------------------------------------------
export default function Home() {
  // Baseline orbital parameters - updated with precise historical means
  const baselineEccentricity = 0.0167; // Current Earth value
  const baselineAxialTilt = 23.44; // Current Earth obliquity
  const baselinePrecession = 0;
  const realisticAmsterdamTemp = 10; // °C baseline temperature
  const sensitivity = 60; // Temperature sensitivity factor - INCREASED FROM 30 to make changes more noticeable
  
  // State for orbital parameters.
  const [eccentricity, setEccentricity] = useState(baselineEccentricity);
  const [axialTilt, setAxialTilt] = useState(baselineAxialTilt);
  const [precession, setPrecession] = useState(baselinePrecession);
  const [autoAnimate, setAutoAnimate] = useState(true);
  const [exaggeration, setExaggeration] = useState(0.5);

  // Global temperature offset.
  const [tempOffset, setTempOffset] = useState(0);
  // Simulated year state.
  const [simulatedYear, setSimulatedYear] = useState(0);

  // Time control states.
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(0.01);

  // Ice factor state
  const [iceFactor, setIceFactor] = useState(0);

  // Hover states for cards
  const [timeControlsHovered, setTimeControlsHovered] = useState(false);
  const [scenariosHovered, setScenariosHovered] = useState(false);

  // Preset scenarios with historically accurate configurations
  const presets = {
    "Last Glacial Maximum (21,000 BP)": {
      eccentricity: 0.019,
      axialTilt: 22.99,
      precession: 114,
      description: "Peak of last ice age with extensive ice sheets. Northern Hemisphere summers occurred near aphelion, minimizing summer insolation.",
      year: -21000
    },
    "Mid-Holocene Optimum (6,000 BP)": {
      eccentricity: 0.0187,
      axialTilt: 24.1,
      precession: 303,
      description: "Warm period with enhanced seasonal contrasts. Northern Hemisphere summers near perihelion maximized summer insolation.",
      year: -6000
    },
    "Mid-Pleistocene Transition (800,000 BP)": {
      eccentricity: 0.043,
      axialTilt: 22.3,
      precession: 275,
      description: "Transition period when glacial cycles shifted from 41,000-year to 100,000-year periods.",
      year: -800000
    },
    "PETM (56 Million BP)": {
      eccentricity: 0.052,
      axialTilt: 23.8,
      precession: 180,
      description: "Paleocene-Eocene Thermal Maximum - extreme global warming event with high CO2 levels.",
      year: -56000000
    },
    "Future Configuration (50,000 AP)": {
      eccentricity: 0.015,
      axialTilt: 23.2,
      precession: 90,
      description: "Projected orbital configuration showing reduced seasonal contrasts.",
      year: 50000
    }
  };
  const [preset, setPreset] = useState("");

  // Additional greenhouse gas slider.
  const [co2Level, setCo2Level] = useState(280);
  const [showIntro, setShowIntro] = useState(true);
  const [hasIntroFadedOut, setHasIntroFadedOut] = useState(false);

  // Smooth the displayed temperature.
  const [displayedTemp, setDisplayedTemp] = useState(realisticAmsterdamTemp);
  const [parameterPreview, setParameterPreview] = useState(null);
  const [calculatedTemp, setCalculatedTemp] = useState(realisticAmsterdamTemp);

  // Calculate the final temperature
  useEffect(() => {
    // Safety check for extreme simulatedYear values
    if (!isFinite(simulatedYear) || Math.abs(simulatedYear) > 1e21) {
      setSimulatedYear(0);
      return;
    }
    
    // Calculate the season based on the simulated year (normalized to 0-1)
    const season = (simulatedYear % 1 + 1) % 1;
    
    // Calculate global temperature using our utility
    const tempData = calculateGlobalTemperature({
      latitude: 52.37, // Amsterdam latitude
      season,
      eccentricity,
      axialTilt,
      precession,
      co2Level,
      tempOffset
    });
    
    // Update temperature and ice factor states
    setCalculatedTemp(tempData.temperature);
    setIceFactor(tempData.iceFactor);
  }, [simulatedYear, eccentricity, axialTilt, precession, co2Level, tempOffset]);

  // Modify the smoothing effect to be faster and add preview
  useEffect(() => {
    const smoothingFactor = 0.5; // Increased from 0.25 for faster response
    const interval = setInterval(() => {
      setDisplayedTemp((prev) => {
        // If we have a parameter preview, blend it with the orbital temperature
        if (parameterPreview) {
          const previewWeight = 0.9; // Increased from 0.7 for more immediate feedback
          const targetTemp = calculatedTemp * (1 - previewWeight) + parameterPreview * previewWeight;
          return smoothTemperature(prev, targetTemp, smoothingFactor);
        }
        return smoothTemperature(prev, calculatedTemp, smoothingFactor);
      });
    }, 30); // Reduced from 50ms for more frequent updates
    return () => clearInterval(interval);
  }, [calculatedTemp, parameterPreview]);

  // Clear parameter preview after a delay
  useEffect(() => {
    if (parameterPreview !== null) {
      const timeout = setTimeout(() => {
        setParameterPreview(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [parameterPreview]);

  // Format number with k/m/b suffix and 3 significant digits
  const formatNumber = (num) => {
    // Handle extreme values that might result from JavaScript numeric errors
    if (!isFinite(num) || Math.abs(num) > 1e21) {
      return "0 years"; // Reset extreme values
    }
    
    // Handle negative years
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    
    // Function to format a number to exactly 3 significant digits
    const formatTo3Digits = (n) => {
      if (n < 10) {
        // e.g., 7.83
        return n.toPrecision(3);
      } else if (n < 100) {
        // e.g., 78.3
        return n.toPrecision(3);
      } else {
        // e.g., 783
        return Math.round(n);
      }
    };

    // Special case for very small numbers (like timeScale)
    if (absNum < 1 && absNum > 0) {
      if (absNum < 0.001) {
        return "< 0.001";
      }
      return absNum.toPrecision(3);
    }

    let result;
    if (absNum >= 1000000000) {
      const billions = absNum / 1000000000;
      result = `${formatTo3Digits(billions)} billion years`;
    } else if (absNum >= 1000000) {
      const millions = absNum / 1000000;
      result = `${formatTo3Digits(millions)} million years`;
    } else if (absNum >= 1000) {
      const thousands = absNum / 1000;
      // For historical years (negative), use "thousand years BP" format
      if (isNegative) {
        result = `${formatTo3Digits(thousands)} thousand years BP`;
      } else {
        result = `${formatTo3Digits(thousands)}k years`;
      }
    } else {
      if (isNegative) {
        result = `${Math.min(999, Math.round(absNum))} years BP`;
      } else {
        result = `${Math.min(999, Math.round(absNum))} years`;
      }
    }
    
    return isNegative ? result : result;
  };

  // Main simulation loop with adjusted time scales
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();
    const animate = (time) => {
      if (!isPaused) {
        const delta = time - lastTime;
        lastTime = time;
        
        // Adjusted time scaling to show orbital cycles
        const yearScale = timeScale * 2000; // Increased from 1000 to 2000 kiloyears for faster changes
        setSimulatedYear((prev) => {
          const newYear = prev + delta * yearScale;
          
          // Safety checks to prevent numeric overflow/underflow
          if (!isFinite(newYear) || Math.abs(newYear) > 1e21) {
            return 0; // Reset if we reach extreme values
          }
          
          return newYear;
        });
        
        if (autoAnimate) {
          const elapsed = time;
          // Eccentricity cycle (100,000 years)
          const eccCycle = Math.sin(elapsed * 0.00001) * 0.5 + Math.sin(elapsed * 0.0000025) * 0.5;
          const exaggeratedEcc = 0.0167 + 0.041 * eccCycle;
          
          // Obliquity cycle (41,000 years)
          const tiltCycle = Math.sin(elapsed * 0.000024);
          const exaggeratedTilt = baselineAxialTilt + 1.2 * tiltCycle;
          
          // Precession cycle (23,000 years average)
          const exaggeratedPrec = (elapsed * 0.000043) % 360;
          
          const orbitalMultiplier = 1 + tempOffset / 20;
          const newEccentricity = baselineEccentricity + exaggeration * (exaggeratedEcc - baselineEccentricity) * orbitalMultiplier;
          const newAxialTilt = baselineAxialTilt + exaggeration * (exaggeratedTilt - baselineAxialTilt) * orbitalMultiplier;
          const newPrecession = (baselinePrecession + exaggeration * (exaggeratedPrec - baselinePrecession) * orbitalMultiplier) % 360;
          
          // Updated ranges based on actual Earth variations
          setEccentricity(Math.max(0.0034, Math.min(0.058, newEccentricity)));
          setAxialTilt(Math.max(22.1, Math.min(24.5, newAxialTilt)));
          setPrecession(newPrecession);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused, timeScale, autoAnimate, exaggeration, baselineAxialTilt, baselineEccentricity, baselinePrecession, tempOffset]);

  // Apply a preset scenario if selected.
  useEffect(() => {
    if (preset && presets[preset]) {
      const { eccentricity, axialTilt, precession, year } = presets[preset];
      setEccentricity(eccentricity);
      setAxialTilt(axialTilt);
      setPrecession(precession);
      if (year !== undefined) {
        setSimulatedYear(year);
      }
      setAutoAnimate(false);
    }
  }, [preset]);

  // Normalize temperature value for shader tinting (0 to 1).
  const normTemp = normalizeTemperature(calculatedTemp, 0, 15);

  // Handlers for manual parameter adjustments.
  const handleManualChange = (setter) => (e) => {
    setAutoAnimate(false);
    setter(parseFloat(e.target.value));
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    // Add a small delay to ensure the intro has fully faded out
    setTimeout(() => {
      setHasIntroFadedOut(true);
    }, 1000);
  };

  // Update the CycleComparisonPanel props to include immediate feedback
  <CycleComparisonPanel
    eccentricity={eccentricity}
    axialTilt={axialTilt}
    precession={precession}
    baselineEccentricity={baselineEccentricity}
    baselineAxialTilt={baselineAxialTilt}
    baselinePrecession={baselinePrecession}
    onEccentricityChange={(value) => {
      setEccentricity(value);
      setAutoAnimate(false);
      // Immediate feedback based on eccentricity change
      const deltaEcc = value - baselineEccentricity;
      setParameterPreview(realisticAmsterdamTemp + deltaEcc * 100); // Scale factor for visible effect
    }}
    onAxialTiltChange={(value) => {
      setAxialTilt(value);
      setAutoAnimate(false);
      // Immediate feedback based on tilt change
      const deltaTilt = value - baselineAxialTilt;
      setParameterPreview(realisticAmsterdamTemp + deltaTilt * 2); // Scale factor for visible effect
    }}
    onPrecessionChange={(value) => {
      setPrecession(value);
      setAutoAnimate(false);
      // Immediate feedback based on precession change
      const deltaPrecession = Math.sin(THREE.MathUtils.degToRad(value - baselinePrecession));
      setParameterPreview(realisticAmsterdamTemp + deltaPrecession * 5); // Scale factor for visible effect
    }}
  />

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#030014]">
      {showIntro && <IntroOverlay onStart={handleIntroComplete} />}
      
      {hasIntroFadedOut && (
        <>
          <div className="canvas-container relative">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-[#100b2e] to-[#0c0521] opacity-90" />
            
            {/* Dynamic aurora effects */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -inset-[10%] opacity-50">
                <div className="absolute top-1/4 left-1/4 w-[50rem] h-[50rem] bg-purple-600/30 rounded-full blur-[10rem] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[55rem] h-[55rem] bg-blue-600/30 rounded-full blur-[10rem] animate-pulse delay-1000" />
                <div className="absolute top-1/2 right-1/3 w-[45rem] h-[45rem] bg-cyan-600/20 rounded-full blur-[10rem] animate-pulse delay-500" />
              </div>
            </div>
            
            {/* Animated grid overlay */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px] z-[1]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-transparent to-transparent" />
            </div>
            
            {/* Particle system */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.3,
                    animation: `float ${Math.random() * 4 + 3}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            <Canvas
              shadows
              camera={{
                position: [0, 15, 25],
                fov: 50,
                near: 0.1,
                far: 1000,
              }}
              className="z-10"
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                stencil: false,
                depth: true,
              }}
            >
              <color attach="background" args={["#030014"]} />
              <fog attach="fog" args={["#030014", 30, 150]} />
              <ambientLight intensity={0.4} />
              <directionalLight
                castShadow
                position={[10, 20, 10]}
                intensity={2.0}
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
              />
              <hemisphereLight
                intensity={0.3}
                color="#ffffff"
                groundColor="#000000"
              />
              
              {/* Enhanced post-processing effects */}
              {/* <EffectComposer> */}
                {/* <Bloom
                  intensity={1.5}
                  luminanceThreshold={0.6}
                  luminanceSmoothing={0.9}
                  blurPass={undefined}
                  width={Infinity}
                  height={Infinity}
                /> */}
                {/* <ChromaticAberration
                  blendFunction={BlendFunction.NORMAL}
                  offset={[0.002, 0.002]}
                /> */}
              {/* </EffectComposer> */}

              <Sun />
              <OrbitPath eccentricity={eccentricity} />
              <OrbitingEarth
                eccentricity={eccentricity}
                axialTilt={axialTilt}
                precession={precession}
                temperature={normTemp}
                iceFactor={iceFactor}
                normTemp={normTemp}
              />
              <AxisIndicators axialTilt={axialTilt} precession={precession} />
              <OrbitControls
                autoRotate
                autoRotateSpeed={0.5}
                enableDamping
                dampingFactor={0.05}
                minDistance={30}
                maxDistance={80}
                enablePan={false}
                rotateSpeed={0.8}
              />
            </Canvas>
          </div>

          {/* Left Panel Group with enhanced positioning and animations */}
          <div className="fixed left-5 top-5 space-y-4 w-[400px] z-20 animate-fadeIn">
            <CycleComparisonPanel
              eccentricity={eccentricity}
              axialTilt={axialTilt}
              precession={precession}
              baselineEccentricity={baselineEccentricity}
              baselineAxialTilt={baselineAxialTilt}
              baselinePrecession={baselinePrecession}
              onEccentricityChange={(value) => {
                setEccentricity(value);
                setAutoAnimate(false);
                // Immediate feedback based on eccentricity change
                const deltaEcc = value - baselineEccentricity;
                setParameterPreview(realisticAmsterdamTemp + deltaEcc * 100); // Scale factor for visible effect
              }}
              onAxialTiltChange={(value) => {
                setAxialTilt(value);
                setAutoAnimate(false);
                // Immediate feedback based on tilt change
                const deltaTilt = value - baselineAxialTilt;
                setParameterPreview(realisticAmsterdamTemp + deltaTilt * 2); // Scale factor for visible effect
              }}
              onPrecessionChange={(value) => {
                setPrecession(value);
                setAutoAnimate(false);
                // Immediate feedback based on precession change
                const deltaPrecession = Math.sin(THREE.MathUtils.degToRad(value - baselinePrecession));
                setParameterPreview(realisticAmsterdamTemp + deltaPrecession * 5); // Scale factor for visible effect
              }}
            />

            <NarrativeOverlay
              simulatedYear={simulatedYear}
              temperature={displayedTemp}
              iceFactor={iceFactor}
              eccentricity={eccentricity}
              axialTilt={axialTilt}
              precession={precession}
              formatNumber={formatNumber}
            />
          </div>

          {/* Right Panel Group with enhanced positioning and animations */}
          <div className="fixed right-5 top-5 space-y-4 w-[400px] z-20 animate-fadeIn">
            {/* Time Control Panel */}
            <Card 
              className="card backdrop-blur-xl bg-black/20 border-white/10 overflow-hidden relative group"
              onMouseEnter={() => setTimeControlsHovered(true)}
              onMouseLeave={() => setTimeControlsHovered(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/50 to-pink-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-gradient text-glow">Time Controls</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6 relative z-10">
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="btn-primary w-full relative group overflow-hidden"
                >
                  <span className="relative z-10">{isPaused ? "Play" : "Pause"}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-pink-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/80 font-medium">Simulation Speed</span>
                    <span className="text-sm text-white/60 inline-block min-w-[80px] text-right">{formatNumber(timeScale)}</span>
                  </div>
                  <Slider
                    defaultValue={[timeScale]}
                    value={[timeScale]}
                    min={0.001}
                    max={1000000}
                    step={100}
                    onValueChange={([value]) => setTimeScale(value)}
                    className="[&>span]:bg-gradient-to-r [&>span]:from-purple-500 [&>span]:to-pink-500 [&>span]:shadow-lg [&>span]:shadow-purple-500/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Preset Scenarios Panel */}
            <Card 
              className="card backdrop-blur-xl bg-black/20 border-white/10 overflow-hidden relative group"
              onMouseEnter={() => setScenariosHovered(true)}
              onMouseLeave={() => setScenariosHovered(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute -inset-[1px] bg-gradient-to-r from-blue-500/50 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-gradient text-glow">Historical Scenarios</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4 relative z-10">
                {/* Scenario Selector */}
                <div className="relative">
                  <select
                    value={preset}
                    onChange={(e) => {
                      const selectedPreset = e.target.value;
                      setPreset(selectedPreset);
                      if (selectedPreset && presets[selectedPreset]) {
                        const config = presets[selectedPreset];
                        setEccentricity(config.eccentricity);
                        setAxialTilt(config.axialTilt);
                        setPrecession(config.precession);
                        setAutoAnimate(false);
                      }
                    }}
                    className="w-full bg-black/40 text-white border border-white/20 rounded-lg px-4 py-2 appearance-none hover:border-white/40 transition-colors duration-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select a scenario...</option>
                    {Object.entries(presets).map(([name]) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Scenario Description */}
                {preset && presets[preset] && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-sm text-white/70 leading-relaxed">
                      {presets[preset].description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white/60 text-xs">Eccentricity</div>
                        <div className="text-white font-medium mt-1">{presets[preset].eccentricity.toFixed(4)}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white/60 text-xs">Axial Tilt</div>
                        <div className="text-white font-medium mt-1">{presets[preset].axialTilt.toFixed(1)}°</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <div className="text-white/60 text-xs">Precession</div>
                        <div className="text-white font-medium mt-1">{presets[preset].precession.toFixed(0)}°</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Graphs with enhanced positioning and animations */}
          <div className="fixed flex justify-center items-center w-[620px] h-[200px] bottom-5 right-5 animate-fadeIn">
            <GlobalTemperatureGraph
              axialTilt={axialTilt}
              eccentricity={eccentricity}
              precession={precession}
              temperature={displayedTemp}
              iceFactor={iceFactor}
              co2Level={co2Level}
              simulatedYear={simulatedYear}
              formatNumber={formatNumber}
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </div>
          <div className="fixed bottom-0 left-0 flex justify-center items-center w-[620px] h-[190px] animate-fadeIn">
            <SeasonalInsolationGraph
              axialTilt={axialTilt}
              eccentricity={eccentricity}
              precession={precession}
              style={{
                zIndex: 10,
                width: "600px",
                height: "150px",
                padding: "15px",
                background: "rgba(3, 0, 20, 0.3)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Sun
// Enhanced with realistic solar surface effects and corona
// ------------------------------------------------------------------
function Sun() {
  const materialRef = useRef();
  const coronaRef = useRef();
  const glowRef = useRef();
  const flareRef = useRef();

  // Animate sun effects
  useFrame(({ clock, camera }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
    // Update corona and effects to always face camera
    [coronaRef, glowRef, flareRef].forEach(ref => {
      if (ref.current) {
        ref.current.quaternion.copy(camera.quaternion);
      }
    });
  });

  return (
    <group>
      {/* Enhanced core glow layer */}
      <mesh scale={2.5}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#ff6b00"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Main sun sphere with enhanced surface detail */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 256, 256]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={{
            time: { value: 0 },
            displacementStrength: { value: 0.05 },
            pulseSpeed: { value: 0.8 },
            colorIntensity: { value: 1.5 }
          }}
          vertexShader={`
            uniform float time;
            uniform float displacementStrength;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying float vDisplacement;

            // Improved noise function for more natural surface detail
            vec4 permute(vec4 x) {
              return mod(((x*34.0)+1.0)*x, 289.0);
            }

            vec4 taylorInvSqrt(vec4 r) {
              return 1.79284291400159 - 0.85373472095314 * r;
            }

            vec3 fade(vec3 t) {
              return t*t*t*(t*(t*6.0-15.0)+10.0);
            }

            float cnoise(vec3 P) {
              vec3 Pi0 = floor(P);
              vec3 Pi1 = Pi0 + vec3(1.0);
              vec3 Pf0 = fract(P);
              vec3 Pf1 = Pf0 - vec3(1.0);
              
              vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
              vec4 iy = vec4(Pi0.yy, Pi1.yy);
              vec4 iz0 = Pi0.zzzz;
              vec4 iz1 = Pi1.zzzz;

              vec4 ixy = permute(permute(ix) + iy);
              vec4 ixy0 = permute(ixy + iz0);
              vec4 ixy1 = permute(ixy + iz1);

              vec4 gx0 = ixy0 * (1.0 / 7.0);
              vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
              gx0 = fract(gx0);
              vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
              vec4 sz0 = step(gz0, vec4(0.0));
              gx0 -= sz0 * (step(0.0, gx0) - 0.5);
              gy0 -= sz0 * (step(0.0, gy0) - 0.5);

              vec4 gx1 = ixy1 * (1.0 / 7.0);
              vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
              gx1 = fract(gx1);
              vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
              vec4 sz1 = step(gz1, vec4(0.0));
              gx1 -= sz1 * (step(0.0, gx1) - 0.5);
              gy1 -= sz1 * (step(0.0, gy1) - 0.5);

              vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
              vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
              vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
              vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
              vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
              vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
              vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
              vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

              vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
              g000 *= norm0.x;
              g010 *= norm0.y;
              g100 *= norm0.z;
              g110 *= norm0.w;
              vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
              g001 *= norm1.x;
              g011 *= norm1.y;
              g101 *= norm1.z;
              g111 *= norm1.w;

              float n000 = dot(g000, Pf0);
              float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
              float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
              float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
              float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
              float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
              float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
              float n111 = dot(g111, Pf1);

              vec3 fade_xyz = fade(Pf0);
              vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
              vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
              float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
              return 2.2 * n_xyz;
            }

            void main() {
              vUv = uv;
              vNormal = normalize(normalMatrix * normal);
              
              // Create complex surface displacement
              float noise = cnoise(position * 2.0 + time * 0.2);
              float noise2 = cnoise(position * 4.0 - time * 0.15);
              float noise3 = cnoise(position * 8.0 + time * 0.1);
              
              vDisplacement = noise * 0.5 + noise2 * 0.25 + noise3 * 0.125;
              vec3 displaced = position + normal * (vDisplacement * displacementStrength);
              
              gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform float colorIntensity;
            varying vec2 vUv;
            varying vec3 vNormal;
            varying float vDisplacement;

            void main() {
              // Dynamic color palette
              vec3 baseColor = vec3(1.0, 0.4, 0.0);
              vec3 hotColor = vec3(1.0, 0.8, 0.3);
              vec3 coolColor = vec3(0.8, 0.2, 0.0);
              
              // Create dynamic surface patterns
              float pattern = sin(vUv.y * 100.0 + time) * 0.5 + 0.5;
              pattern *= sin(vUv.x * 120.0 - time * 0.5) * 0.5 + 0.5;
              
              // Mix colors based on displacement and pattern
              vec3 color = mix(coolColor, hotColor, vDisplacement * 2.0 + 0.5);
              color = mix(color, baseColor, pattern);
              
              // Add pulsing brightness
              float pulse = sin(time * 2.0) * 0.1 + 0.9;
              color *= pulse * colorIntensity;
              
              // Add rim lighting effect
              float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              color += vec3(1.0, 0.6, 0.3) * fresnel * 0.5;
              
              gl_FragColor = vec4(color, 1.0);
            }
          `}
          transparent={true}
        />
      </mesh>

      {/* Enhanced corona effect */}
      <mesh ref={coronaRef} scale={3.0}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
              gl_FragColor = vec4(1.0, 0.4, 0.0, intensity);
            }
          `}
        />
      </mesh>

      {/* Outer glow with enhanced visual effects */}
      <mesh ref={glowRef} scale={4.0}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            time: { value: 0 }
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
              vec3 glowColor = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.8, 0.3), intensity);
              gl_FragColor = vec4(glowColor, intensity * 0.5);
            }
          `}
        />
      </mesh>

      {/* Lens flare effect */}
      <mesh ref={flareRef} scale={5.0}>
        <planeGeometry args={[10, 10]} />
        <shaderMaterial
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            time: { value: 0 }
          }}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              vec2 center = vec2(0.5, 0.5);
              float dist = length(vUv - center);
              float intensity = smoothstep(0.5, 0.0, dist);
              vec3 flareColor = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.8, 0.3), dist);
              gl_FragColor = vec4(flareColor, intensity * 0.3);
            }
          `}
        />
      </mesh>

      {/* Enhanced lighting */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2.0}
        distance={100}
        decay={2}
        color="#ffd7b9"
      />
      
      <pointLight
        position={[0, 0, 0]}
        intensity={1.0}
        distance={200}
        decay={2}
        color="#ff6b00"
      />
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: SceneEffects
// Adds cinematic post-processing effects for an award-winning look
// ------------------------------------------------------------------
function SceneEffects() {
  return (
    <EffectComposer>
      {/* Atmospheric bloom with subtle glow */}
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        blurPass={undefined}
        width={Infinity}
        height={Infinity}
      />
      
      {/* Subtle color aberration for depth */}
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0012, 0.0012]}
      />
    </EffectComposer>
  );
}
