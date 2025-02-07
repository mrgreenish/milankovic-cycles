"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import "./globals.css";

// ------------------------------------------------------------------
// COMPONENT: Dynamic Axis Indicators
// ------------------------------------------------------------------
function AxisIndicators({ axialTilt, precession }) {
  const arrowRef = useRef();
  useEffect(() => {
    if (arrowRef.current) {
      // Set the arrow helper to point upward, then rotate based on tilt and precession.
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
    <primitive
      object={
        new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0),
          3,
          0xffff00,
          0.5,
          0.3
        )
      }
      ref={arrowRef}
    />
  );
}

// ------------------------------------------------------------------
// COMPONENT: Earth (modified to include an axis indicator)
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
      };
    }, [texturesLoaded, textures, temperature]);

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

    return (
      <group
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

        {/* Ice overlay */}
        <mesh scale={1.03}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial
            color="white"
            transparent={true}
            opacity={iceFactor * 0.8}
            depthWrite={false}
          />
        </mesh>

        {/* Axis indicator to visualize the rotation axis */}
        <AxisIndicators axialTilt={axialTilt} precession={precession} />
      </group>
    );
  }
);

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
    
    vec3 atmosphereColor = vec3(0.6, 0.8, 1.0);
    float atmosphere = pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);
    color.rgb += atmosphereColor * atmosphere * max(0.0, sunInfluence) * 0.3;
    
    float nightGlow = pow(max(0.0, -sunInfluence), 2.0) * 0.3;
    color.rgb += nightColor.rgb * nightGlow;
    
    vec3 lightDir = normalize(directionalLightDirection);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 lighting = ambientLightColor + directionalLightColor * diff;
    color.rgb *= lighting;
    
    // Apply tint based on temperature: blue for cold, red for warm.
    vec3 tint = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), temperature);
    color.rgb = mix(color.rgb, tint, 0.2);
    
    gl_FragColor = color;
  }
