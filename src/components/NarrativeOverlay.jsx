import React, { useState, useEffect } from 'react';
import { ObservatoryPanel } from './ObservatoryPanel';

/**
 * NarrativeOverlay - A component that displays narrative text based on simulation parameters
 */
export function NarrativeOverlay({
  simulatedYear,
  temperature,
  iceFactor,
  eccentricity,
  axialTilt,
  precession,
  formatNumber
}) {
  // Generate narrative text based on current parameters
  const generateNarrativeText = () => {
    let text = '';
    
    // Remove year and temperature from narrative text and handle them separately
    text = 'You are observing Earth. ';
    
    // Remove temperature from narrative text since we'll display it separately
    // Just add context about what the temperature means
    if (temperature > 15) {
      text += 'The climate is significantly warmer than the historical average. ';
    } else if (temperature < 5) {
      text += 'The climate indicates glacial conditions. ';
    } else {
      text += 'The climate is near historical averages. ';
    }
    
    // Orbital parameter narrative
    if (eccentricity > 0.04) {
      text += `Earth's highly eccentric orbit (${eccentricity.toFixed(4)}) is creating extreme seasonal variations. `;
    }
    
    if (axialTilt > 24) {
      text += `The increased axial tilt of ${axialTilt.toFixed(1)}° is amplifying seasonal differences between hemispheres. `;
    } else if (axialTilt < 22.5) {
      text += `The reduced axial tilt of ${axialTilt.toFixed(1)}° is minimizing seasonal differences. `;
    }
    
    // Ice coverage narrative
    if (iceFactor < 0.3) {
      text += `Ice coverage is extensive, reflecting more sunlight and further cooling the planet.`;
    } else if (iceFactor > 0.8) {
      text += `Ice coverage is minimal, allowing the planet to absorb more solar radiation.`;
    }
    
    // Fallback text if nothing else applies
    if (!text) {
      text = `Observing Earth with an eccentricity of ${eccentricity.toFixed(4)}, axial tilt of ${axialTilt.toFixed(1)}°, and precession of ${precession.toFixed(0)}°.`;
    }
    
    return text;
  };

  // Generate the narrative text
  const narrativeText = generateNarrativeText();
  
  // Format the year for display
  const yearDisplay = Math.abs(simulatedYear) > 1000 ? formatNumber(simulatedYear) : "Present Day";
  
  // Determine temperature color based on value using the app's custom color system
  const getTempColorStyle = () => {
    // Create a dynamic gradient based on temperature
    if (temperature <= 0) {
      return { color: 'hsl(222 50% 36%)', textShadow: '0 0 10px rgba(70, 130, 180, 0.7)' }; // Very cold - temp-cold with glow
    } else if (temperature <= 5) {
      return { color: 'hsl(210 60% 50%)', textShadow: '0 0 8px rgba(70, 130, 180, 0.6)' }; // Cold - blend
    } else if (temperature <= 10) {
      return { color: 'hsl(30 58% 47%)', textShadow: '0 0 8px rgba(180, 140, 100, 0.6)' }; // Neutral - temp-neutral
    } else if (temperature <= 15) {
      return { color: 'hsl(20 60% 45%)', textShadow: '0 0 8px rgba(200, 100, 50, 0.6)' }; // Warm - blend
    } else {
      return { color: 'hsl(10 65% 41%)', textShadow: '0 0 10px rgba(200, 60, 60, 0.7)' }; // Hot - temp-warm with glow
    }
  };
  
  // Get temperature icon based on value
  const getTempIcon = () => {
    if (temperature <= 0) return '❄️'; // Snowflake for very cold
    if (temperature <= 5) return '🧊'; // Ice for cold
    if (temperature <= 10) return '🌡️'; // Thermometer for cool
    if (temperature <= 15) return '☀️'; // Sun for moderate
    if (temperature <= 20) return '🔆'; // Bright sun for warm
    return '🔥'; // Fire for hot
  };
  
  // Create a temperature trend indicator
  const getTempTrendIndicator = () => {
    if (temperature <= 5) return '↓'; // Cold trend
    if (temperature >= 15) return '↑'; // Warm trend
    return ''; // Neutral
  };
  
  return (
    <ObservatoryPanel 
      title="Observatory Insights" 
      variant="info"
      className="narrative-overlay"
    >
      {/* Data display section with fixed height to prevent jumping */}
      <div className="data-section mb-3 flex flex-col space-y-1">
        {/* Year display */}
        <div className="year-display h-6 flex items-center">
          <span className="text-stardust-white opacity-70 text-sm mr-2">Year:</span>
          <span className="text-pale-gold font-mono">
            {yearDisplay}
          </span>
        </div>
        
        {/* Temperature display with dynamic color and animation */}
        <div className="temp-display h-6 flex items-center">
          <span className="text-stardust-white opacity-70 text-sm mr-2">Temperature:</span>
          <div className="font-mono flex items-center transition-all duration-500" style={getTempColorStyle()}>
            <span className="mr-1">{getTempIcon()}</span>
            <span>{temperature.toFixed(1)}°C</span>
            <span className="ml-1 text-lg font-bold">{getTempTrendIndicator()}</span>
          </div>
        </div>
      </div>
      
      {/* Separator line */}
      <div className="border-t border-slate-blue opacity-30 mb-3"></div>
      
      {/* Main narrative text */}
      <p className="narrative-text visible">
        {narrativeText}
      </p>
    </ObservatoryPanel>
  );
} 