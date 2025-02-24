'use client';
import React, { useRef, useState, useEffect } from "react";

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

      // Enhanced background with subtle gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "rgba(3, 0, 20, 0.85)");
      bgGradient.addColorStop(1, "rgba(12, 5, 33, 0.85)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Add subtle grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
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
      const exaggerationFactor = 5;
      const displayTemps = temperatureHistory.map(
        (p) => exaggerationFactor * (p.temp - baselineTemp) + baselineTemp
      );
      const minDisplayTemp = Math.min(...displayTemps) - 2;
      const maxDisplayTemp = Math.max(...displayTemps) + 2;
      const tempRange = maxDisplayTemp - minDisplayTemp;

      // Title with enhanced typography
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "600 18px Inter, system-ui, -apple-system, sans-serif";
      
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
      titleGradient.addColorStop(0, "rgba(236, 72, 153, 1)");
      titleGradient.addColorStop(1, "rgba(99, 102, 241, 1)");
      ctx.fillStyle = titleGradient;
      ctx.fillText("Global Temperature History", width / 2, margin.top - 15);

      // Parameter labels with modern styling
      const parameters = [
        { label: "Axial Tilt", value: axialTilt.toFixed(1) + "°", color: "rgba(249, 168, 212, 0.95)" },
        { label: "Eccentricity", value: eccentricity.toFixed(4), color: "rgba(129, 140, 248, 0.95)" },
        { label: "Precession", value: (precession % 360).toFixed(0) + "°", color: "rgba(52, 211, 153, 0.95)" },
        { label: "CO₂ Level", value: co2Level + "ppm", color: "rgba(236, 72, 153, 0.95)" },
        { label: "Ice Coverage", value: (iceFactor * 100).toFixed(0) + "%", color: "rgba(56, 189, 248, 0.95)" }
      ];

      ctx.textAlign = "left";
      ctx.font = "500 14px Inter, system-ui, -apple-system, sans-serif";
      parameters.forEach((param, i) => {
        const y = margin.top + 15 + i * 26;
        
        // Parameter background
        ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
        ctx.fillRect(width - margin.right + 5, y - 10, margin.right - 10, 22);
        
        // Label shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillText(`${param.label}:`, width - margin.right + 16, y + 1);
        
        // Label
        ctx.fillStyle = param.color;
        ctx.fillText(`${param.label}:`, width - margin.right + 15, y);
        
        // Value with enhanced contrast
        ctx.font = "600 14px Inter, system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.fillText(
          param.value,
          width - margin.right + 15 + ctx.measureText(`${param.label}: `).width,
          y
        );
        ctx.font = "500 14px Inter, system-ui, -apple-system, sans-serif";
      });

      // Temperature scale with modern styling
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.textAlign = "right";
      ctx.font = "500 13px Inter, system-ui, -apple-system, sans-serif";
      const tempStep = tempRange / 5;
      for (let i = 0; i <= 5; i++) {
        const temp = minDisplayTemp + i * tempStep;
        const y = height - margin.bottom - (i / 5) * graphHeight;
        
        // Grid line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
        
        // Label with background
        const labelWidth = ctx.measureText(`${temp.toFixed(1)}°C`).width + 10;
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(margin.left - labelWidth - 15, y - 10, labelWidth, 20);
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText(`${temp.toFixed(1)}°C`, margin.left - 20, y);
      }

      // Time scale with modern styling
      ctx.textAlign = "center";
      ctx.font = "500 13px Inter, system-ui, -apple-system, sans-serif";
      [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
        const x = margin.left + fraction * graphWidth;
        const index = Math.floor(fraction * (temperatureHistory.length - 1));
        const year = temperatureHistory[index]?.year || 0;
        
        // Vertical grid line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, height - margin.bottom);
        ctx.stroke();
        
        // Label with background
        const labelWidth = ctx.measureText(formatNumber(year)).width + 20;
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(x - labelWidth / 2, height - margin.bottom + 10, labelWidth, 24);
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fillText(formatNumber(year), x, height - margin.bottom + 22);
      });

      // Axis labels with modern typography
      ctx.font = "600 14px Inter, system-ui, -apple-system, sans-serif";
      const labelGradient = ctx.createLinearGradient(0, 0, width, 0);
      labelGradient.addColorStop(0, "rgba(236, 72, 153, 0.9)");
      labelGradient.addColorStop(1, "rgba(99, 102, 241, 0.9)");
      ctx.fillStyle = labelGradient;
      
      // X-axis label
      ctx.fillText("Simulation Timeline", width / 2, height - 10);
      
      // Y-axis label
      ctx.save();
      ctx.translate(22, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Temperature (°C)", 0, 0);
      ctx.restore();

      // Temperature line with enhanced styling
      const lineGradient = ctx.createLinearGradient(
        0,
        margin.top,
        0,
        height - margin.bottom
      );
      lineGradient.addColorStop(0, "rgba(236, 72, 153, 0.9)");
      lineGradient.addColorStop(0.5, "rgba(99, 102, 241, 0.9)");
      lineGradient.addColorStop(1, "rgba(56, 189, 248, 0.9)");

      // Glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(236, 72, 153, 0.5)";
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

      // Add subtle point indicators
      displayTemps.forEach((displayTemp, i) => {
        const x = margin.left + (i / (maxHistoryLength - 1)) * graphWidth;
        const y =
          height -
          margin.bottom -
          ((displayTemp - minDisplayTemp) / tempRange) * graphHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
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
      className="graph-container bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out animate-fade-slide-up"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        zIndex: 10,
        padding: "15px",
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
          borderRadius: "8px",
          transition: "transform 0.3s ease-out",
          transform: isHovered ? "scale(1.01)" : "scale(1)",
        }}
      />
      <style jsx>{`
        @keyframes fade-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-slide-up {
          animation: fade-slide-up 0.5s ease-out forwards;
        }

        .graph-container {
          will-change: transform, opacity, box-shadow;
        }

        .graph-container:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
