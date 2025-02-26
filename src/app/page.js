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
} from "@/components/ObservatoryPanel";
import { CycleComparisonPanel } from "@/components/CycleComparisonPanel";
import { NarrativeOverlay } from "@/components/NarrativeOverlay";
import { SeasonalInsolationGraph } from "@/components/SeasonalInsolationGraph";
import { LatitudinalInsolationGraph } from "@/components/LatitudinalInsolationGraph";
import { TemperatureTimeline } from "@/components/TemperatureTimeline";

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
          <sphereGeometry args={[1, 64, 64]} />
          <shaderMaterial
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
            uniforms={uniforms}
            transparent={true}
          />
        </mesh>

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

        <mesh scale={1.03}>
          <sphereGeometry args={[1, 64, 64]} />
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
  const baselineAxialTilt = 23.44;
  const baselinePrecession = 0;
  const realisticAmsterdamTemp = 10;
  const sensitivity = 60;

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

  const presets = {
    "Last Glacial Maximum (21,000 BP)": {
      eccentricity: 0.019,
      axialTilt: 22.99,
      precession: 114,
      description:
        "Peak of last ice age with extensive ice sheets. Northern Hemisphere summers occurred near aphelion, minimizing summer insolation.",
      year: -21000,
    },
    "Mid-Holocene Optimum (6,000 BP)": {
      eccentricity: 0.0187,
      axialTilt: 24.1,
      precession: 303,
      description:
        "Warm period with enhanced seasonal contrasts. Northern Hemisphere summers near perihelion maximized summer insolation.",
      year: -6000,
    },
    "Mid-Pleistocene Transition (800,000 BP)": {
      eccentricity: 0.043,
      axialTilt: 22.3,
      precession: 275,
      description:
        "Transition period when glacial cycles shifted from 41,000-year to 100,000-year periods.",
      year: -800000,
    },
    "PETM (56 Million BP)": {
      eccentricity: 0.052,
      axialTilt: 23.8,
      precession: 180,
      description:
        "Paleocene-Eocene Thermal Maximum - extreme global warming event with high CO2 levels.",
      year: -56000000,
    },
    "Future Configuration (50,000 AP)": {
      eccentricity: 0.015,
      axialTilt: 23.2,
      precession: 90,
      description:
        "Projected orbital configuration showing reduced seasonal contrasts.",
      year: 50000,
    },
  };
  const [preset, setPreset] = useState("");

  const [co2Level, setCo2Level] = useState(280);
  const [showIntro, setShowIntro] = useState(false);
  const [hasIntroFadedOut, setHasIntroFadedOut] = useState(true);

  const [displayedTemp, setDisplayedTemp] = useState(realisticAmsterdamTemp);
  const [parameterPreview, setParameterPreview] = useState(null);
  const [calculatedTemp, setCalculatedTemp] = useState(realisticAmsterdamTemp);

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
      if (!isPaused) {
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

  const normTemp = normalizeTemperature(calculatedTemp, 0, 15);

  const handleIntroComplete = () => {
    setShowIntro(false);
    setTimeout(() => {
      setHasIntroFadedOut(true);
    }, 1000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-gradient">
      {showIntro ? (
        <IntroOverlay
          onStart={() => {
            setShowIntro(false);
            setTimeout(() => setHasIntroFadedOut(true), 1000);
          }}
        />
      ) : (
        <>
          <div className="canvas-container">
            <Canvas
              camera={{ position: [0, 20, 40], fov: 45 }}
              dpr={[1, 2]}
              performance={{ min: 0.5 }}
              gl={{ antialias: true, alpha: true }}
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
                temperature={calculatedTemp}
                iceFactor={iceFactor}
                normTemp={displayedTemp}
              />
              <AxisIndicators axialTilt={axialTilt} precession={precession} />
              <OrbitControls />
              <SceneEffects />

                {/* FIXED ATMOSPHERIC BACKGROUND */}
                {/* <Billboard> */}
                  {/* <AtmosphericBackground />  */}
                {/* </Billboard> */}

              <CosmicParticles />
            </Canvas>
          </div>

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
                const deltaEcc = value - baselineEccentricity;
                setParameterPreview(realisticAmsterdamTemp + deltaEcc * 100);
              }}
              onAxialTiltChange={(value) => {
                setAxialTilt(value);
                setAutoAnimate(false);
                const deltaTilt = value - baselineAxialTilt;
                setParameterPreview(realisticAmsterdamTemp + deltaTilt * 2);
              }}
              onPrecessionChange={(value) => {
                setPrecession(value);
                setAutoAnimate(false);
                const deltaPrecession = Math.sin(
                  THREE.MathUtils.degToRad(value - baselinePrecession)
                );
                setParameterPreview(
                  realisticAmsterdamTemp + deltaPrecession * 5
                );
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

          <div className="fixed right-5 top-5 space-y-4 w-[400px] z-20 animate-fadeIn">
            <ObservatoryPanel
              title="Time Controls"
              variant="control"
              glowing={timeControlsHovered}
              className="w-full"
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
                    <span className="text-sm text-stardust-white">
                      Simulation Speed
                    </span>
                    <span className="text-sm font-mono text-pale-gold">
                      {formatNumber(timeScale)}
                    </span>
                  </div>
                  <input
                    type="range"
                    value={timeScale}
                    onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                    min={0.001}
                    max={1000000}
                    step={100}
                    className="celestial-slider w-full"
                  />
                </div>
              </div>
            </ObservatoryPanel>

            <ObservatoryPanel
              title="Historical Scenarios"
              variant="info"
              glowing={scenariosHovered}
              className="w-full"
              onMouseEnter={() => setScenariosHovered(true)}
              onMouseLeave={() => setScenariosHovered(false)}
            >
              <div className="space-y-4">
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
                    className="w-full bg-deep-space bg-opacity-40 text-stardust-white border border-slate-blue border-opacity-30 rounded-lg px-4 py-2 appearance-none hover:border-antique-brass transition-colors duration-200 focus:outline-none focus:border-antique-brass"
                  >
                    <option value="">Select a scenario...</option>
                    {Object.entries(presets).map(([name]) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-stardust-white opacity-60"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {preset && presets[preset] && (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-sm text-stardust-white opacity-80 leading-relaxed">
                      {presets[preset].description}
                    </p>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <DataDisplay
                        label="Eccentricity"
                        value={presets[preset].eccentricity.toFixed(4)}
                      />
                      <DataDisplay
                        label="Axial Tilt"
                        value={presets[preset].axialTilt.toFixed(1)}
                        unit="°"
                      />
                      <DataDisplay
                        label="Precession"
                        value={presets[preset].precession.toFixed(0)}
                        unit="°"
                      />
                    </div>
                  </div>
                )}
              </div>
            </ObservatoryPanel>
          </div>

          <div className="fixed flex justify-center items-center w-[620px] h-[200px] bottom-5 right-5 animate-fadeIn">
            <ObservatoryPanel
              variant="data"
              className="w-full h-full p-0 overflow-hidden"
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
                style={{
                  width: "100%",
                  height: "100%",
                }}
              />
            </ObservatoryPanel>
          </div>
          <div className="fixed bottom-0 left-0 flex justify-center items-center w-[620px] h-[190px] animate-fadeIn">
            <ObservatoryPanel
              variant="data"
              className="w-full h-full p-0 overflow-hidden"
            >
              <SeasonalInsolationGraph
                axialTilt={axialTilt}
                eccentricity={eccentricity}
                precession={precession}
                style={{
                  zIndex: 10,
                  width: "100%",
                  height: "100%",
                }}
              />
            </ObservatoryPanel>
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Sun
// ------------------------------------------------------------------
function Sun() {
  const sunRef = useRef();
  const lensFlareRef = useRef();
  const coronaRef = useRef();

  useFrame(({ clock, camera }) => {
    const elapsedTime = clock.getElapsedTime();

    if (sunRef.current) {
      const pulseFactor = 1.0 + Math.sin(elapsedTime * 0.2) * 0.02;
      sunRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
      sunRef.current.rotation.y = elapsedTime * 0.05;
      if (sunRef.current.material.uniforms) {
        sunRef.current.material.uniforms.time.value = elapsedTime;
      }
    }

    if (coronaRef.current) {
      coronaRef.current.rotation.z = elapsedTime * -0.1;
      coronaRef.current.lookAt(camera.position);
    }

    if (lensFlareRef.current) {
      lensFlareRef.current.lookAt(camera.position);
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
      
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 5; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }
      
      void main() {
        vec3 baseColor = vec3(1.0, 0.6, 0.1);
        vec3 hotColor = vec3(1.0, 0.9, 0.4);
        vec3 coolColor = vec3(0.8, 0.3, 0.0);
        
        vec2 uv = vUv;
        float t = time * 0.1;
        
        float noise1 = fbm(uv * 8.0 + vec2(t * 0.5, 0.0));
        float noise2 = fbm(uv * 5.0 + vec2(0.0, t * 0.7) + noise1 * 0.5);
        float noise3 = fbm(uv * 3.0 + vec2(t * 0.3, t * 0.4) + noise2 * 0.5);
        
        float cells = fbm(uv * 15.0 + vec2(t * 0.2, t * 0.1));
        cells = smoothstep(0.3, 0.7, cells);
        
        float pattern = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
        
        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        
        vec3 color = mix(coolColor, hotColor, pattern);
        color = mix(color, hotColor * 1.2, cells * 0.3);
        
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
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
      gradient.addColorStop(0.1, "rgba(255, 230, 190, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 150, 50, 0.3)");
      gradient.addColorStop(1, "rgba(255, 100, 50, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);

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

  const SolarCorona = () => {
    const coronaTexture = useMemo(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      const gradient = ctx.createRadialGradient(256, 256, 100, 256, 256, 256);
      gradient.addColorStop(0, "rgba(255, 200, 120, 0.5)");
      gradient.addColorStop(0.3, "rgba(255, 150, 50, 0.3)");
      gradient.addColorStop(0.7, "rgba(255, 100, 30, 0.1)");
      gradient.addColorStop(1, "rgba(255, 50, 0, 0.0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = "rgba(255, 220, 180, 0.15)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const length = 150 + Math.random() * 100;
        ctx.beginPath();
        ctx.moveTo(256 + Math.cos(angle) * 100, 256 + Math.sin(angle) * 100);
        ctx.lineTo(
          256 + Math.cos(angle) * length,
          256 + Math.sin(angle) * length
        );
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }, []);

    return (
      <group ref={coronaRef} position={[0, 0, 0]}>
        <sprite scale={[4, 4, 4]}>
          <spriteMaterial
            attach="material"
            map={coronaTexture}
            transparent
            opacity={0.7}
            color={0xffaa77}
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
        castShadow
      />
      <pointLight
        position={[0, 0, 0]}
        intensity={1.5}
        color={0xff9933}
        distance={20}
        decay={2}
      />
      <mesh ref={sunRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial args={[sunShader]} uniforms={sunShader.uniforms} />
      </mesh>
      <SolarCorona />
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
    <EffectComposer multisampling={8}>
      {/* <SSAO
        samples={21}
        radius={7}
        intensity={20}
        luminanceInfluence={0.6}
        color="black"
      /> */}
      {/* <Bloom
        intensity={1.0}
        luminanceThreshold={0.45}
        luminanceSmoothing={0.9}
        height={300}
        opacity={0.8}
      /> */}
      {/* <DepthOfField
        ref={depthOfFieldRef}
        focusDistance={0.02}
        focalLength={0.12}
        bokehScale={6}
        height={480}
      /> */}
      <Noise
        premultiply
        blendFunction={BlendFunction.SOFT_LIGHT}
        opacity={1}
      />
      <Vignette
        offset={0.5}
        darkness={0.5}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
      {/* <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.0012, 0.0012]}
        radialModulation={true}
        modulationOffset={0.15}
      /> */}
      <ToneMapping
        adaptive={true}
        resolution={256}
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
            mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x),
            u.y
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
        depthWrite={false}
      />
    </mesh>
  );
}

// ------------------------------------------------------------------
// COMPONENT: CosmicParticles
// ------------------------------------------------------------------
function CosmicParticles() {
  const particlesRef = useRef();
  const count = 2000;
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

  useFrame(({ clock, camera }) => {
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

        if (mouseInfluence > 0) {
          const blueShift = mouseInfluence * 0.5;
          const enhancedColor = new THREE.Color().copy(color);
          enhancedColor.r = Math.max(0, Math.min(1, color.r - blueShift * 0.2));
          enhancedColor.g = Math.max(0, Math.min(1, color.g + blueShift * 0.1));
          enhancedColor.b = Math.max(0, Math.min(1, color.b + blueShift * 0.5));

          colors[ix] = enhancedColor.r;
          colors[ix + 1] = enhancedColor.g;
          colors[ix + 2] = enhancedColor.b;
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
