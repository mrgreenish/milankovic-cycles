import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * LatitudinalInsolationGraph - A component that displays insolation variation by latitude
 * Enhanced with the Celestial Observatory design system
 */
export function LatitudinalInsolationGraph({ 
  eccentricity, 
  axialTilt, 
  precession,
  style = {}
}) {
  const canvasRef = useRef();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Create gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(13, 15, 30, 0.7)');
    bgGradient.addColorStop(1, 'rgba(13, 15, 30, 0.9)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(123, 97, 255, 0.2)';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (height * i) / 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = (width * i) / 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Calculate insolation values for each latitude
    const latitudes = [];
    for (let lat = -90; lat <= 90; lat += 2) {
      latitudes.push(lat);
    }
    
    const tiltRad = THREE.MathUtils.degToRad(axialTilt);
    const precessionRad = THREE.MathUtils.degToRad(precession);
    
    const insolationValues = latitudes.map((lat) => {
      const latRad = THREE.MathUtils.degToRad(lat);
      
      // Enhanced insolation calculation that considers eccentricity and precession
      let baseInsolation = Math.max(0, Math.cos(latRad - tiltRad));
      
      // Adjust for eccentricity and precession
      const distanceFactor = 1 - eccentricity * Math.cos(precessionRad);
      baseInsolation *= 1 / (distanceFactor * distanceFactor);
      
      return baseInsolation;
    });
    
    const maxInsolation = Math.max(...insolationValues);
    const minInsolation = Math.min(...insolationValues);
    
    // Draw the insolation curve
    ctx.beginPath();
    ctx.lineWidth = 2;
    
    // Create a gradient for the line
    const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, 'rgba(205, 175, 125, 0.9)'); // Antique brass
    lineGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.9)'); // Gold
    lineGradient.addColorStop(1, 'rgba(205, 175, 125, 0.9)'); // Antique brass
    
    ctx.strokeStyle = lineGradient;
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 5;
    
    latitudes.forEach((lat, i) => {
      const x = (i / (latitudes.length - 1)) * width;
      const normalized = (insolationValues[i] - minInsolation) / (maxInsolation - minInsolation);
      const y = height - normalized * (height - 20) - 10; // Leave margin at top and bottom
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Fill area under the curve
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    fillGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    fillGradient.addColorStop(1, 'rgba(255, 215, 0, 0.05)');
    ctx.fillStyle = fillGradient;
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = 'rgba(205, 175, 125, 0.6)'; // Antique brass color
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // Draw axes labels
    ctx.fillStyle = 'rgba(205, 175, 125, 0.9)'; // Antique brass color
    ctx.font = '10px "Space Mono", monospace';
    
    // Latitude labels
    [-90, -60, -30, 0, 30, 60, 90].forEach((lat, i) => {
      const x = (width * i) / 6;
      ctx.fillText(`${lat}°`, x - 10, height - 5);
    });
    
    // Title
    ctx.font = '12px "Canela", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Latitudinal Insolation', 10, 15);
    
    // Add current axial tilt indicator
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(205, 175, 125, 0.9)';
    ctx.fillText(`Axial Tilt: ${axialTilt.toFixed(1)}°`, width - 120, 15);
    
  }, [eccentricity, axialTilt, precession]);
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="rounded-sm"
        style={{
          ...style,
        }}
      />
    </div>
  );
} 