`;

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

// ------------------------------------------------------------------
// COMPONENT: OrbitPath with enhanced seasonal markers
// ------------------------------------------------------------------
function OrbitPath({ eccentricity }) {
  const a = 20;
  const b = a * (1 - 2 * eccentricity);
  const baselineB = a * (1 - 2 * 0.0167); // baseline orbit

  // Generate orbit points
  const points = [];
  const baselinePoints = [];
  const seasonalMarkers = [];
  
  for (let theta = 0; theta <= Math.PI * 2; theta += 0.02) {
    const x = a * Math.cos(theta);
    const currentZ = b * Math.sin(theta);
    const baselineZ = baselineB * Math.sin(theta);
    points.push(new THREE.Vector3(x, 0, currentZ));
    baselinePoints.push(new THREE.Vector3(x, 0, baselineZ));
    
    // Add markers for key orbital positions (every 90 degrees)
    if (Math.abs(theta - Math.PI/2) < 0.02 || 
        Math.abs(theta - Math.PI) < 0.02 || 
        Math.abs(theta - 3*Math.PI/2) < 0.02 || 
        Math.abs(theta) < 0.02) {
      seasonalMarkers.push(new THREE.Vector3(x, 0, currentZ));
    }
  }

  return (
    <group>
      {/* Baseline orbit */}
      <Line
        points={baselinePoints}
        color="rgba(255,255,255,0.3)"
        lineWidth={1}
      />
      {/* Current orbit */}
      <Line 
        points={points} 
        color="white" 
        lineWidth={2} 
      />
      
      {/* Seasonal markers */}
      {seasonalMarkers.map((position, index) => (
        <group key={index} position={position}>
          {/* Marker sphere */}
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color={index % 2 === 0 ? "#ff4444" : "#4444ff"} />
          </mesh>
          {/* Text label */}
          <Html position={[0, 1, 0]} center>
            <div style={{
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              whiteSpace: 'nowrap'
            }}>
              {index === 0 ? "Perihelion" :
               index === 1 ? "Spring Equinox" :
               index === 2 ? "Aphelion" :
               "Autumn Equinox"}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: OrbitingEarth with a marker to indicate current position.
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
      {/* Marker sphere for Earth's position */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// COMPONENT: NarrativeOverlay (shows context-rich messages)
// ------------------------------------------------------------------
function NarrativeOverlay({ simulatedYear, temperature, iceFactor, eccentricity, axialTilt, precession }) {
  // Generate cycle-specific messages
  const eccentricityMessage = eccentricity > 0.0167 
    ? "High eccentricity: More extreme seasonal variations between perihelion and aphelion"
    : "Low eccentricity: More moderate seasonal variations";

  const axialTiltMessage = axialTilt > 23.5
    ? "High axial tilt: Enhanced seasonal contrast between summer and winter"
    : axialTilt < 23.5
      ? "Low axial tilt: Reduced seasonal contrast between summer and winter"
      : "Normal axial tilt: Standard seasonal patterns";

  const precessionMessage = `Precession at ${precession.toFixed(0)}°: ${
    precession > 180 
      ? "Northern summer occurs near aphelion (furthest from Sun)"
      : "Northern summer occurs near perihelion (closest to Sun)"
  }`;

  const temperatureMessage = temperature < 5
    ? "Cooling trend detected: conditions approaching an ice age"
    : temperature > 15
      ? "Warming trend detected: climate conditions similar to interglacial periods"
      : "Stable climate conditions observed";

  return (
    <div
      style={{
        position: "absolute",
        bottom: "110px",
        left: "5%",
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.8)",
        padding: "15px",
        borderRadius: "8px",
        color: "white",
        fontFamily: "sans-serif",
        maxWidth: "500px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "16px" }}>Current Cycle States:</h3>
      <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
        <p style={{ margin: "5px 0" }}>{eccentricityMessage}</p>
        <p style={{ margin: "5px 0" }}>{axialTiltMessage}</p>
        <p style={{ margin: "5px 0" }}>{precessionMessage}</p>
        <p style={{ margin: "5px 0", color: temperature < 5 ? "#88ccff" : temperature > 15 ? "#ff8888" : "#ffffff" }}>
          {temperatureMessage}
        </p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENT: LatitudinalInsolationGraph
// A simple canvas graph showing insolation variation by latitude.
// ------------------------------------------------------------------
function LatitudinalInsolationGraph({ eccentricity, axialTilt, precession }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const latitudes = [];
    for (let lat = -90; lat <= 90; lat += 2) {
      latitudes.push(lat);
    }
    const tiltRad = THREE.MathUtils.degToRad(axialTilt);
    const insolationValues = latitudes.map((lat) => {
      const latRad = THREE.MathUtils.degToRad(lat);
      return Math.max(0, Math.cos(latRad - tiltRad));
    });
    const maxInsolation = Math.max(...insolationValues);
    const minInsolation = Math.min(...insolationValues);

    ctx.beginPath();
    ctx.strokeStyle = "yellow";
    latitudes.forEach((lat, i) => {
      const x = (i / (latitudes.length - 1)) * width;
      const normalized =
        (insolationValues[i] - minInsolation) / (maxInsolation - minInsolation);
      const y = height - normalized * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    ctx.fillText("Latitude Insolation", 10, 10);
  }, [eccentricity, axialTilt, precession]);
  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={150}
      style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        zIndex: 10,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderRadius: "5px",
      }}
    />
  );
}

// ------------------------------------------------------------------
// COMPONENT: TemperatureTimeline (existing timeline component)
// ------------------------------------------------------------------
function TemperatureTimeline({ temperature, simulatedYear }) {
  // Store data at one point per year.
  const [timelineData, setTimelineData] = useState([]);

  // Keep track of the last integer year we recorded.
  const [lastRecordedYear, setLastRecordedYear] = useState(0);

  // Decide how many years to display in the timeline.
  const maxYearsShown = 200;

  useEffect(() => {
    // Check if we've passed a new integer year.
    const currentYear = Math.floor(simulatedYear);
    if (currentYear > lastRecordedYear) {
      // Record temperature for this new year.
      setTimelineData((prevData) => {
        const updated = [...prevData, { year: currentYear, temp: temperature }];
        // Drop data if we exceed maxYearsShown.
        const oldestYearToKeep = currentYear - maxYearsShown;
        return updated.filter((d) => d.year >= oldestYearToKeep);
      });
      setLastRecordedYear(currentYear);
    }
  }, [simulatedYear, lastRecordedYear, temperature]);

  // Render a simple line chart
  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        left: "5%",
        width: "90%",
        height: 100,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "white",
        borderRadius: "5px",
        padding: "8px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ marginBottom: 5, fontSize: "12px" }}>
        Temperature Timeline (once per year)
      </div>
      <LineChart data={timelineData} />
    </div>
  );
}

// A small line chart component:
function LineChart({ data }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear previous frame.
    ctx.clearRect(0, 0, width, height);

    // Quick exit if no data.
    if (data.length < 2) return;

    // Determine min and max year for x-axis
    const minYear = data[0].year;
    const maxYear = data[data.length - 1].year;

    // Determine min and max temp for y-axis
    let minTemp = Infinity;
    let maxTemp = -Infinity;
    data.forEach((d) => {
      if (d.temp < minTemp) minTemp = d.temp;
      if (d.temp > maxTemp) maxTemp = d.temp;
    });

    // Add some padding so the chart doesn't touch the edges
    const yPadding = (maxTemp - minTemp) * 0.1;
    minTemp -= yPadding;
    maxTemp += yPadding;

    const getX = (year) =>
      ((year - minYear) / (maxYear - minYear)) * (width - 40) + 20;
    const getY = (temp) =>
      height - ((temp - minTemp) / (maxTemp - minTemp)) * (height - 20) - 10;

    // Draw the line
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "yellow";
    data.forEach((point, i) => {
      const x = getX(point.year);
      const y = getY(point.temp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw year labels every 10 years (adjust as needed)
    ctx.fillStyle = "white";
    ctx.font = "10px sans-serif";
    for (let y = minYear; y <= maxYear; y += 10) {
      const xPos = getX(y);
      const label = y.toString();
      ctx.fillText(label, xPos - 5, height - 2);
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={80}
      style={{ background: "rgba(0,0,0,0.3)", borderRadius: "3px" }}
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
  baselinePrecession 
}) {
  const barHeight = 20;
  const barWidth = 200;
  
  const ComparisonBar = ({ current, baseline, min, max, label }) => {
    const normalizedBaseline = ((baseline - min) / (max - min)) * barWidth;
    const normalizedCurrent = ((current - min) / (max - min)) * barWidth;
    
    return (
      <div style={{ marginBottom: 15 }}>
        <div style={{ marginBottom: 5, display: 'flex', justifyContent: 'space-between' }}>
          <span>{label}</span>
          <span>{current.toFixed(3)}</span>
        </div>
        <div style={{ 
          position: 'relative', 
          height: barHeight, 
          width: barWidth, 
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 4 
        }}>
          {/* Baseline marker */}
          <div style={{
            position: 'absolute',
            left: `${normalizedBaseline}px`,
            top: 0,
            width: 2,
            height: barHeight,
            backgroundColor: 'rgba(255,255,255,0.5)',
            zIndex: 2
          }} />
          {/* Current value bar */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${normalizedCurrent}px`,
            height: barHeight,
            backgroundColor: '#4a9eff',
            borderRadius: 4,
            transition: 'width 0.3s ease-out'
          }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 15,
      borderRadius: 8,
      color: 'white',
      fontFamily: 'sans-serif',
      zIndex: 10
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Milanković Cycles Comparison</h3>
      <ComparisonBar
        current={eccentricity}
        baseline={baselineEccentricity}
        min={0.001}
        max={0.2}
        label="Eccentricity"
      />
      <ComparisonBar
        current={axialTilt}
        baseline={baselineAxialTilt}
        min={10}
        max={45}
        label="Axial Tilt (°)"
      />
      <ComparisonBar
        current={precession}
        baseline={baselinePrecession}
        min={0}
        max={360}
        label="Precession (°)"
      />
    </div>
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

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);

    // Parameters
    const latitudes = Array.from({ length: 19 }, (_, i) => -90 + i * 10); // -90 to 90 in steps of 10
    const seasons = Array.from({ length: 24 }, (_, i) => i * 15); // 0 to 360 in steps of 15 degrees

    // Calculate insolation for each latitude and season
    const insolationData = [];
    let maxInsolation = 0;
    
    latitudes.forEach(lat => {
      const latRad = THREE.MathUtils.degToRad(lat);
      const row = [];
      
      seasons.forEach(season => {
        const seasonRad = THREE.MathUtils.degToRad(season);
        const tiltRad = THREE.MathUtils.degToRad(axialTilt);
        
        // Basic insolation calculation considering axial tilt and season
        let insolation = Math.cos(latRad) * Math.cos(seasonRad) +
                        Math.sin(latRad) * Math.sin(tiltRad) * Math.cos(seasonRad);
        
        // Adjust for eccentricity
        const distanceFactor = 1 - eccentricity * Math.cos(seasonRad + THREE.MathUtils.degToRad(precession));
        insolation *= 1 / (distanceFactor * distanceFactor);
        
        insolation = Math.max(0, insolation); // No negative insolation
        maxInsolation = Math.max(maxInsolation, insolation);
        row.push(insolation);
      });
      insolationData.push(row);
    });

    // Draw the heatmap
    const cellWidth = width / seasons.length;
    const cellHeight = height / latitudes.length;

    insolationData.forEach((row, latIndex) => {
      row.forEach((value, seasonIndex) => {
        const normalizedValue = value / maxInsolation;
        const x = seasonIndex * cellWidth;
        const y = latIndex * cellHeight;
        
        // Create a color gradient from blue (cold) to red (hot)
        const r = Math.floor(255 * Math.pow(normalizedValue, 0.5));
        const b = Math.floor(255 * (1 - Math.pow(normalizedValue, 0.5)));
        ctx.fillStyle = `rgb(${r},0,${b})`;
        ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
      });
    });

    // Draw axes labels
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    
    // Season labels
    ['Winter', 'Spring', 'Summer', 'Fall'].forEach((season, i) => {
      const x = (width * (i + 0.5) / 4) - 15;
      ctx.fillText(season, x, height - 5);
    });
    
    // Latitude labels
    [-90, -45, 0, 45, 90].forEach(lat => {
      const y = height * (lat + 90) / 180;
      ctx.fillText(`${lat}°`, 5, y);
    });

    // Title
    ctx.font = '12px sans-serif';
    ctx.fillText('Seasonal Insolation by Latitude', 10, 15);
  }, [axialTilt, eccentricity, precession]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      zIndex: 10,
    }}>
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
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
  const realisticAmsterdamTemp = 10; // °C
  const sensitivity = 30; // degrees per unit insolation difference

  // State for orbital parameters.
  const [eccentricity, setEccentricity] = useState(baselineEccentricity);
  const [axialTilt, setAxialTilt] = useState(baselineAxialTilt);
  const [precession, setPrecession] = useState(baselinePrecession);
  const [autoAnimate, setAutoAnimate] = useState(true);
  const [exaggeration, setExaggeration] = useState(0.5);

  // New state: global temperature offset.
  const [tempOffset, setTempOffset] = useState(0);
  // New state: simulated year.
  const [simulatedYear, setSimulatedYear] = useState(0);

  // New time control states.
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(0.01);

  // Preset scenarios.
  const presets = {
    "Last Glacial Maximum": {
      eccentricity: 0.02,
      axialTilt: 22,
      precession: 120,
    },
    "Holocene Optimum": {
      eccentricity: 0.0167,
      axialTilt: 23.5,
      precession: 0,
    },
  };
  const [preset, setPreset] = useState("");

  // Additional greenhouse gas slider.
  const [co2Level, setCo2Level] = useState(280);

  // Smoothing the displayed temperature.
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

  // Apply preset scenario if selected.
  useEffect(() => {
    if (preset && presets[preset]) {
      const { eccentricity, axialTilt, precession } = presets[preset];
      setEccentricity(eccentricity);
      setAxialTilt(axialTilt);
      setPrecession(precession);
      setAutoAnimate(false);
    }
  }, [preset]);

  // Temperature model calculations.
  const tiltRad = THREE.MathUtils.degToRad(axialTilt);
  const precessionRad = THREE.MathUtils.degToRad(precession);
  const precessionFactor =
    1 - 0.15 * Math.cos(precessionRad - THREE.MathUtils.degToRad(270));
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
  const T_threshold = 7;
  const logisticWidth = 0.5;
  const f_ice = 1 / (1 + Math.exp((T_adjusted - T_threshold) / logisticWidth));
  const feedback = 3;
  const T_effective = T_adjusted - feedback * f_ice;
  const season = simulatedYear - Math.floor(simulatedYear);
  const seasonalAmplitude = 5;
  const seasonalVariation =
    seasonalAmplitude * Math.sin(2 * Math.PI * season - Math.PI / 2);
  const finalTemp = T_effective + seasonalVariation;

  useEffect(() => {
    const smoothingFactor = 0.05;
    const interval = setInterval(() => {
      setDisplayedTemp((prev) => prev + smoothingFactor * (finalTemp - prev));
    }, 100);
    return () => clearInterval(interval);
  }, [finalTemp]);

  const normTemp = Math.max(0, Math.min(1, (finalTemp + 5) / 25));

  // Handler for manual slider changes.
  const handleManualChange = (setter) => (e) => {
    setAutoAnimate(false);
    setter(parseFloat(e.target.value));
  };

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {/* Overlay Information Panel */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          fontFamily: "sans-serif",
          maxWidth: "300px",
        }}
      >
        <h4>Simulation Info</h4>
        <p>Eccentricity: {eccentricity.toFixed(4)}</p>
        <p>Axial Tilt: {axialTilt.toFixed(1)}°</p>
        <p>Precession: {precession.toFixed(0)}°</p>
        <p>CO₂ Level: {co2Level} ppm</p>
        <p>Year: {Math.floor(simulatedYear)}</p>
      </div>

      {/* Time Control Panel */}
      <div
        style={{
          position: "absolute",
          top: 150,
          right: 20,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          fontFamily: "sans-serif",
          maxWidth: "300px",
        }}
      >
        <h4>Time Controls</h4>
        <button onClick={() => setIsPaused((prev) => !prev)}>
          {isPaused ? "Play" : "Pause"}
        </button>
        <div style={{ marginTop: "10px" }}>
          <label>
            Speed: {timeScale.toFixed(3)}
            <br />
            <input
              type="range"
              min="0.001"
              max="1"
              step="0.001"
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            />
          </label>
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>
            Preset Scenarios:
            <br />
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="">None</option>
              {Object.keys(presets).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Additional Controls Panel */}
      <div
        style={{
          position: "absolute",
          top: 350,
          right: 20,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          fontFamily: "sans-serif",
          maxWidth: "300px",
        }}
      >
        <h4>Additional Controls</h4>
        <div>
          <label>
            Greenhouse Gas (CO₂ ppm): {co2Level}
            <br />
            <input
              type="range"
              min="250"
              max="500"
              step="1"
              value={co2Level}
              onChange={(e) => setCo2Level(parseInt(e.target.value))}
            />
          </label>
        </div>
      </div>

      {/* Original Orbital Parameter Sliders */}
      <div
        style={{
          position: "absolute",
          top: 450,
          right: 20,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.6)",
          padding: "10px",
          borderRadius: "5px",
          color: "white",
          fontFamily: "sans-serif",
          maxWidth: "300px",
        }}
      >
        <h4>Orbital Parameters</h4>
        <label>
          Eccentricity: {eccentricity.toFixed(4)}
          <br />
          <input
            type="range"
            min="0.001"
            max="0.2"
            step="0.001"
            value={eccentricity}
            onChange={handleManualChange(setEccentricity)}
          />
        </label>
        <br />
        <label>
          Axial Tilt: {axialTilt.toFixed(1)}°
          <br />
          <input
            type="range"
            min="10"
            max="45"
            step="0.1"
            value={axialTilt}
            onChange={handleManualChange(setAxialTilt)}
          />
        </label>
        <br />
        <label>
          Precession: {precession.toFixed(0)}°
          <br />
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={precession}
            onChange={handleManualChange(setPrecession)}
          />
        </label>
      </div>

      {/* Narrative Overlay */}
      <NarrativeOverlay
        simulatedYear={simulatedYear}
        temperature={displayedTemp}
        iceFactor={f_ice}
        eccentricity={eccentricity}
        axialTilt={axialTilt}
        precession={precession}
      />

      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 15, 25], fov: 50 }}>
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
        <OrbitControls />
      </Canvas>

      {/* Temperature Timeline */}
      <TemperatureTimeline
        temperature={displayedTemp}
        simulatedYear={simulatedYear}
      />
      {/* Latitudinal Insolation Graph */}
      <LatitudinalInsolationGraph
        eccentricity={eccentricity}
        axialTilt={axialTilt}
        precession={precession}
      />

      <CycleComparisonPanel
        eccentricity={eccentricity}
        axialTilt={axialTilt}
        precession={precession}
        baselineEccentricity={baselineEccentricity}
        baselineAxialTilt={baselineAxialTilt}
        baselinePrecession={baselinePrecession}
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
// COMPONENT: Sun (unchanged)
// ------------------------------------------------------------------
function Sun() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshStandardMaterial
        emissive={new THREE.Color(1, 1, 0)}
        emissiveIntensity={2}
        color={new THREE.Color(1, 1, 0)}
      />
    </mesh>
  );
}
