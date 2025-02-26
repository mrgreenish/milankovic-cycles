import React, { useRef, useEffect, useState } from 'react';

/**
 * TemperatureTimeline - A component that displays temperature changes over time
 * Enhanced with the Celestial Observatory design system
 */
export function TemperatureTimeline({ 
  temperature, 
  simulatedYear,
  style = {}
}) {
  const canvasRef = useRef();
  const [temperatureHistory, setTemperatureHistory] = useState([]);
  const maxHistoryLength = 100; // Number of data points to keep
  
  // Update temperature history when temperature changes
  useEffect(() => {
    setTemperatureHistory(prev => {
      const newHistory = [...prev, { year: simulatedYear, temp: temperature }];
      // Keep only the most recent points
      return newHistory.slice(-maxHistoryLength);
    });
  }, [temperature, simulatedYear]);
  
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
    
    // Horizontal grid lines (temperature)
    const tempRange = 20; // -10°C to +10°C from baseline
    const tempStep = 5;
    const tempBaseline = 10; // Baseline temperature (center of graph)
    
    for (let temp = -10; temp <= 10; temp += tempStep) {
      const y = height * (0.5 - temp / tempRange);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Temperature labels
      ctx.fillStyle = 'rgba(205, 175, 125, 0.7)';
      ctx.font = '9px "Space Mono", monospace';
      ctx.fillText(`${tempBaseline + temp}°C`, 5, y - 3);
    }
    
    // If we have temperature history, draw the graph
    if (temperatureHistory.length > 1) {
      // Find min and max years for scaling
      const minYear = Math.min(...temperatureHistory.map(d => d.year));
      const maxYear = Math.max(...temperatureHistory.map(d => d.year));
      const yearRange = maxYear - minYear || 1; // Avoid division by zero
      
      // Draw the temperature curve
      ctx.beginPath();
      ctx.lineWidth = 2;
      
      // Create a gradient for the line based on temperature
      const getColorForTemp = (temp) => {
        if (temp > tempBaseline + 2) return 'rgba(255, 100, 50, 0.9)'; // Hot
        if (temp < tempBaseline - 2) return 'rgba(50, 150, 255, 0.9)'; // Cold
        return 'rgba(255, 215, 0, 0.9)'; // Neutral
      };
      
      // Draw each segment with its own color
      temperatureHistory.forEach((point, i) => {
        if (i === 0) return; // Skip first point (need two points to draw a line)
        
        const prevPoint = temperatureHistory[i - 1];
        const x1 = width * ((prevPoint.year - minYear) / yearRange);
        const y1 = height * (0.5 - (prevPoint.temp - tempBaseline) / tempRange);
        const x2 = width * ((point.year - minYear) / yearRange);
        const y2 = height * (0.5 - (point.temp - tempBaseline) / tempRange);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = getColorForTemp(point.temp);
        ctx.shadowColor = getColorForTemp(point.temp);
        ctx.shadowBlur = 3;
        ctx.stroke();
      });
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw points at each data point
      temperatureHistory.forEach((point) => {
        const x = width * ((point.year - minYear) / yearRange);
        const y = height * (0.5 - (point.temp - tempBaseline) / tempRange);
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = getColorForTemp(point.temp);
        ctx.fill();
      });
      
      // Draw current temperature indicator
      const currentX = width * ((simulatedYear - minYear) / yearRange);
      const currentY = height * (0.5 - (temperature - tempBaseline) / tempRange);
      
      ctx.beginPath();
      ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
      ctx.strokeStyle = getColorForTemp(temperature);
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw year labels
      ctx.fillStyle = 'rgba(205, 175, 125, 0.7)';
      ctx.font = '9px "Space Mono", monospace';
      
      // Format year with commas for thousands
      const formatYear = (year) => {
        return new Intl.NumberFormat().format(Math.round(year));
      };
      
      // Draw min and max year
      ctx.fillText(formatYear(minYear), 5, height - 5);
      ctx.fillText(formatYear(maxYear), width - 60, height - 5);
      
      // Draw current year
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px "Space Mono", monospace';
      ctx.fillText(`Year: ${formatYear(simulatedYear)}`, width / 2 - 50, height - 5);
    }
    
    // Draw border
    ctx.strokeStyle = 'rgba(205, 175, 125, 0.6)'; // Antique brass color
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
    
    // Title
    ctx.font = '12px "Canela", serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Temperature Timeline', 10, 15);
    
    // Current temperature display
    ctx.font = '10px "Space Mono", monospace';
    ctx.fillStyle = 'rgba(205, 175, 125, 0.9)';
    ctx.fillText(`Current: ${temperature.toFixed(1)}°C`, width - 100, 15);
    
  }, [temperature, simulatedYear, temperatureHistory]);
  
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