import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * SeasonalInsolationGraph - A component that displays a heatmap of insolation by latitude and season
 * Enhanced with the Celestial Observatory design system
 */
export function SeasonalInsolationGraph({ 
  axialTilt, 
  eccentricity, 
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
    
    // Vertical grid lines (seasons)
    for (let i = 0; i <= 4; i++) {
      const x = (width * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines (latitudes)
    for (let i = 0; i <= 6; i++) {
      const y = (height * i) / 6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

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
        
        // Create a color gradient from blue (cold) to gold/red (hot) using our design system colors
        const r = Math.floor(255 * Math.pow(normalizedValue, 0.7));
        const g = Math.floor(180 * Math.pow(normalizedValue, 0.9));
        const b = Math.floor(255 * (1 - Math.pow(normalizedValue, 0.6)));
        ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
        ctx.fillRect(x, y, cellWidth + 1, cellHeight + 1);
      });
    });

    // Draw border
    ctx.strokeStyle = 'rgba(205, 175, 125, 0.6)'; // Antique brass color
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // Draw axes labels with enhanced styling
    ctx.fillStyle = 'rgba(205, 175, 125, 0.9)'; // Antique brass color
    ctx.font = '10px "Space Mono", monospace';
    
    // Season labels
    ['Winter', 'Spring', 'Summer', 'Autumn'].forEach((season, i) => {
      const x = (width * (i + 0.5) / 4) - 15;
      ctx.fillText(season, x, height - 5);
    });
    
    // Latitude labels
    [-90, -45, 0, 45, 90].forEach(lat => {
      const latIndex = latitudes.findIndex(l => l === lat);
      if (latIndex !== -1) {
        const y = latIndex * cellHeight + 10;
        ctx.fillText(`${lat}°`, 5, y);
      }
    });

    // Title with enhanced styling
    ctx.font = '12px "Canela", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Seasonal Insolation by Latitude', 10, 15);
    
    // Add legend
    const legendWidth = 120;
    const legendHeight = 10;
    const legendX = width - legendWidth - 10;
    const legendY = 15;
    
    // Draw legend gradient
    const legendGradient = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
    legendGradient.addColorStop(0, 'rgba(0, 0, 255, 0.8)'); // Cold
    legendGradient.addColorStop(0.5, 'rgba(180, 180, 255, 0.8)'); // Medium
    legendGradient.addColorStop(1, 'rgba(255, 180, 0, 0.8)'); // Hot
    
    ctx.fillStyle = legendGradient;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    
    // Legend border
    ctx.strokeStyle = 'rgba(205, 175, 125, 0.6)';
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    // Legend labels
    ctx.fillStyle = 'rgba(205, 175, 125, 0.9)';
    ctx.font = '9px "Space Mono", monospace';
    ctx.fillText('Low', legendX, legendY + legendHeight + 10);
    ctx.fillText('High', legendX + legendWidth - 20, legendY + legendHeight + 10);
    
  }, [axialTilt, eccentricity, precession]);

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
      <div className="absolute bottom-2 right-2 text-xs text-stardust-white opacity-60">
        Eccentricity: {eccentricity.toFixed(4)} | Tilt: {axialTilt.toFixed(1)}°
      </div>
    </div>
  );
} 