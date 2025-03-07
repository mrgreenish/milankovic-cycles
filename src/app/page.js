"use client";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Line,
  Html,
  Environment,
  PerspectiveCamera,
  Billboard,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  SSAO,
  DepthOfField,
  Noise,
  Vignette,
  ToneMapping,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import "./globals.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { GlobalTemperatureGraph } from "@/components/GlobalTemperatureGraph";
import IntroOverlay from "@/components/IntroOverlay";
import {
  calculateGlobalTemperature,
  normalizeTemperature,
  smoothTemperature,
} from "@/lib/temperatureUtils";
import {
  ObservatoryPanel,
  ObservatoryButton,
  DataDisplay,
  MobileCard,
  ObservatorySlider
} from "@/components/ObservatoryPanel";
import { CycleComparisonPanel } from "@/components/CycleComparisonPanel";
import { NarrativeOverlay } from "@/components/NarrativeOverlay";
import { SeasonalInsolationGraph } from "@/components/SeasonalInsolationGraph";
import { LatitudinalInsolationGraph } from "@/components/LatitudinalInsolationGraph";
import { TemperatureTimeline } from "@/components/TemperatureTimeline";
import Link from "next/link";
import { 
  MobileNavigation, 
  BottomSheet, 
  MobileControlGroup,
  MobileOnlyView,
  DesktopOnlyView
} from "@/components/MobileNavigation";
import { setCookie, hasCookie } from '../lib/cookieUtils';
import { GuidedTour, TourButton } from "@/components/GuidedTour";

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
    // Simplified displacement calculation
    vec3 displacedPosition = position;
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
  uniform float precession; 
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
    
    // Subtle ice effect
    vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    color.rgb = mix(gray, color.rgb, iceFactor);
    
    gl_FragColor = color;
  }
`;

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

  float noiseVal = snoise(position * 3.0 + time * 0.2);
  vec3 displaced = position + normal * noiseVal * displacementStrength;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPos = -mvPosition.xyz; 
  gl_Position = projectionMatrix * mvPosition;
}
`;

const sunFragmentShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vViewPos;

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

vec2 swirlUV(vec2 uv, float angle, vec2 center) {
  vec2 offset = uv - center;
  float r = length(offset);
  float phi = atan(offset.y, offset.x) + angle * (1.0 - r);
  return center + vec2(cos(phi), sin(phi)) * r;
}

