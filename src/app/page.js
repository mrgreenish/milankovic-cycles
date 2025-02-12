"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
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
import { Poppins } from 'next/font/google';
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600'] });

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
  useEffect(() => {
    if (arrowRef.current) {
      // Set the arrow direction based on axial tilt and precession.
      arrowRef.current.setDirection(
        new THREE.Vector3(0, 1, 0)
          .applyAxisAngle(
            new THREE.Vector3(0, 0, 1),
            THREE.MathUtils.degToRad(axialTilt)
          )
          .applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            THREE.MathUtils.degToRad(precession)
          )
      );
    }
  }, [axialTilt, precession]);

  return (
    <group>
      <primitive
        object={
          new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0),
            5,
            0x333333,
            0.8,
            0.5
          )
        }
        ref={arrowRef}
      />
      <Html position={[0, 5.2, 0]} center>
        <div
          style={{
            color: "#333333",
            background: "rgba(255, 255, 255, 0.8)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "'Courier New', Courier, monospace",
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

    // Combine the rotations
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
  // Simplified elliptical orbit parameters.
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
      {/* Baseline orbit (dashed or thin line) */}
      <Line points={baselinePoints} color="rgba(0,0,0,0.8)" lineWidth={0.5} />
      {/* Current orbit */}
      <Line points={points} color="black" lineWidth={2} />

      {/* Seasonal markers with labels */}
      {seasonalMarkers.map((position, index) => (
        <group key={index} position={position}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={index % 2 === 0 ? "black" : "pink"} />
          </mesh>
          <Html position={[0, 1, 0]} center>
            <div
              style={{
                color: "white",
                backgroundColor: "rgba(0,0,0,0.7)",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
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

  return (
    <Card className="bg-white border border-gray-300 pt-[250px]">
      <CardHeader>
        <CardTitle className="text-black text-lg">
          Current Cycle States ({formatNumber(simulatedYear)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
        <p className="text-gray-800">{eccentricityMessage}</p>
        <p className="text-gray-800">{axialTiltMessage}</p>
        <p className="text-gray-800">{precessionMessage}</p>
        <p
          className={cn(
            "text-gray-800",
            temperature < 5 && "text-blue-700",
            temperature > 15 && "text-red-700"
          )}
        >
          {temperatureMessage}
        </p>
        <p className="text-gray-800">{causeEffectExplanation}</p>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------
// COMPONENT: GlobalTemperatureGraph
// Visualizes global temperature history along with other parameters.
// ------------------------------------------------------------------
function GlobalTemperatureGraph({
  axialTilt,
  eccentricity,
  precession,
  temperature,
  iceFactor,
  co2Level,
  simulatedYear,
  style,
  formatNumber,
}) {
  const canvasRef = useRef();
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const maxHistoryLength = 200;
  const lastUpdateRef = useRef(0);
  const updateInterval = 100; // Update every 100ms

  // Append new temperature data with rate limiting.
  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateRef.current >= updateInterval) {
      setTemperatureHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            temp: temperature,
            axialTilt,
            eccentricity,
            precession: precession % 360,
            co2: co2Level,
            ice: iceFactor,
            year: simulatedYear,
          },
        ];
        if (newHistory.length > maxHistoryLength) {
          return newHistory.slice(-maxHistoryLength);
        }
        return newHistory;
      });
      lastUpdateRef.current = currentTime;
    }
  }, [
    temperature,
    axialTilt,
    eccentricity,
    precession,
    co2Level,
    iceFactor,
    simulatedYear,
  ]);

  useEffect(() => {
    let animationFrameId;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas || temperatureHistory.length < 2) return;
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      // Clear the canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);

      // Define graph margins
      const margin = { top: 30, right: 60, bottom: 40, left: 60 };
      const graphWidth = width - margin.left - margin.right;
      const graphHeight = height - margin.top - margin.bottom;

      // Exaggerate temperature variations for visualization.
      const baselineTemp = 10;
      const exaggerationFactor = 5;
      const displayTemps = temperatureHistory.map(
        (p) => exaggerationFactor * (p.temp - baselineTemp) + baselineTemp
      );
      const minDisplayTemp = Math.min(...displayTemps) - 2;
      const maxDisplayTemp = Math.max(...displayTemps) + 2;
      const tempRange = maxDisplayTemp - minDisplayTemp;

      // Draw grid lines
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 5; i++) {
        const y = height - margin.bottom - (i / 5) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }

      // Draw axes
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, height - margin.bottom);
      ctx.lineTo(width - margin.right, height - margin.bottom);
      ctx.stroke();

      // Draw temperature line with a color gradient.
      const gradient = ctx.createLinearGradient(
        0,
        margin.top,
        0,
        height - margin.bottom
      );
      gradient.addColorStop(0, "#ff4444");
      gradient.addColorStop(1, "#4444ff");

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      displayTemps.forEach((displayTemp, i) => {
        const x = margin.left + (i / (maxHistoryLength - 1)) * graphWidth;
        const y =
          height -
          margin.bottom -
          ((displayTemp - minDisplayTemp) / tempRange) * graphHeight;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Draw parameter labels
      const parameters = [
        { label: "Tilt", value: axialTilt.toFixed(1) + "°", color: "#ffa500" },
        { label: "Ecc", value: eccentricity.toFixed(4), color: "#4444ff" },
        {
          label: "Prec",
          value: (precession % 360).toFixed(0) + "°",
          color: "#44ff44",
        },
        { label: "CO₂", value: co2Level + "ppm", color: "#ff44ff" },
        {
          label: "Ice",
          value: (iceFactor * 100).toFixed(0) + "%",
          color: "#44ffff",
        },
      ];

      ctx.textAlign = "left";
      ctx.font = "12px Arial";
      parameters.forEach((param, i) => {
        const y = margin.top + 20 + i * 20;
        ctx.fillStyle = param.color;
        ctx.fillText(
          `${param.label}: ${param.value}`,
          width - margin.right + 10,
          y
        );
      });

      // Add temperature scale
      ctx.fillStyle = "black";
      ctx.textAlign = "right";
      const tempStep = tempRange / 5;
      for (let i = 0; i <= 5; i++) {
        const temp = minDisplayTemp + i * tempStep;
        const y = height - margin.bottom - (i / 5) * graphHeight;
        ctx.fillText(`${temp.toFixed(1)}°C`, margin.left - 5, y + 4);
      }

      // Add time scale labels
      ctx.textAlign = "center";
      [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
        const x = margin.left + fraction * graphWidth;
        const index = Math.floor(fraction * (temperatureHistory.length - 1));
        const year = temperatureHistory[index]?.year || 0;
        ctx.fillText(formatNumber(year), x, height - margin.bottom + 20);
      });

      // Title and axis labels
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Global Temperature History", width / 2, margin.top - 10);

      ctx.font = "12px Arial";
      ctx.fillText("Simulation Time", width / 2, height - 5);

      ctx.save();
      ctx.translate(15, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("Temperature (°C)", 0, 0);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    temperatureHistory,
    axialTilt,
    eccentricity,
    precession,
    co2Level,
    iceFactor,
    formatNumber,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={250}
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        transform: "none",
        zIndex: 10,
        backgroundColor: "white",
        borderRadius: "5px",
        padding: "10px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        ...style,
      }}
    />
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
  return (
    <Card className="fixed top-5 left-5 w-[300px] bg-white border border-gray-300">
      <CardHeader>
        <CardTitle className="text-black">Milanković Cycles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-800">Eccentricity</span>
            <span className="text-sm text-gray-400">
              {eccentricity.toFixed(4)}
            </span>
          </div>
          <Slider
            defaultValue={[eccentricity]}
            value={[eccentricity]}
            min={0.001}
            max={0.2}
            step={0.001}
            onValueChange={([value]) => onEccentricityChange(value)}
          />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-800">Axial Tilt (°)</span>
            <span className="text-sm text-gray-400">
              {axialTilt.toFixed(1)}°
            </span>
          </div>
          <Slider
            defaultValue={[axialTilt]}
            value={[axialTilt]}
            min={10}
            max={45}
            step={0.1}
            onValueChange={([value]) => onAxialTiltChange(value)}
          />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-800">Precession (°)</span>
            <span className="text-sm text-gray-400">
              {precession.toFixed(0)}°
            </span>
          </div>
          <Slider
            defaultValue={[precession]}
            value={[precession]}
            min={0}
            max={360}
            step={1}
            onValueChange={([value]) => onPrecessionChange(value)}
          />
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

    // Clear canvas with a gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, "#ffffff");
    bgGradient.addColorStop(1, "#f0f0f0");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Graph margins and dimensions
    const margin = { top: 30, right: 40, bottom: 40, left: 50 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Parameters
    const latitudes = Array.from({ length: 37 }, (_, i) => -90 + i * 5); // -90 to 90° in 5° steps
    const seasons = Array.from({ length: 48 }, (_, i) => i * 7.5); // 0° to 360° in 7.5° steps

    // Calculate insolation
    const insolationData = [];
    let maxInsolation = 0;
    let minInsolation = Infinity;

    latitudes.forEach((lat) => {
      const latRad = THREE.MathUtils.degToRad(lat);
      const row = [];

      seasons.forEach((season) => {
        const seasonRad = THREE.MathUtils.degToRad(season);
        const tiltRad = THREE.MathUtils.degToRad(axialTilt);

        // Enhanced insolation calculation
        let insolation =
          Math.cos(latRad) * Math.cos(seasonRad) +
          Math.sin(latRad) * Math.sin(tiltRad) * Math.cos(seasonRad);

        // Orbital effects
        const distanceFactor =
          1 -
          eccentricity *
            Math.cos(seasonRad + THREE.MathUtils.degToRad(precession));
        insolation *= 1 / (distanceFactor * distanceFactor);

        // Add small random variation for visual interest
        insolation *= 1 + Math.random() * 0.05;

        insolation = Math.max(0, insolation);
        maxInsolation = Math.max(maxInsolation, insolation);
        minInsolation = Math.min(minInsolation, insolation);
        row.push(insolation);
      });
      insolationData.push(row);
    });

    // Draw the heatmap
    const cellWidth = graphWidth / seasons.length;
    const cellHeight = graphHeight / latitudes.length;

    insolationData.forEach((row, latIndex) => {
      row.forEach((value, seasonIndex) => {
        const x = margin.left + seasonIndex * cellWidth;
        const y = margin.top + latIndex * cellHeight;

        // Normalize value between 0 and 1
        const normalizedValue =
          (value - minInsolation) / (maxInsolation - minInsolation);

        // Create a more sophisticated color gradient
        const h = (1 - normalizedValue) * 240; // Hue: blue (240) to red (0)
        const s = 80 + normalizedValue * 20; // Saturation: 80-100%
        const l = 20 + normalizedValue * 60; // Lightness: 20-80%
        ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
      });
    });

    // Draw grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 0.5;

    // Vertical lines (seasons)
    for (let i = 0; i <= 4; i++) {
      const x = margin.left + (i * graphWidth) / 4;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      ctx.stroke();
    }

    // Horizontal lines (latitudes)
    for (let i = 0; i <= 6; i++) {
      const y = margin.top + (i * graphHeight) / 6;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
    }

    // Draw axes and labels
    ctx.fillStyle = "black";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.font = "10px Arial";

    // Season labels with months
    const seasonLabels = [
      "Dec (Winter)",
      "Mar (Spring)",
      "Jun (Summer)",
      "Sep (Fall)",
    ];
    seasonLabels.forEach((label, i) => {
      const x = margin.left + (i * graphWidth) / 3;
      ctx.fillText(label, x, height - margin.bottom + 15);
    });

    // Latitude labels
    [-90, -60, -30, 0, 30, 60, 90].forEach((lat) => {
      const y = margin.top + ((lat + 90) / 180) * graphHeight;
      ctx.textAlign = "right";
      ctx.fillText(`${lat}°`, margin.left - 5, y + 4);
    });

    // Title and legend
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Solar Insolation by Latitude and Season", width / 2, 15);

    // Add color scale legend
    const legendWidth = 20;
    const legendHeight = graphHeight / 2;
    const legendX = width - margin.right + 20;
    const legendY = margin.top + graphHeight / 4;

    const legendGradient = ctx.createLinearGradient(
      0,
      legendY + legendHeight,
      0,
      legendY
    );
    legendGradient.addColorStop(0, "hsl(240, 80%, 20%)"); // Low insolation (blue)
    legendGradient.addColorStop(1, "hsl(0, 100%, 50%)"); // High insolation (red)

    ctx.fillStyle = legendGradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // Legend labels
    ctx.font = "10px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = "black";
    ctx.fillText("High", legendX + legendWidth + 5, legendY + 10);
    ctx.fillText("Low", legendX + legendWidth + 5, legendY + legendHeight - 5);
  }, [axialTilt, eccentricity, precession]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: 440,
        transform: "none",
        zIndex: 10,
        background: "white",
        padding: "10px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        width={400}
        height={250}
        style={{
          borderRadius: "5px",
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Home – main simulation component
// ------------------------------------------------------------------
export default function Home() {
  // Baseline orbital parameters.
  const baselineEccentricity = 0.0167;
  const baselineAxialTilt = 23.5;
  const baselinePrecession = 0;
  const realisticAmsterdamTemp = 10; // °C baseline temperature
  const sensitivity = 30; // Temperature sensitivity factor

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

  // Preset scenarios for different climatic conditions.
  const presets = {
    "Last Glacial Maximum": {
      eccentricity: 0.02,
      axialTilt: 22,
      precession: 120,
      description:
        "Represents a period with extensive ice sheets, when lower axial tilt resulted in cooler summers.",
    },
    "Holocene Optimum": {
      eccentricity: 0.0167,
      axialTilt: 23.5,
      precession: 0,
      description:
        "A warm period following the last ice age, with moderate orbital parameters.",
    },
    "Eemian Interglacial": {
      eccentricity: 0.017,
      axialTilt: 23.7,
      precession: 310,
      description:
        "A warm period before the last glacial period, marked by milder climates.",
    },
    "Little Ice Age": {
      eccentricity: 0.018,
      axialTilt: 23.2,
      precession: 150,
      description:
        "A cooling period with minor glacial expansion, linked to volcanic activity and solar minima.",
    },
    "Future Warm Period": {
      eccentricity: 0.0167,
      axialTilt: 24,
      precession: 210,
      description:
        "A speculative scenario with a slight increase in axial tilt, predicting warmer global temperatures.",
    },
  };
  const [preset, setPreset] = useState("");

  // Additional greenhouse gas slider.
  const [co2Level, setCo2Level] = useState(280);
  const [showIntro, setShowIntro] = useState(true);

  // Smooth the displayed temperature.
  const [displayedTemp, setDisplayedTemp] = useState(realisticAmsterdamTemp);

  // Format number with k/m suffix and 3 significant digits
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(2)}b years`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}m years`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}k years`;
    }
    return `${num.toFixed(1)} years`;
  };

  // Main simulation loop.
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();
    const animate = (time) => {
      if (!isPaused) {
        const delta = time - lastTime;
        lastTime = time;
        setSimulatedYear((prev) => prev + delta * timeScale);
        if (autoAnimate) {
          const elapsed = time;
          const exaggeratedEcc = 0.05 + 0.1 * Math.sin(elapsed * 0.0001);
          const exaggeratedTilt =
            baselineAxialTilt + 5 * Math.sin(elapsed * 0.00005);
          const exaggeratedPrec = (elapsed * 0.02) % 360;
          const orbitalMultiplier = 1 + tempOffset / 20;
          const newEccentricity =
            baselineEccentricity +
            exaggeration *
              (exaggeratedEcc - baselineEccentricity) *
              orbitalMultiplier;
          const newAxialTilt =
            baselineAxialTilt +
            exaggeration *
              (exaggeratedTilt - baselineAxialTilt) *
              orbitalMultiplier;
          const newPrecession =
            (baselinePrecession +
              exaggeration *
                (exaggeratedPrec - baselinePrecession) *
                orbitalMultiplier) %
            360;
          setEccentricity(Math.max(0.001, Math.min(0.2, newEccentricity)));
          setAxialTilt(Math.max(10, Math.min(45, newAxialTilt)));
          setPrecession(newPrecession);
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPaused,
    timeScale,
    autoAnimate,
    exaggeration,
    baselineAxialTilt,
    baselineEccentricity,
    baselinePrecession,
    tempOffset,
  ]);

  // Apply a preset scenario if selected.
  useEffect(() => {
    if (preset && presets[preset]) {
      const { eccentricity, axialTilt, precession } = presets[preset];
      setEccentricity(eccentricity);
      setAxialTilt(axialTilt);
      setPrecession(precession);
      setAutoAnimate(false);
    }
  }, [preset]);

  /* 
    Temperature Model Calculation:
    - Convert tilt and precession angles to radians.
    - Compute a simplified "summer insolation" factor based on:
      • Axial tilt: More tilt means greater seasonal extremes.
      • Eccentricity: A more elliptical orbit (higher eccentricity) leads to stronger differences in insolation.
      • Precession: Shifts the timing of the seasons relative to Earth's orbit.
    - Compare current insolation with a baseline, then adjust temperature (T0) accordingly.
    - Include an ice–albedo feedback using a logistic function.
    - Add a seasonal sine wave to simulate intra-annual variations.
  */
  const tiltRad = THREE.MathUtils.degToRad(axialTilt);
  const precessionRad = THREE.MathUtils.degToRad(precession);
  const precessionFactor =
    1 - 0.15 * Math.cos(precessionRad - THREE.MathUtils.degToRad(270));
  // Note: This is a simplified approximation of summer insolation.
  const summerIns = Math.sin(tiltRad) * (1 - eccentricity) * precessionFactor;

  const baselineTiltRad = THREE.MathUtils.degToRad(baselineAxialTilt);
  const baselinePrecessionRad = THREE.MathUtils.degToRad(baselinePrecession);
  const baselinePrecessionFactor =
    1 - 0.15 * Math.cos(baselinePrecessionRad - THREE.MathUtils.degToRad(270));
  const baselineSummerIns =
    Math.sin(baselineTiltRad) *
    (1 - baselineEccentricity) *
    baselinePrecessionFactor;

  const T0 = realisticAmsterdamTemp;
  const co2Sensitivity = (co2Level - 280) / 280;
  const adjustedSensitivity = sensitivity + co2Sensitivity * 10;
  const T_prelim = T0 + adjustedSensitivity * (summerIns - baselineSummerIns);
  const T_adjusted = T_prelim + tempOffset;

  // Ice feedback: a logistic function where lower temperatures produce more ice.
  const T_threshold = 7;
  const logisticWidth = 0.5;
  const f_ice = 1 / (1 + Math.exp((T_adjusted - T_threshold) / logisticWidth));
  const feedback = 3;
  const T_effective = T_adjusted - feedback * f_ice;

  // Seasonal variation (annual cycle)
  const season = simulatedYear - Math.floor(simulatedYear);
  const seasonalAmplitude = 5;
  const seasonalVariation =
    seasonalAmplitude * Math.sin(2 * Math.PI * season - Math.PI / 2);
  const finalTemp = T_effective + seasonalVariation;

  // Smoothly update the displayed temperature.
  useEffect(() => {
    const smoothingFactor = 0.05;
    const interval = setInterval(() => {
      setDisplayedTemp((prev) => prev + smoothingFactor * (finalTemp - prev));
    }, 100);
    return () => clearInterval(interval);
  }, [finalTemp]);

  // Normalize temperature value for shader tinting (0 to 1).
  const normTemp = Math.max(0, Math.min(1, (finalTemp + 5) / 25));

  // Handlers for manual parameter adjustments.
  const handleManualChange = (setter) => (e) => {
    setAutoAnimate(false);
    setter(parseFloat(e.target.value));
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {showIntro && <IntroOverlay onStart={() => setShowIntro(false)} />}
      {/* 3D Scene */}
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 15, 25], fov: 50 }}
          background={new THREE.Color(0x000022)}
        >
          <ambientLight intensity={0.2} />
          <directionalLight
            castShadow
            position={[10, 20, 10]}
            intensity={1.5}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <Sun />
          <OrbitPath eccentricity={eccentricity} />
          <OrbitingEarth
            eccentricity={eccentricity}
            axialTilt={axialTilt}
            precession={precession}
            temperature={normTemp}
            iceFactor={f_ice}
            normTemp={normTemp}
          />
          <AxisIndicators axialTilt={axialTilt} precession={precession} />
          <OrbitControls autoRotate enableDamping dampingFactor={0.1} />
          <SceneEffects />
        </Canvas>
      </div>

      {/* Left Panel Group */}
      <div className="fixed left-5 top-5 space-y-4 w-[300px]">
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
          }}
          onAxialTiltChange={(value) => {
            setAxialTilt(value);
            setAutoAnimate(false);
          }}
          onPrecessionChange={(value) => {
            setPrecession(value);
            setAutoAnimate(false);
          }}
        />

        <NarrativeOverlay
          simulatedYear={simulatedYear}
          temperature={displayedTemp}
          iceFactor={f_ice}
          eccentricity={eccentricity}
          axialTilt={axialTilt}
          precession={precession}
          formatNumber={formatNumber}
        />
      </div>

      {/* Right Panel Group */}
      <div className="fixed right-5 top-5 space-y-4 w-[300px]">
        {/* Time Control Panel */}
        <Card className="bg-white border border-gray-300">
          <CardHeader>
            <CardTitle className="text-black">Time Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="w-full px-4 py-2 bg-black hover:bg-black/90 text-white rounded-md transition-colors"
            >
              {isPaused ? "Play" : "Pause"}
            </button>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-800">Speed</span>
                <span className="text-sm text-gray-400">
                  {formatNumber(timeScale)}
                </span>
              </div>
              <Slider
                defaultValue={[timeScale]}
                value={[timeScale]}
                min={0.001}
                max={500000000}
                step={1}
                onValueChange={([value]) => setTimeScale(value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm text-gray-800">Preset Scenarios</label>
              <select
                value={preset}
                onChange={(e) => {
                  setPreset(e.target.value);
                  if (presets[e.target.value]) {
                    const { eccentricity, axialTilt, precession } =
                      presets[e.target.value];
                    setEccentricity(eccentricity);
                    setAxialTilt(axialTilt);
                    setPrecession(precession);
                    setAutoAnimate(false);
                  }
                }}
                className="w-full bg-black text-white border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-black focus:border-black hover:bg-black/90 transition-colors"
              >
                <option value="">None</option>
                {Object.keys(presets).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              {preset && presets[preset]?.description && (
                <div className="text-sm text-gray-300 mt-2">
                  {presets[preset].description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Controls Panel */}
        <Card className="bg-white border border-gray-300">
          <CardHeader>
            <CardTitle className="text-black">Additional Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-800">CO₂ Level (ppm)</span>
                <span className="text-sm text-gray-400">{co2Level}</span>
              </div>
              <Slider
                defaultValue={[co2Level]}
                value={[co2Level]}
                min={250}
                max={500}
                step={1}
                onValueChange={([value]) => {
                  setCo2Level(value);
                  setAutoAnimate(false);
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <GlobalTemperatureGraph
        axialTilt={axialTilt}
        eccentricity={eccentricity}
        precession={precession}
        temperature={displayedTemp}
        iceFactor={f_ice}
        co2Level={co2Level}
        simulatedYear={simulatedYear}
        formatNumber={formatNumber}
        style={{
          position: "fixed",
          bottom: 20,
          left: 20,
          transform: "none",
          zIndex: 10,
          width: "400px",
          height: "250px",
        }}
      />

      <SeasonalInsolationGraph
        axialTilt={axialTilt}
        eccentricity={eccentricity}
        precession={precession}
        style={{
          position: "fixed",
          bottom: 20,
          left: 440,
          transform: "none",
          zIndex: 10,
          width: "400px",
          height: "250px",
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Sun
// ------------------------------------------------------------------
// Updated Sun component using the new shaders.
function Sun() {
  const materialRef = useRef();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      {/* Higher geometry detail for better displacement fidelity */}
      <sphereGeometry args={[2, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          time: { value: 0 },
          displacementStrength: { value: 0.02 }, // Increase or decrease for more or less "bubbling"
        }}
        vertexShader={sunVertexShader}
        fragmentShader={sunFragmentShader}
      />
    </mesh>
  );
}

// ------------------------------------------------------------------
// COMPONENT: SceneEffects
// Adds post-processing effects for a hip, vintage look.
// ------------------------------------------------------------------
function SceneEffects() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
      />
      {/* Uncomment the ChromaticAberration effect below for an extra cool visual twist.
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.002, 0.002]}
      /> */}
    </EffectComposer>
  );
}

/* Updated IntroOverlay component */
function IntroOverlay({ onStart }) {
  return (
    <div className={`${poppins.className} fixed inset-0 bg-black bg-opacity-85 backdrop-blur-sm flex flex-col justify-center items-center text-white p-5 text-center z-50`}>
      <h1 className="text-4xl font-bold mb-5">
        Introduction to Milanković Cycles
      </h1>
      <p className="text-lg max-w-xl mb-5">
        Milanković cycles refer to the long-term variations in Earth's orbit that affect climate patterns on our planet. These cycles are driven by changes in Earth's eccentricity, axial tilt, and precession, which influence the amount of sunlight Earth receives over thousands of years.
      </p>
      <p className="text-lg max-w-xl mb-5">
        Milutin Milanković was a renowned Serbian mathematician and astronomer who developed theories that explain how these orbital changes have shaped our climate throughout history.
      </p>
      <img src="/miltin-milankovic.png" alt="Milutin Milanković" className="w-48 h-auto rounded-lg mb-5" />
      <button
        onClick={onStart}
        className="px-5 py-2 text-lg bg-white text-black rounded hover:bg-gray-200 cursor-pointer"
      >
        Start Simulation
      </button>
    </div>
  );
}
