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
            3,
            0x00ffcc, // Neon cyan for high visual contrast
            0.5,
            0.3
          )
        }
        ref={arrowRef}
      />
      <Html position={[0, 3.2, 0]} center>
        <div
          style={{
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "'Courier New', Courier, monospace", // Retro typewriter feel
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
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
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
    
    // Amplify tint based on temperature:
    // Cooler temperatures lean toward blue, warmer toward red.
    vec3 tint = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), temperature);
    color.rgb = mix(color.rgb, tint, 0.4);
    
    // Dynamic contrast adjustment based on precession:
    float exponent = 1.0 + (precession / 360.0) * 2.0; // Exponent ranges from 1 to 3
    float dynamicContrast = pow(max(sunInfluence, 0.0), exponent);
    vec3 differentialGradient = mix(vec3(0.0), vec3(1.0, 1.0, 0.0), dynamicContrast);
    color.rgb = mix(color.rgb, differentialGradient, 0.3);
    
    gl_FragColor = color;
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
      };
    }, [texturesLoaded, textures, temperature, precession]);

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

    return (
      <group
        // Rotate the Earth to reflect its axial tilt and precession.
        rotation={[
          THREE.MathUtils.degToRad(axialTilt),
          THREE.MathUtils.degToRad(precession),
          0,
        ]}
      >
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
            color="white"
            transparent={true}
            opacity={iceFactor * 0.8}
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
      <Line
        points={baselinePoints}
        color="rgba(0,0,0,0.8)"
        lineWidth={0.5}
      />
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
    <Card className="fixed bottom-28 left-[5%] max-w-[500px] h-[500px] bg-white border border-gray-300">
      <CardHeader>
        <CardTitle className="text-black text-lg">
          Current Cycle States (Year {simulatedYear.toFixed(1)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
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
        const year = temperatureHistory[index]?.year.toFixed(1) || "0.0";
        ctx.fillText(`Year ${year}`, x, height - margin.bottom + 20);
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
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={300}
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        backgroundColor: "white",
        borderRadius: "5px",
        border: "1px solid black",
        padding: "10px",
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
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
function SeasonalInsolationGraph({ axialTilt, eccentricity, precession }) {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with a gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f0f0f0');
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

    latitudes.forEach(lat => {
      const latRad = THREE.MathUtils.degToRad(lat);
      const row = [];

      seasons.forEach(season => {
        const seasonRad = THREE.MathUtils.degToRad(season);
        const tiltRad = THREE.MathUtils.degToRad(axialTilt);

        // Enhanced insolation calculation
        let insolation = Math.cos(latRad) * Math.cos(seasonRad) +
                        Math.sin(latRad) * Math.sin(tiltRad) * Math.cos(seasonRad);
        
        // Orbital effects
        const distanceFactor = 1 - eccentricity * Math.cos(seasonRad + THREE.MathUtils.degToRad(precession));
        insolation *= 1 / (distanceFactor * distanceFactor);

        // Add small random variation for visual interest
        insolation *= (1 + Math.random() * 0.05);
        
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
        const normalizedValue = (value - minInsolation) / (maxInsolation - minInsolation);
        
        // Create a more sophisticated color gradient
        const h = (1 - normalizedValue) * 240; // Hue: blue (240) to red (0)
        const s = 80 + normalizedValue * 20; // Saturation: 80-100%
        const l = 20 + normalizedValue * 60; // Lightness: 20-80%
        ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
      });
    });

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
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
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '10px Arial';

    // Season labels with months
    const seasonLabels = ['Dec (Winter)', 'Mar (Spring)', 'Jun (Summer)', 'Sep (Fall)'];
    seasonLabels.forEach((label, i) => {
      const x = margin.left + (i * graphWidth) / 3;
      ctx.fillText(label, x, height - margin.bottom + 15);
    });

    // Latitude labels
    [-90, -60, -30, 0, 30, 60, 90].forEach(lat => {
      const y = margin.top + ((lat + 90) / 180) * graphHeight;
      ctx.textAlign = 'right';
      ctx.fillText(`${lat}°`, margin.left - 5, y + 4);
    });

    // Title and legend
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Solar Insolation by Latitude and Season', width / 2, 15);
    
    // Add color scale legend
    const legendWidth = 20;
    const legendHeight = graphHeight / 2;
    const legendX = width - margin.right + 20;
    const legendY = margin.top + graphHeight / 4;

    const legendGradient = ctx.createLinearGradient(0, legendY + legendHeight, 0, legendY);
    legendGradient.addColorStop(0, 'hsl(240, 80%, 20%)'); // Low insolation (blue)
    legendGradient.addColorStop(1, 'hsl(0, 100%, 50%)');  // High insolation (red)
    
    ctx.fillStyle = legendGradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    
    // Legend labels
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'black';
    ctx.fillText('High', legendX + legendWidth + 5, legendY + 10);
    ctx.fillText('Low', legendX + legendWidth + 5, legendY + legendHeight - 5);

  }, [axialTilt, eccentricity, precession]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      zIndex: 10,
      background: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{
          borderRadius: '5px',
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

  // Smooth the displayed temperature.
  const [displayedTemp, setDisplayedTemp] = useState(realisticAmsterdamTemp);

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
      {/* 3D Scene */}
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 15, 25], fov: 50 }}
          background={new THREE.Color(0, 0, 0)}
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

      {/* Time Control Panel */}
      <Card className="fixed top-5 right-5 w-[300px] bg-white border border-gray-300">
        <CardHeader>
          <CardTitle className="text-black">Time Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
          >
            {isPaused ? "Play" : "Pause"}
          </button>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-800">Speed</span>
              <span className="text-sm text-gray-400">
                {timeScale.toFixed(3)}
              </span>
            </div>
            <Slider
              defaultValue={[timeScale]}
              value={[timeScale]}
              min={0.001}
              max={5000000}
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
              className="w-full bg-white text-black border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary"
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
      <Card className="fixed top-[350px] right-5 w-[300px] bg-white border border-gray-300">
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

      <NarrativeOverlay
        simulatedYear={simulatedYear}
        temperature={displayedTemp}
        iceFactor={f_ice}
        eccentricity={eccentricity}
        axialTilt={axialTilt}
        precession={precession}
      />

      <GlobalTemperatureGraph
        axialTilt={axialTilt}
        eccentricity={eccentricity}
        precession={precession}
        temperature={displayedTemp}
        iceFactor={f_ice}
        co2Level={co2Level}
        simulatedYear={simulatedYear}
      />

      <SeasonalInsolationGraph
        axialTilt={axialTilt}
        eccentricity={eccentricity}
        precession={precession}
      />
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: Sun
// ------------------------------------------------------------------
function Sun() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        emissive={new THREE.Color(1, 0.5, 0)}
        emissiveIntensity={10}
        color={new THREE.Color(1, 0.5, 0)}
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