void main() {
  float dist = distance(vUv, vec2(0.5));
  float radial = 1.0 - smoothstep(0.2, 0.65, dist);

  vec2 warpedUV = swirlUV(vUv, time * 0.3, vec2(0.5));
  float noiseVal = fbm(vec3(warpedUV * 10.0, time * 0.2));
  float brightness = radial + noiseVal * 0.2;

  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(vViewPos);
  float NdotV = dot(N, V); 
  float limb = pow(clamp(1.0 - NdotV, 0.0, 1.0), 0.6);

  vec3 baseColor = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), brightness);
  baseColor *= (1.0 - 0.4 * limb);

  if (noiseVal < 0.0) {
    baseColor = mix(baseColor, vec3(0.3, 0.2, 0.05), 0.4);
  }

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

    const cloudRef = useRef();
    useFrame(() => {
      if (cloudRef.current) {
        cloudRef.current.rotation.y += 0.005;
      }
    });

    if (!texturesLoaded || !uniforms || !textures) {
      return null;
    }

    const tiltQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      THREE.MathUtils.degToRad(axialTilt)
    );
    const precessionQuaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      THREE.MathUtils.degToRad(precession)
    );
    const combinedQuaternion = tiltQuaternion.multiply(precessionQuaternion);

    return (
      <group quaternion={combinedQuaternion}>
        <mesh ref={ref} castShadow receiveShadow>
          <sphereGeometry args={[1, 48, 48]} />
          <shaderMaterial
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
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

        <mesh scale={1.03}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color="#a8d0e6"
            transparent={true}
            opacity={iceFactor * 0.5}
            depthWrite={false}
          />
        </mesh>

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
  const baselineB = a * (1 - 2 * 0.0167);

  const points = [];
  const baselinePoints = [];
  const seasonalMarkers = [];

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
      <Line
        points={baselinePoints}
        color="#2d4661"
        lineWidth={0.6}
        transparent={false}
        opacity={1}
        dashed
        dashSize={0.15}
        gapSize={0.15}
      />
      <Line
        points={baselinePoints}
        color="white"
        lineWidth={1.2}
        transparent
        opacity={0.5}
        dashed
        dashSize={0.2}
        gapSize={0.2}
      />
      <Line
        points={baselinePoints}
        color="#375a82"
        lineWidth={1.8}
        transparent
        opacity={0.2}
        dashed
        dashSize={0.25}
        gapSize={0.25}
      />

      <Line
        points={points}
        color="#cdaf7d"
        lineWidth={2}
        transparent={false}
        opacity={1}
      />
      <Line
        points={points}
        color="#e8d0a9"
        lineWidth={4}
        transparent
        opacity={0.7}
      />
      <Line
        points={points}
        color="#e8d0a9"
        lineWidth={6}
        transparent
        opacity={0.4}
      />

      {seasonalMarkers.map((position, index) => (
        <group key={index} position={position}>
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
              transparent={false}
              opacity={1}
            />
          </mesh>
          <mesh scale={1.2}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
              transparent
              opacity={0.6}
            />
          </mesh>
          <mesh scale={1.4}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#cdaf7d" : "#e36962"}
              transparent
              opacity={0.3}
            />
          </mesh>
          <Html position={[0, 1, 0]} center>
            <div
              style={{
                color: "white",
                backgroundColor: "rgba(205, 175, 125, 0.6)",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(232, 208, 169, 0.8)",
                textShadow: "0 0 10px rgba(232, 208, 169, 1)",
                boxShadow: "0 0 20px rgba(205, 175, 125, 0.5)",
              }}
            >
              {index === 0
                ? "Winter (N. Hemisphere)"
                : index === 1
                ? "Spring"
                : index === 2
                ? "Summer (N. Hemisphere)"
                : "Fall"}
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
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Home – main simulation component
// ------------------------------------------------------------------
export default function Home() {
  const baselineEccentricity = 0.0167;
  const baselineAxialTilt = 23.5;
  const baselinePrecession = 0;
  const realisticAmsterdamTemp = 10; // °C
  const sensitivity = 30; // degrees per unit insolation difference

  // Ref for mobile menu
  const mobileMenuRef = useRef(null);
  
  // Function to close mobile menu
  const closeMobileMenu = useCallback(() => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.classList.remove('open');
    }
  }, []);

  const [eccentricity, setEccentricity] = useState(baselineEccentricity);
  const [axialTilt, setAxialTilt] = useState(baselineAxialTilt);
  const [precession, setPrecession] = useState(baselinePrecession);
  const [autoAnimate, setAutoAnimate] = useState(true);
  const [exaggeration, setExaggeration] = useState(0.5);

  const [tempOffset, setTempOffset] = useState(0);
  const [simulatedYear, setSimulatedYear] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(0.01);

  const [iceFactor, setIceFactor] = useState(0);

  const [timeControlsHovered, setTimeControlsHovered] = useState(false);
  const [scenariosHovered, setScenariosHovered] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  const presets = {
    "Last Glacial Maximum (21,000 BP)": {
      eccentricity: 0.019,
      axialTilt: 22.99,
      precession: 114,
      description:
        "Peak of last ice age with extensive ice sheets. Northern Hemisphere summers occurred near aphelion, minimizing summer insolation.",
      year: -21000,
      co2Level: 180, // Lower CO2 during ice age
    },
    "Mid-Holocene Optimum (6,000 BP)": {
      eccentricity: 0.0187,
      axialTilt: 24.1,
      precession: 303,
      description:
        "Warm period with enhanced seasonal contrasts. Northern Hemisphere summers near perihelion maximized summer insolation.",
      year: -6000,
      co2Level: 265, // Lower than pre-industrial CO2
    },
    "Mid-Pleistocene Transition (800,000 BP)": {
      eccentricity: 0.043,
      axialTilt: 22.3,
      precession: 275,
      description:
        "Transition period when glacial cycles shifted from 41,000-year to 100,000-year periods.",
      year: -800000,
      co2Level: 240, // Lower than pre-industrial CO2
    },
    "PETM (56 Million BP)": {
      eccentricity: 0.052,
      axialTilt: 23.8,
      precession: 180,
      description:
        "Paleocene-Eocene Thermal Maximum - extreme global warming event with high CO2 levels.",
      year: -56000000,
      co2Level: 1500, // Very high CO2 level
    },
    "Future Configuration (50,000 AP)": {
      eccentricity: 0.015,
      axialTilt: 23.2,
      precession: 90,
      description:
        "Projected orbital configuration showing reduced seasonal contrasts.",
      year: 50000,
      co2Level: 280, // Pre-industrial CO2 level
    },
  };
  const [preset, setPreset] = useState("");

  const [co2Level, setCo2Level] = useState(280);
  const [showIntro, setShowIntro] = useState(false);
  const [hasIntroFadedOut, setHasIntroFadedOut] = useState(true);

  const [displayedTemp, setDisplayedTemp] = useState(realisticAmsterdamTemp);
  const [parameterPreview, setParameterPreview] = useState(null);
  const [calculatedTemp, setCalculatedTemp] = useState(realisticAmsterdamTemp);

  // Add mobile-specific state
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isTouchingSlider, setIsTouchingSlider] = useState(false);
  
  // Function to handle slider touch events
  const handleSliderTouchStart = (e) => {
    e.stopPropagation();
    setIsTouchingSlider(true);
    // Store the current autoAnimate state
    if (autoAnimate) {
      // We'll temporarily disable autoAnimate while touching the slider
      setAutoAnimate(false);
    }
  };
  
  const handleSliderTouchEnd = () => {
    setIsTouchingSlider(false);
  };
  
  // Add global touch end event listener
  useEffect(() => {
    const handleTouchEnd = () => {
      setIsTouchingSlider(false);
    };
    
    window.addEventListener('touchend', handleTouchEnd);
    return () => window.removeEventListener('touchend', handleTouchEnd);
  }, []);
  
  // Check if the device is mobile
  useEffect(() => {
    setMounted(true);
    
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    
    // Check for intro cookie on component mount
    const hasSeenIntro = hasCookie('introShown');
    setShowIntro(!hasSeenIntro);
    
    // Add keyboard shortcuts
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key) {
        case ' ': // Space bar to toggle play/pause
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
        case 'ArrowRight': // Speed up simulation
          e.preventDefault();
          setTimeScale(prev => Math.min(prev * 2, 1000000));
          break;
        case 'ArrowLeft': // Slow down simulation
          e.preventDefault();
          setTimeScale(prev => Math.max(prev / 2, 0.001));
          break;
        case 'r': // Reset to default parameters
          e.preventDefault();
          setEccentricity(baselineEccentricity);
          setAxialTilt(baselineAxialTilt);
          setPrecession(baselinePrecession);
          break;
        case 't': // Toggle tour
          e.preventDefault();
          setShowTour(prev => !prev);
          setCurrentTourStep(0);
          break;
        case 'k': // Toggle keyboard shortcuts
          e.preventDefault();
          setShowKeyboardShortcuts(prev => !prev);
          break;
        case 'Escape': // Close tour and keyboard shortcuts
          if (showTour) {
            e.preventDefault();
            setShowTour(false);
          }
          if (showKeyboardShortcuts) {
            e.preventDefault();
            setShowKeyboardShortcuts(false);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener("resize", checkIfMobile);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [baselineEccentricity, baselineAxialTilt, baselinePrecession, showTour, showKeyboardShortcuts]);

  useEffect(() => {
    if (!isFinite(simulatedYear) || Math.abs(simulatedYear) > 1e21) {
      setSimulatedYear(0);
      return;
    }
    const season = ((simulatedYear % 1) + 1) % 1;
    const tempData = calculateGlobalTemperature({
      latitude: 52.37,
      season,
      eccentricity,
      axialTilt,
      precession,
      co2Level,
      tempOffset,
    });
    setCalculatedTemp(tempData.temperature);
    setIceFactor(tempData.iceFactor);
  }, [
    simulatedYear,
    eccentricity,
    axialTilt,
    precession,
    co2Level,
    tempOffset,
  ]);

  useEffect(() => {
    const smoothingFactor = 0.5;
    const interval = setInterval(() => {
      setDisplayedTemp((prev) => {
        if (parameterPreview) {
          const previewWeight = 0.9;
          const targetTemp =
            calculatedTemp * (1 - previewWeight) +
            parameterPreview * previewWeight;
          return smoothTemperature(prev, targetTemp, smoothingFactor);
        }
        return smoothTemperature(prev, calculatedTemp, smoothingFactor);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [calculatedTemp, parameterPreview]);

  useEffect(() => {
    if (parameterPreview !== null) {
      const timeout = setTimeout(() => {
        setParameterPreview(null);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [parameterPreview]);

  const formatNumber = (num) => {
    if (!isFinite(num) || Math.abs(num) > 1e21) {
      return "0 years";
    }
    const isNegative = num < 0;
    const absNum = Math.abs(num);

    const formatTo3Digits = (n) => {
      if (n < 10) {
        return n.toPrecision(3);
      } else if (n < 100) {
        return n.toPrecision(3);
      } else {
        return Math.round(n);
      }
    };

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
      if (isNegative) {
        result = `${formatTo3Digits(millions)} million years BP`;
      } else {
        result = `${formatTo3Digits(millions)} million years`;
      }
    } else if (absNum >= 1000) {
      const thousands = absNum / 1000;
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

  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();
    const animate = (time) => {
      if (!isPaused && !isTouchingSlider) {
        const delta = time - lastTime;
        lastTime = time;
        const yearScale = timeScale * 2000;
        setSimulatedYear((prev) => {
          const newYear = prev + delta * yearScale;
          if (!isFinite(newYear) || Math.abs(newYear) > 1e21) {
            return 0;
          }
          return newYear;
        });

        if (autoAnimate) {
          const elapsed = time;
          const eccCycle =
            Math.sin(elapsed * 0.00001) * 0.5 +
            Math.sin(elapsed * 0.0000025) * 0.5;
          const exaggeratedEcc = 0.0167 + 0.041 * eccCycle;
          const tiltCycle = Math.sin(elapsed * 0.000024);
          const exaggeratedTilt = baselineAxialTilt + 1.2 * tiltCycle;
          const exaggeratedPrec = (elapsed * 0.000043) % 360;

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

          setEccentricity(Math.max(0.0034, Math.min(0.058, newEccentricity)));
          setAxialTilt(Math.max(22.1, Math.min(24.5, newAxialTilt)));
          setPrecession(newPrecession);
        }
      } else {
        // Update lastTime to prevent large delta on resume
        lastTime = time;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [
    isPaused,
    isTouchingSlider,
    timeScale,
    autoAnimate,
    exaggeration,
    baselineAxialTilt,
    baselineEccentricity,
    baselinePrecession,
    tempOffset,
  ]);

  useEffect(() => {
    if (preset && presets[preset]) {
      const { eccentricity, axialTilt, precession, year, co2Level: presetCO2 } = presets[preset];
      setEccentricity(eccentricity);
      setAxialTilt(axialTilt);
      setPrecession(precession);
      if (year !== undefined) {
        setSimulatedYear(year);
      }
      if (presetCO2 !== undefined) {
        setCo2Level(presetCO2);
      }
      setAutoAnimate(false);
    }
  }, [preset]);

  const normTemp = normalizeTemperature(calculatedTemp, 0, 15);

  const handleIntroComplete = () => {
    setShowIntro(false);
    // Set cookie to expire in 2 hours
    if (typeof window !== 'undefined') {
      setCookie('introShown', 'true', 2);
    }
    setTimeout(() => {
      setHasIntroFadedOut(true);
    }, 1000);
  };

  // Tour steps
  const tourSteps = [
    {
      target: "orbital-parameters",
      title: "Orbital Parameters",
      content: "Adjust these sliders to change Earth's orbit. Eccentricity affects how elliptical the orbit is, axial tilt changes seasonal intensity, and precession shifts when seasons occur.",
      position: "right"
    },
    {
      target: "time-controls",
      title: "Time Controls",
      content: "Control the simulation speed or pause it. The logarithmic slider lets you speed up or slow down time dramatically.",
      position: "left"
    },
    {
      target: "historical-scenarios",
      title: "Historical Scenarios",
      content: "Jump to key periods in Earth's climate history to see how Milankovitch cycles influenced past climates.",
      position: "left"
    },
    {
      target: "climate-data",
      title: "Climate Data",
      content: "This graph shows how temperature changes based on the orbital parameters you've set.",
      position: "left"
    },
    {
      target: "3d-visualization",
      title: "3D Visualization",
      content: "This model shows Earth's orbit and rotation. Notice how the parameters you change affect the orbit shape and Earth's tilt.",
      position: "bottom"
    }
  ];

  // Keyboard shortcuts
  const keyboardShortcuts = [
    { key: 'Space', description: 'Play/Pause simulation' },
    { key: '→', description: 'Speed up simulation' },
    { key: '←', description: 'Slow down simulation' },
    { key: 'R', description: 'Reset to default parameters' },
    { key: 'T', description: 'Start guided tour' },
    { key: 'K', description: 'Show/hide keyboard shortcuts' },
    { key: 'Esc', description: 'Close panels/tour' },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      
      {/* 3D Canvas */}
      <div className="canvas-container">
        <Suspense fallback={null}>
          <Canvas 
            shadows={false} 
            gl={{ 
              antialias: true,
              powerPreference: 'high-performance',
              precision: 'mediump' // Use medium precision for better performance
            }}
            dpr={[1, 1.5]} // Limit pixel ratio for better performance
            performance={{ min: 0.5 }} // Add performance optimization
          >
            <PerspectiveCamera 
              makeDefault 
              position={[0, 30, 60]} 
              fov={50}
              near={0.1}
              far={1000}
            />
            <ambientLight intensity={0.2} />
            <directionalLight
              castShadow={false} // Disable shadow casting for better performance
              position={[10, 20, 10]}
              intensity={1.5}
              shadow-mapSize-width={512} // Reduced from 1024 to 512
              shadow-mapSize-height={512} // Reduced from 1024 to 512
            />
            <Sun />
            <OrbitPath eccentricity={eccentricity} />
            <OrbitingEarth
              eccentricity={eccentricity}
              axialTilt={axialTilt}
              precession={precession}
              temperature={calculatedTemp}
              iceFactor={iceFactor}
              normTemp={displayedTemp}
            />
            <AxisIndicators axialTilt={axialTilt} precession={precession} />
            <OrbitControls 
              enableDamping={true}
              dampingFactor={0.05}
              minDistance={20}
              maxDistance={100}
              enablePan={true}
              enableZoom={true}
              zoomSpeed={0.8}
              rotateSpeed={0.5}
              minPolarAngle={Math.PI * 0.1}
              maxPolarAngle={Math.PI * 0.9}
              enableTouchRotate={!isPaused && isMobile}
              enableTouchZoom={!isPaused && isMobile}
              enableTouchPan={!isPaused && isMobile}
              touchRotateSpeed={0.5}
              touchZoomSpeed={1.5}
            />
            <SceneEffects />
            <CosmicParticles />
          </Canvas>
        </Suspense>
      </div>
      
      {/* Only render UI components after mounted to avoid hydration mismatch */}
      {mounted && (
        <>
          {/* Intro Overlay - positioned at the top level to work for both mobile and desktop */}
          {showIntro && (
            <IntroOverlay 
              onClose={() => setShowIntro(false)} 
              onComplete={handleIntroComplete} 
            />
          )}
        
          {/* Desktop UI Layout */}
          <DesktopOnlyView>
            {/* About button in top right corner */}
            <div className="fixed right-5 top-5 z-50 animate-fadeIn">
              <ObservatoryButton
                className="flex items-center space-x-2"
                aria-label="About the Project"
              >
                <Link href="/about" className="w-full text-center">
                  About
                </Link>
              </ObservatoryButton>
            </div>
            
            {/* Left Panel Group with enhanced positioning and animations */}
            <div className="fixed left-5 top-5 space-y-4 w-[400px] z-20 animate-fadeIn">
              <ObservatoryPanel
                variant="control"
                title="Orbital Parameters"
                className="w-full"
                id="orbital-parameters"
              >
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
                    const deltaEcc = value - baselineEccentricity;
                    setParameterPreview(realisticAmsterdamTemp + deltaEcc * 100);
                    
                    // Add visual feedback with simplified orbit shape
                    const feedbackEl = document.createElement('div');
                    feedbackEl.className = 'parameter-change-indicator';
                    
                    // Create simplified SVG for changing orbit
                    feedbackEl.innerHTML = `
                      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="40" cy="40" rx="35" ry="${35 * Math.sqrt(1 - value * value)}" 
                          fill="none" stroke="${value > eccentricity ? '#ff6464' : '#64c8ff'}" 
                          stroke-width="3" />
                        <circle cx="40" cy="40" r="5" fill="${value > eccentricity ? '#ff6464' : '#64c8ff'}" />
                      </svg>
                    `;
                    
                    document.body.appendChild(feedbackEl);
                    setTimeout(() => document.body.removeChild(feedbackEl), 800);
                  }}
                  onAxialTiltChange={(value) => {
                    setAxialTilt(value);
                    setAutoAnimate(false);
                    const deltaTilt = value - baselineAxialTilt;
                    setParameterPreview(realisticAmsterdamTemp + deltaTilt * 2);
                    
                    // Add visual feedback with simplified Earth tilt
                    const feedbackEl = document.createElement('div');
                    feedbackEl.className = 'parameter-change-indicator';
                    
                    // Create simplified SVG for tilted Earth
                    feedbackEl.innerHTML = `
                      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="40" cy="40" r="30" fill="${value > axialTilt ? '#ff6464' : '#64c8ff'}" opacity="0.7" />
                        <line x1="40" y1="10" x2="40" y2="70" stroke="#ffffff" stroke-width="2" 
                          transform="rotate(${value > axialTilt ? value - axialTilt : axialTilt - value}, 40, 40)" />
                        <text x="40" y="40" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="20">
                          ${value > axialTilt ? '↗' : '↙'}
                        </text>
                      </svg>
                    `;
                    
                    document.body.appendChild(feedbackEl);
                    setTimeout(() => document.body.removeChild(feedbackEl), 800);
                  }}
                  onPrecessionChange={(value) => {
                    setPrecession(value);
                    setAutoAnimate(false);
                    const deltaPrecession = Math.sin(
                      THREE.MathUtils.degToRad(value - baselinePrecession)
                    );
                    setParameterPreview(realisticAmsterdamTemp + deltaPrecession * 5);
                    
                    // Simple text-based feedback
                    const feedbackEl = document.createElement('div');
                    feedbackEl.className = 'parameter-change-indicator';
                    feedbackEl.textContent = '↻';
                    feedbackEl.style.color = '#c8c864';
                    
                    document.body.appendChild(feedbackEl);
                    setTimeout(() => document.body.removeChild(feedbackEl), 800);
                  }}
                />
              </ObservatoryPanel>

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

            {/* Right Panel Group */}
            <div className="fixed right-5 top-5 space-y-4 w-[400px] z-20 animate-fadeIn">
              {/* Time Controls Panel */}
              <ObservatoryPanel 
                title="Time Controls" 
                variant="control"
                glowing={timeControlsHovered}
                className="w-full"
                id="time-controls"
                onMouseEnter={() => setTimeControlsHovered(true)}
                onMouseLeave={() => setTimeControlsHovered(false)}
              >
                <div className="space-y-6">
                  <ObservatoryButton
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="w-full"
                    variant="primary"
                  >
                    {isPaused ? "Play" : "Pause"}
                  </ObservatoryButton>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-stardust-white">Simulation Speed</span>
                      <span className="text-sm font-mono text-pale-gold">{formatNumber(timeScale)}</span>
                    </div>
                    <input
                      type="range"
                      value={Math.log10(timeScale) * 100}
                      onChange={(e) => {
                        const logValue = parseFloat(e.target.value) / 100;
                        const newValue = Math.pow(10, logValue);
                        setTimeScale(newValue);
                      }}
                      min={-300}
                      max={600}
                      step={10}
                      className="celestial-slider w-full"
                      onTouchStart={handleSliderTouchStart}
                      onTouchEnd={handleSliderTouchEnd}
                    />
                    <div className="flex justify-between text-xs text-stardust-white opacity-60">
                      <span>Slower</span>
                      <span>Faster</span>
                    </div>
                  </div>
                </div>
              </ObservatoryPanel>

              {/* Preset Scenarios Panel */}
              <ObservatoryPanel
                title="Historical Scenarios"
                variant="info"
                className="w-full"
                id="historical-scenarios"
                collapsible={true}
                initialCollapsed={false}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1">
                    {Object.entries(presets).map(([name, config]) => (
                      <ObservatoryButton
                        key={name}
                        variant="default"
                        className="text-xs py-1 px-2 text-center h-auto"
                        onClick={() => {
                          setPreset(name);
                          setEccentricity(config.eccentricity);
                          setAxialTilt(config.axialTilt);
                          setPrecession(config.precession);
                          setAutoAnimate(false);
                        }}
                      >
                        {name.split(' ')[0]} <span className="opacity-80">{name.split(' ')[1]}</span>
                      </ObservatoryButton>
                    ))}
                  </div>
                  
                  {preset && presets[preset] && (
                    <div className="animate-fadeIn">
                      <p className="text-xs text-stardust-white opacity-80 leading-tight">
                        {presets[preset].description}
                      </p>
                      <div className="text-xs text-pale-gold mt-1">
                        Year: {formatNumber(presets[preset].year)}
                      </div>
                    </div>
                  )}
                </div>
              </ObservatoryPanel>

              {/* Climate Data Panel */}
              <ObservatoryPanel
                variant="data"
                title="Climate Data"
                className="w-full"
                id="climate-data"
              >
                <GlobalTemperatureGraph
                  axialTilt={axialTilt}
                  eccentricity={eccentricity}
                  precession={precession}
                  temperature={displayedTemp}
                  iceFactor={iceFactor}
                  co2Level={co2Level}
                  simulatedYear={simulatedYear}
                  formatNumber={formatNumber}
                  style={{ width: "100%", height: "300px" }}
                />
              </ObservatoryPanel>
            </div>
          </DesktopOnlyView>
          
          {/* Mobile UI Layout */}
          <MobileOnlyView>
            {/* Mobile Navigation Menu */}
            <MobileNavigation menuRef={mobileMenuRef}>
              <div className="px-4 py-2 border-b border-slate-blue border-opacity-20">
                <h2 className="text-xl font-serif mb-1">Milanković Cycles</h2>
                <p className="text-sm opacity-70">Climate Model Visualization</p>
              </div>
              
              <MobileControlGroup title="Information">
                <ObservatoryButton 
                  variant="mobile" 
                  className="w-full justify-start"
                  onClick={() => setShowTour(true)}
                >
                  How to Use
                </ObservatoryButton>
                <ObservatoryButton 
                  variant="mobile" 
                  className="w-full justify-start"
                >
                  <Link href="/about" className="w-full text-left">
                    About the Project
                  </Link>
                </ObservatoryButton>
              </MobileControlGroup>
              
              <MobileControlGroup title="Preset Scenarios">
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(presets).map(([name, config]) => (
                    <ObservatoryButton
                      key={name}
                      variant="mobile"
                      className="text-[10px] py-1 px-1 text-center h-auto flex flex-col items-center justify-center"
                      onClick={(e) => {
                        setPreset(name);
                        setEccentricity(config.eccentricity);
                        setAxialTilt(config.axialTilt);
                        setPrecession(config.precession);
                        setAutoAnimate(false);
                        
                        // Close the mobile menu using direct DOM manipulation
                        const mobileMenu = document.querySelector('.mobile-menu');
                        if (mobileMenu) {
                          mobileMenu.classList.remove('open');
                        }
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPreset(name);
                        setEccentricity(config.eccentricity);
                        setAxialTilt(config.axialTilt);
                        setPrecession(config.precession);
                        setAutoAnimate(false);
                        
                        // Close the mobile menu using direct DOM manipulation
                        const mobileMenu = document.querySelector('.mobile-menu');
                        if (mobileMenu) {
                          mobileMenu.classList.remove('open');
                        }
                      }}
                    >
                      <span className="font-medium leading-tight">{name.split(' ')[0]}</span>
                      <span className="leading-tight text-[8px]">{name.split(' ')[1]}</span>
                    </ObservatoryButton>
                  ))}
                </div>
                
                {preset && presets[preset] && (
                  <div className="mt-2 p-1 bg-deep-space bg-opacity-40 rounded-md text-[10px]">
                    <p className="text-stardust-white opacity-80 leading-tight">
                      {presets[preset].description}
                    </p>
                  </div>
                )}
              </MobileControlGroup>
            </MobileNavigation>
            
            {/* Improved Mobile Bottom Sheet */}
            <BottomSheet title="Simulation Controls">
              <div className="space-y-4">
                {/* Play/Pause and Speed Controls */}
                <div className="flex items-center space-x-3">
                  <ObservatoryButton
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="flex-shrink-0"
                    variant="primary"
                  >
                    {isPaused ? "Play" : "Pause"}
                  </ObservatoryButton>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-stardust-white">Speed</span>
                      <span className="text-xs font-mono text-pale-gold">{formatNumber(timeScale)}</span>
                    </div>
                    <input
                      type="range"
                      value={Math.log10(timeScale) * 100}
                      onChange={(e) => {
                        const logValue = parseFloat(e.target.value) / 100;
                        const newValue = Math.pow(10, logValue);
                        setTimeScale(newValue);
                      }}
                      min={-300}
                      max={600}
                      step={10}
                      className="celestial-slider w-full"
                      onTouchStart={handleSliderTouchStart}
                      onTouchEnd={handleSliderTouchEnd}
                    />
                  </div>
                </div>
                
                {/* Parameter Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-stardust-white">Eccentricity</span>
                      <span className="text-xs font-mono text-pale-gold">{eccentricity.toFixed(4)}</span>
                    </div>
                    <input
                      type="range"
                      value={eccentricity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setEccentricity(value);
                        setAutoAnimate(false);
                      }}
                      min={0}
                      max={0.1}
                      step={0.001}
                      className="celestial-slider w-full"
                      onTouchStart={handleSliderTouchStart}
                      onTouchEnd={handleSliderTouchEnd}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-stardust-white">Axial Tilt</span>
                      <span className="text-xs font-mono text-pale-gold">{axialTilt.toFixed(1)}°</span>
                    </div>
                    <input
                      type="range"
                      value={axialTilt}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setAxialTilt(value);
                        setAutoAnimate(false);
                      }}
                      min={0}
                      max={45}
                      step={0.5}
                      className="celestial-slider w-full"
                      onTouchStart={handleSliderTouchStart}
                      onTouchEnd={handleSliderTouchEnd}
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-stardust-white">Precession</span>
                      <span className="text-xs font-mono text-pale-gold">{precession.toFixed(0)}°</span>
                    </div>
                    <input
                      type="range"
                      value={precession}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setPrecession(value);
                        setAutoAnimate(false);
                      }}
                      min={0}
                      max={360}
                      step={1}
                      className="celestial-slider w-full"
                      onTouchStart={handleSliderTouchStart}
                      onTouchEnd={handleSliderTouchEnd}
                    />
                  </div>
                </div>
                
                {/* Temperature Display */}
                <div className="bg-deep-space bg-opacity-40 p-2 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stardust-white">Global Temperature</span>
                    <span className="text-lg font-mono text-pale-gold">{displayedTemp.toFixed(1)}°C</span>
                  </div>
                  <div className="w-full h-2 bg-slate-blue bg-opacity-30 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{
                        width: `${normalizeTemperature(displayedTemp, -30, 30) * 100}%`,
                        background: `linear-gradient(90deg, rgb(100, 200, 255) 0%, rgb(200, 200, 100) 50%, rgb(255, 100, 100) 100%)`
                      }}
                    />
                  </div>
                </div>
                
                {/* Reset Button */}
                <ObservatoryButton
                  onClick={() => {
                    setEccentricity(baselineEccentricity);
                    setAxialTilt(baselineAxialTilt);
                    setPrecession(baselinePrecession);
                    setAutoAnimate(false);
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Reset to Default Parameters
                </ObservatoryButton>
              </div>
            </BottomSheet>
          </MobileOnlyView>
        </>
      )}
      
      {/* Help button in bottom right */}
      <div className="fixed bottom-5 right-5 z-30 flex space-x-2">
        <ObservatoryButton
          onClick={() => setShowKeyboardShortcuts(prev => !prev)}
          variant="ghost"
          className="flex items-center space-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <path d="M6 8h.01"></path>
            <path d="M10 8h.01"></path>
            <path d="M14 8h.01"></path>
            <path d="M18 8h.01"></path>
            <path d="M8 12h.01"></path>
            <path d="M12 12h.01"></path>
            <path d="M16 12h.01"></path>
            <path d="M7 16h10"></path>
          </svg>
          <span>Shortcuts</span>
        </ObservatoryButton>
        <TourButton onClick={() => setShowTour(true)} />
      </div>
      
      {/* Keyboard Shortcuts Panel */}
      {showKeyboardShortcuts && (
        <div className="fixed bottom-20 right-5 z-30 w-80 bg-deep-space bg-opacity-95 border border-aged-copper rounded-md p-4 shadow-lg backdrop-blur-md animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-serif text-pale-gold">Keyboard Shortcuts</h3>
            <button 
              onClick={() => setShowKeyboardShortcuts(false)}
              className="text-stardust-white opacity-70 hover:opacity-100"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2">
            {keyboardShortcuts.map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <kbd className="px-2 py-1 bg-slate-blue bg-opacity-30 rounded text-xs text-stardust-white border border-slate-blue">
                  {shortcut.key}
                </kbd>
                <span className="text-sm text-stardust-white">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Guided Tour */}
      <GuidedTour 
        steps={tourSteps}
        currentStep={currentTourStep}
        onNext={() => setCurrentTourStep(prev => Math.min(prev + 1, tourSteps.length - 1))}
        onPrev={() => setCurrentTourStep(prev => Math.max(prev - 1, 0))}
        onClose={() => {
          setShowTour(false);
          setCurrentTourStep(0);
        }}
        isOpen={showTour}
      />
    </main>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Sun
// ------------------------------------------------------------------
function Sun() {
  const sunRef = useRef();
  const lensFlareRef = useRef();

  useFrame(({ clock }) => {
    if (sunRef.current) {
      sunRef.current.material.uniforms.time.value = clock.getElapsedTime() * 0.2;
    }
  });

  const sunShader = {
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      // Simplified noise function for better performance
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec3 baseColor = vec3(1.0, 0.6, 0.1);
        vec3 hotColor = vec3(1.0, 0.9, 0.4);
        
        vec2 uv = vUv;
        float t = time * 0.1;
        
        // Simplified pattern calculation
        float pattern = hash(uv * 8.0 + vec2(t * 0.5, t * 0.7));
        
        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        
        vec3 color = mix(baseColor, hotColor, pattern);
        
        float pulse = sin(time * 0.5) * 0.05 + 0.95;
        color *= pulse;
        
        color += hotColor * fresnel * 0.5;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  };

  const LensFlareSystem = () => {
    const flareTexture = useMemo(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 128; // Reduced from 256 to 128
      canvas.height = 128; // Reduced from 256 to 128
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      gradient.addColorStop(0.1, "rgba(255, 230, 190, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 150, 50, 0.3)");
      gradient.addColorStop(1, "rgba(255, 100, 50, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }, []);

    return (
      <group ref={lensFlareRef} position={[0, 0, 0]}>
        <sprite position={[0, 0, 0]} scale={[2, 2, 2]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.6}
            color={0xffbb77}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite position={[0, 0, -0.2]} scale={[5, 5, 5]}>
          <spriteMaterial
            attach="material"
            map={flareTexture}
            transparent
            opacity={0.4}
            color={0xff6622}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      </group>
    );
  };

  return (
    <group>
      <pointLight
        position={[0, 0, 0]}
        intensity={2}
        color={0xffffee}
        distance={100}
        decay={1.5}
        castShadow={false} // Disabled shadow casting for better performance
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[1, 32, 32]} /> 
        {/* Reduced geometry complexity from default to 32 segments */}
        <shaderMaterial
          args={[sunShader]}
          uniforms={sunShader.uniforms}
        />
      </mesh>
      <LensFlareSystem />
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: SceneEffects
// ------------------------------------------------------------------
function SceneEffects() {
  const depthOfFieldRef = useRef();

  useFrame((state) => {
    if (depthOfFieldRef.current) {
      const focusDistance = Math.abs(state.camera.position.z) * 0.75;
      depthOfFieldRef.current.focusDistance = focusDistance;
    }
  });

  return (
    <EffectComposer multisampling={4}>
      {/* Reduced multisampling from 8 to 4 */}
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={0.5} 
        /* Reduced opacity from 1 to 0.5 */
      />
      <Vignette
        offset={0.5}
        darkness={0.4} 
        /* Reduced darkness from 0.5 to 0.4 */
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
      <ToneMapping
        adaptive={true}
        resolution={128} 
        /* Reduced resolution from 256 to 128 */
        middleGrey={0.8}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
      />
    </EffectComposer>
  );
}

// ------------------------------------------------------------------
// COMPONENT: AtmosphericBackground (FIXED VERSION)
// ------------------------------------------------------------------

function AtmosphericBackground() {
  const meshRef = useRef();

  // Animate the background
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  // A darker, more muted color palette
  const colors = {
    background1: new THREE.Color("#191b20"), // near-black charcoal
    background2: new THREE.Color("#1f2228"), // slightly lighter charcoal
    highlight1: new THREE.Color("pink"), // subtle, cool mid-tone
    highlight2: new THREE.Color("red"), // mild, greyish highlight
  };

  // Create your custom shader
  const shader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: colors.background1 },
        uColor2: { value: colors.background2 },
        uHighlight1: { value: colors.highlight1 },
        uHighlight2: { value: colors.highlight2 },
      },
      vertexShader: `
        uniform float uTime;
        
        // Simple 2D noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p){
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
            mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y
          );
        }

        // Fractional Brownian motion for smooth displacement
        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(st * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          return value;
        }
        
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          vUv = uv;
          
          // Base vertex position
          vec3 newPosition = position;
          
          // More subdued amplitude for the wave
          float displacement = fbm(uv * 2.0 + uTime * 0.1) * 0.05;
          newPosition.z += displacement;
          
          // Pass displacement to the fragment for coloring
          vElevation = displacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uHighlight1;
        uniform vec3 uHighlight2;
        
        varying vec2 vUv;
        varying float vElevation;
        
        void main() {
          // Radial-ish gradient based on distance from center
          vec2 center = vec2(0.5, 0.5);
          float distToCenter = distance(vUv, center);
          
          // Blend between two background colors
          float gradient = smoothstep(0.0, 1.2, distToCenter * 1.2);
          vec3 baseColor = mix(uColor1, uColor2, gradient);
          
          // Use the displacement to mix in a subtle highlight
          // Keeping it toned down
          float highlightFactor = clamp(vElevation * 10.0, 0.0, 1.0);
          vec3 highlightColor = mix(uHighlight1, uHighlight2, highlightFactor);
          
          // Weighted softly so it doesn't overpower
          vec3 finalColor = mix(baseColor, highlightColor, highlightFactor * 0.2);
          
          // Vignette near edges
          float edgeDist = distance(vUv, vec2(0.5));
          float vignette = smoothstep(0.3, 0.8, edgeDist);
          finalColor = mix(finalColor, finalColor * 0.6, vignette * 0.4);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    };
  }, [colors]);

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, -200]} /* push it far behind your scene objects */
      rotation={[0, 0, 0]}
    >
      {/* Make the plane large so it covers the entire camera view. */}
      <planeGeometry args={[3000, 3000, 150, 150]} />
      <shaderMaterial
        attach="material"
        args={[shader]}
        side={THREE.DoubleSide}
        transparent={false}
      />
    </mesh>
  );
}

// ------------------------------------------------------------------
// COMPONENT: CosmicParticles
// ------------------------------------------------------------------
function CosmicParticles() {
  const particlesRef = useRef();
  // Reduce particle count from 2000 to 1000 for better performance
  const count = 1000;
  const mouse = useRef({ x: 0, y: 0 });
  const targetMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      targetMouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.05;
    mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.05;
  });

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const size = Math.random() * 0.08 + 0.02;
      const factor = size * 0.8;
      const speed = Math.random() * 0.01 + 0.002;
      const x = (Math.random() - 0.5) * 60;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      const mouseRange = Math.random() * 20 + 10;
      const mouseStrength = Math.random() * 0.1 + 0.05;
      let starType = Math.random();
      let color;
      if (starType < 0.1) color = new THREE.Color(0x4a88ff);
      else if (starType < 0.3) color = new THREE.Color(0xe8f1ff);
      else if (starType < 0.6) color = new THREE.Color(0xfff4d2);
      else if (starType < 0.8) color = new THREE.Color(0xffc982);
      else color = new THREE.Color(0xff8a61);

      temp.push({
        size,
        factor,
        speed,
        x,
        y,
        z,
        color,
        mouseRange,
        mouseStrength,
        mx: 0,
        my: 0,
        mz: 0,
        originalX: x,
        originalY: y,
        originalZ: z,
      });
    }
    return temp;
  }, [count]);

  // Optimize frame update by using a throttled update frequency
  const frameCount = useRef(0);
  const updateFrequency = 2; // Only update every 2 frames

  useFrame(({ clock, camera }) => {
    frameCount.current += 1;
    
    // Skip updates to reduce CPU load
    if (frameCount.current % updateFrequency !== 0) return;
    
    const elapsedTime = clock.getElapsedTime();
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      const scales = particlesRef.current.geometry.attributes.scale.array;
      const colors = particlesRef.current.geometry.attributes.color.array;

      particles.forEach((p, i) => {
        let {
          originalX,
          originalY,
          originalZ,
          factor,
          speed,
          color,
          mouseRange,
          mouseStrength,
        } = p;

        const mouseX = mouse.current.x * 30;
        const mouseY = mouse.current.y * 15;
        const dx = originalX - mouseX;
        const dy = originalY - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let mouseInfluence = 0;
        if (dist < mouseRange) {
          mouseInfluence = (1 - dist / mouseRange) * mouseStrength;
        }

        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * mouseInfluence * mouseRange;
        const pushY = Math.sin(angle) * mouseInfluence * mouseRange;

        const ix = i * 3;
        positions[ix] =
          originalX + Math.sin(elapsedTime * speed + i * 0.1) * factor + pushX;
        positions[ix + 1] =
          originalY + Math.cos(elapsedTime * speed + i * 0.2) * factor + pushY;
        positions[ix + 2] =
          originalZ + Math.sin(elapsedTime * speed + i * 0.3) * factor * 0.5;

        const twinkle = Math.sin(elapsedTime * 2 + i) * 0.3 + 0.7;
        const glow = mouseInfluence > 0 ? 1 + mouseInfluence * 2 : 1;
        scales[i] = p.size * twinkle * glow;

        // Simplified color update logic
        if (mouseInfluence > 0) {
          colors[ix] = Math.max(0, Math.min(1, color.r - mouseInfluence * 0.1));
          colors[ix + 1] = Math.max(0, Math.min(1, color.g + mouseInfluence * 0.05));
          colors[ix + 2] = Math.max(0, Math.min(1, color.b + mouseInfluence * 0.25));
        } else {
          colors[ix] = color.r;
          colors[ix + 1] = color.g;
          colors[ix + 2] = color.b;
        }
      });

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.geometry.attributes.scale.needsUpdate = true;
      particlesRef.current.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={particles.length}
          array={new Float32Array(particles.length)}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        attach="material"
        vertexShader={`
          attribute float scale;
          attribute vec3 color;
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = scale * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          
          void main() {
            float r = 2.0 * length(gl_PointCoord - vec2(0.5));
            float intensity = 0.9 * (1.0 - smoothstep(0.45, 1.0, r));
            float highlight = 1.0 - smoothstep(0.0, 0.2, r);
            intensity += highlight * 0.3;
            if (intensity < 0.1) discard;
            gl_FragColor = vec4(vColor, intensity);
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
