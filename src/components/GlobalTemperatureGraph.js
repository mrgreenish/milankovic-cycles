import React, { useRef, useState, useEffect } from 'react';

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
      const width = canvas.width;
      const height = canvas.height;

      // Create sophisticated background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "rgba(15, 23, 42, 0.95)");
      bgGradient.addColorStop(1, "rgba(23, 42, 82, 0.95)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Add subtle grid pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
      }

      // Define graph margins
      const margin = { top: 30, right: 70, bottom: 40, left: 70 };
      const graphWidth = width - margin.left - margin.right;
      const graphHeight = height - margin.top - margin.bottom;

      // Enhanced temperature calculation
      const baselineTemp = 10;
      const exaggerationFactor = 5;
      const displayTemps = temperatureHistory.map(
        (p) => exaggerationFactor * (p.temp - baselineTemp) + baselineTemp
      );
      const minDisplayTemp = Math.min(...displayTemps) - 2;
      const maxDisplayTemp = Math.max(...displayTemps) + 2;
      const tempRange = maxDisplayTemp - minDisplayTemp;

      // Draw sophisticated grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.setLineDash([4, 4]);
      for (let i = 0; i <= 5; i++) {
        const y = height - margin.bottom - (i / 5) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw axes with enhanced styling
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(147, 51, 234, 0.7)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, height - margin.bottom);
      ctx.lineTo(width - margin.right, height - margin.bottom);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Create sophisticated temperature line gradient
      const gradient = ctx.createLinearGradient(
        0,
        margin.top,
        0,
        height - margin.bottom
      );
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.9)");
      gradient.addColorStop(0.3, "rgba(236, 72, 153, 0.9)");
      gradient.addColorStop(0.6, "rgba(147, 51, 234, 0.9)");
      gradient.addColorStop(1, "rgba(59, 130, 246, 0.9)");

      // Draw temperature line with glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(147, 51, 234, 0.5)";
      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = isHovered ? 3 : 2;
      
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

      // Draw parameter labels with modern styling
      const parameters = [
        { label: "Axial Tilt", value: axialTilt.toFixed(1) + "°", color: "rgba(255, 165, 0, 0.9)" },
        { label: "Eccentricity", value: eccentricity.toFixed(4), color: "rgba(99, 102, 241, 0.9)" },
        { label: "Precession", value: (precession % 360).toFixed(0) + "°", color: "rgba(52, 211, 153, 0.9)" },
        { label: "CO₂ Level", value: co2Level + "ppm", color: "rgba(236, 72, 153, 0.9)" },
        { label: "Ice Coverage", value: (iceFactor * 100).toFixed(0) + "%", color: "rgba(56, 189, 248, 0.9)" },
      ];

      ctx.textAlign = "left";
      ctx.font = "600 12px Inter, system-ui, -apple-system, sans-serif";
      parameters.forEach((param, i) => {
        const y = margin.top + 20 + i * 22;
        ctx.fillStyle = param.color;
        ctx.fillText(
          `${param.label}:`,
          width - margin.right + 10,
          y
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fillText(
          param.value,
          width - margin.right + 10 + ctx.measureText(`${param.label}: `).width,
          y
        );
      });

      // Enhanced temperature scale
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "right";
      ctx.font = "500 11px Inter, system-ui, -apple-system, sans-serif";
      const tempStep = tempRange / 5;
      for (let i = 0; i <= 5; i++) {
        const temp = minDisplayTemp + i * tempStep;
        const y = height - margin.bottom - (i / 5) * graphHeight;
        ctx.fillText(`${temp.toFixed(1)}°C`, margin.left - 8, y + 4);
      }

      // Enhanced time scale
      ctx.textAlign = "center";
      ctx.font = "500 11px Inter, system-ui, -apple-system, sans-serif";
      [0, 0.25, 0.5, 0.75, 1].forEach((fraction) => {
        const x = margin.left + fraction * graphWidth;
        const index = Math.floor(fraction * (temperatureHistory.length - 1));
        const year = temperatureHistory[index]?.year || 0;
        ctx.fillText(formatNumber(year), x, height - margin.bottom + 20);
      });

      // Enhanced title and axis labels
      ctx.font = "700 14px Inter, system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillText("Global Temperature History", width / 2, margin.top - 10);

      ctx.font = "500 12px Inter, system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText("Simulation Timeline", width / 2, height - 5);

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
    isHovered,
  ]);

  return (
    <div
      className="graph-container bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out animate-fade-slide-up"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        transform: "none",
        zIndex: 10,
        padding: "20px",
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <canvas
        ref={canvasRef}
        width={600}
        height={150}
        style={{
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