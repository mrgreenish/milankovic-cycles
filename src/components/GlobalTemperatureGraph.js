'use client';
import React, { useRef, useState, useEffect } from "react";
import { normalizeTemperature } from "@/lib/temperatureUtils";

export function GlobalTemperatureGraph({
  axialTilt,
  eccentricity,
  precession,
  temperature,
  iceFactor,
  co2Level,
  simulatedYear,
  formatNumber,
  style,
}) {
  const canvasRef = useRef();
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const maxHistoryLength = 200;
  const lastUpdateRef = useRef(0);
  const updateInterval = 100; // Update every 100ms

  // Append new temperature data with rate limiting.
  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastUpdateRef.current >= updateInterval) {
      // Skip adding the data point if temperature is not a valid number
      if (!isFinite(temperature)) return;
      
      setTemperatureHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            temp: isFinite(temperature) ? temperature : prev.length > 0 ? prev[prev.length - 1].temp : 10,
            axialTilt: isFinite(axialTilt) ? axialTilt : 23.44,
            eccentricity: isFinite(eccentricity) ? eccentricity : 0.0167,
            precession: isFinite(precession) ? precession % 360 : 0,
            co2: isFinite(co2Level) ? co2Level : 280,
            ice: isFinite(iceFactor) ? iceFactor : 0,
            year: isFinite(simulatedYear) ? simulatedYear : 0,
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

      // Get the device pixel ratio and size the canvas accordingly
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Set the canvas size accounting for Retina displays
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Scale the context for Retina displays
      ctx.scale(dpr, dpr);
      
      const width = rect.width;
      const height = rect.height;

      // Clear the canvas with the background
      ctx.clearRect(0, 0, width, height);

      // Enhanced background with celestial gradient - using actual color values instead of CSS variables
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "rgba(13, 15, 30, 0.85)"); // Deep space color
      bgGradient.addColorStop(1, "rgba(20, 25, 45, 0.85)"); // Midnight blue color
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Add subtle grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)"; // Stardust white with low opacity
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Margins with more space for labels
      const margin = { top: 35, right: 80, bottom: 45, left: 80 };
      const graphWidth = width - margin.left - margin.right;
      const graphHeight = height - margin.top - margin.bottom;

      // Enhanced temperature calculations
      const baselineTemp = 10;
      const exaggerationFactor = 1;
      const displayTemps = temperatureHistory.map(
        (p) => {
          // Ensure we don't use NaN values
          if (!isFinite(p.temp)) return baselineTemp;
          return exaggerationFactor * (p.temp - baselineTemp) + baselineTemp;
        }
      );

      // Filter out any remaining NaN values before calculating min/max
      const validTemps = displayTemps.filter(temp => isFinite(temp));
      const minDisplayTemp = validTemps.length > 0 
        ? Math.min(...validTemps) - 2 
        : baselineTemp - 5;
      const maxDisplayTemp = validTemps.length > 0 
        ? Math.max(...validTemps) + 2 
        : baselineTemp + 5;
      const tempRange = Math.max(0.1, maxDisplayTemp - minDisplayTemp);

      // Title with enhanced typography
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "600 18px var(--font-playfair), serif";
      
      // Draw text shadow for depth
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillText("Global Temperature History", width / 2 + 1, margin.top - 15 + 1);
      
      // Draw actual text with gradient
      const titleGradient = ctx.createLinearGradient(
        width / 2 - 100,
        0,
        width / 2 + 100,
        0
      );
      titleGradient.addColorStop(0, "#cdaf7d"); // Antique brass color
      titleGradient.addColorStop(1, "#e8d0a9"); // Pale gold color
      ctx.fillStyle = titleGradient;
      ctx.fillText("Global Temperature History", width / 2, margin.top - 15);

      // Parameter labels with Celestial Observatory styling
      const parameters = [
        { 
          label: "Axial Tilt", 
          value: isFinite(axialTilt) ? axialTilt.toFixed(1) + "°" : "N/A", 
          color: "rgba(55, 90, 130, 0.95)" // Slate blue color
        },
        { 
          label: "Eccentricity", 
          value: isFinite(eccentricity) ? eccentricity.toFixed(4) : "N/A", 
          color: "rgba(205, 175, 125, 0.95)" // Antique brass color
        },
        { 
          label: "Precession", 
          value: isFinite(precession) ? (precession % 360).toFixed(0) + "°" : "N/A", 
          color: "rgba(180, 140, 100, 0.95)" // Aged copper color
        },
        { 
          label: "CO₂ Level", 
          value: isFinite(co2Level) ? co2Level + "ppm" : "N/A", 
          color: "rgba(200, 80, 60, 0.95)" // Warm temperature color
        },
        { 
          label: "Ice Coverage", 
          value: isFinite(iceFactor) ? (iceFactor * 100).toFixed(0) + "%" : "N/A", 
          color: "rgba(70, 130, 180, 0.95)" // Cold temperature color
        }
      ];

      ctx.textAlign = "left";
      ctx.font = "500 14px var(--font-switzer), var(--font-inter), system-ui, sans-serif";
      parameters.forEach((param, i) => {
        const y = margin.top + 15 + i * 26;
        
        // Parameter background - observatory panel style
        ctx.fillStyle = "rgba(13, 15, 30, 0.4)"; // Deep space color
        ctx.fillRect(width - margin.right + 5, y - 10, margin.right - 10, 22);
        
        // Subtle border
        ctx.strokeStyle = "rgba(55, 90, 130, 0.3)"; // Slate blue color
        ctx.lineWidth = 1;
        ctx.strokeRect(width - margin.right + 5, y - 10, margin.right - 10, 22);
        
        // Label shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillText(`${param.label}:`, width - margin.right + 16, y + 1);
        
        // Label
        ctx.fillStyle = param.color;
        ctx.fillText(`${param.label}:`, width - margin.right + 15, y);
        
        // Value with enhanced contrast - using monospace font for data
        ctx.font = "600 14px monospace";
        ctx.fillStyle = "#f7fafc"; // Stardust white color
        ctx.fillText(
          param.value,
          width - margin.right + 15 + ctx.measureText(`${param.label}: `).width,
          y
        );
        ctx.font = "500 14px system-ui, sans-serif";
      });

      // Temperature scale with Celestial Observatory styling
      ctx.fillStyle = "#f7fafc"; // Stardust white color
      ctx.textAlign = "right";
      ctx.font = "500 13px monospace";
      const tempStep = tempRange / 5;
      for (let i = 0; i <= 5; i++) {
        const temp = minDisplayTemp + i * tempStep;
        const y = height - margin.bottom - (i / 5) * graphHeight;
        
        // Grid line
        ctx.strokeStyle = "rgba(55, 90, 130, 0.2)"; // Slate blue color
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
        
        // Label with background - observatory panel style
        const labelWidth = ctx.measureText(`${temp.toFixed(1)}°C`).width + 10;
        ctx.fillStyle = "rgba(13, 15, 30, 0.4)"; // Deep space color
        ctx.fillRect(margin.left - labelWidth - 15, y - 10, labelWidth, 20);
        
        // Subtle border
        ctx.strokeStyle = "rgba(55, 90, 130, 0.3)"; // Slate blue color
        ctx.lineWidth = 1;
        ctx.strokeRect(margin.left - labelWidth - 15, y - 10, labelWidth, 20);
        
        ctx.fillStyle = "#f7fafc"; // Stardust white color
        ctx.fillText(`${temp.toFixed(1)}°C`, margin.left - 20, y);
      }

      // Time scale with Celestial Observatory styling
      ctx.textAlign = "center";
      ctx.font = "500 13px monospace";
      [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
        const x = margin.left + fraction * graphWidth;
        const index = Math.floor(fraction * (temperatureHistory.length - 1));
        const year = temperatureHistory[index]?.year || 0;
        
        // Vertical grid line
        ctx.strokeStyle = "rgba(55, 90, 130, 0.2)"; // Slate blue color
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, height - margin.bottom);
        ctx.stroke();
        
        // Label with background - observatory panel style
        const labelWidth = ctx.measureText(formatNumber(year)).width + 20;
        ctx.fillStyle = "rgba(13, 15, 30, 0.4)"; // Deep space color
        ctx.fillRect(x - labelWidth / 2, height - margin.bottom + 10, labelWidth, 24);
        
        // Subtle border
        ctx.strokeStyle = "rgba(55, 90, 130, 0.3)"; // Slate blue color
        ctx.lineWidth = 1;
        ctx.strokeRect(x - labelWidth / 2, height - margin.bottom + 10, labelWidth, 24);
        
        ctx.fillStyle = "#f7fafc"; // Stardust white color
        ctx.fillText(formatNumber(year), x, height - margin.bottom + 22);
      });

      // Axis labels with Celestial Observatory typography
      ctx.font = "600 14px serif";
      const labelGradient = ctx.createLinearGradient(0, 0, width, 0);
      labelGradient.addColorStop(0, "#cdaf7d"); // Antique brass color
      labelGradient.addColorStop(1, "#e8d0a9"); // Pale gold color
      ctx.fillStyle = labelGradient;
      
      // X-axis label
      ctx.fillText("Simulation Timeline", width / 2, height - 10);
      
      // Y-axis label
      ctx.save();
      ctx.translate(22, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Temperature (°C)", 0, 0);
      ctx.restore();

      // Temperature line with Celestial Observatory styling
      const lineGradient = ctx.createLinearGradient(
        0,
        margin.top,
        0,
        height - margin.bottom
      );
      lineGradient.addColorStop(0, "#c84a38"); // Warm temperature color
      lineGradient.addColorStop(0.5, "#b48c64"); // Neutral temperature color
      lineGradient.addColorStop(1, "#4682b4"); // Cold temperature color

      // Glow effect
      ctx.shadowBlur = isHovered ? 15 : 10;
      ctx.shadowColor = "rgba(205, 175, 125, 0.6)"; // Antique brass color
      ctx.beginPath();
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

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
      ctx.shadowBlur = 0;

      // Add data points with Celestial Observatory styling
      displayTemps.forEach((displayTemp, i) => {
        if (i % 10 === 0 || i === displayTemps.length - 1) { // Show fewer points for cleaner look
          const x = margin.left + (i / (maxHistoryLength - 1)) * graphWidth;
          const y =
            height -
            margin.bottom -
            ((displayTemp - minDisplayTemp) / tempRange) * graphHeight;
          
          // Outer glow
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(205, 175, 125, 0.3)"; // Antique brass color
          ctx.fill();
          
          // Inner point
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#e8d0a9"; // Pale gold color
          ctx.fill();
        }
      });

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
    isHovered,
  ]);

  return (
    <div
      className="observatory-panel bg-opacity-50 border-aged-copper backdrop-blur-xl overflow-hidden transition-all duration-500 ease-out animate-fadeIn"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        zIndex: 10,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        width={1200}
        height={300}
        style={{
          width: "100%",
          height: "100%",
          transition: "transform 0.3s ease-out",
          transform: isHovered ? "scale(1.01)" : "scale(1)",
        }}
      />
    </div>
  );
}
