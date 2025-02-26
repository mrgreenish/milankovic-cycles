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
    
    // Year-based narrative
    if (Math.abs(simulatedYear) > 100000) {
      text = `You are observing Earth ${formatNumber(simulatedYear)}. `;
    } else if (Math.abs(simulatedYear) > 1000) {
      text = `You are witnessing Earth's climate ${formatNumber(simulatedYear)}. `;
    } else {
      text = `You are experiencing Earth's current orbital configuration. `;
    }
    
    // Temperature-based narrative
    if (temperature > 15) {
      text += `The global temperature is ${temperature.toFixed(1)}°C, significantly warmer than the historical average. `;
    } else if (temperature < 5) {
      text += `The global temperature is ${temperature.toFixed(1)}°C, indicating glacial conditions. `;
    } else {
      text += `The global temperature is ${temperature.toFixed(1)}°C. `;
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
      text = `You are observing Earth with an eccentricity of ${eccentricity.toFixed(4)}, axial tilt of ${axialTilt.toFixed(1)}°, and precession of ${precession.toFixed(0)}°. The global temperature is ${temperature.toFixed(1)}°C.`;
    }
    
    return text;
  };

  // Generate the narrative text
  const narrativeText = generateNarrativeText();
  
  return (
    <ObservatoryPanel 
      title="Observatory Insights" 
      variant="info"
      className="narrative-overlay"
    >
      <p className="narrative-text visible">
        {narrativeText}
      </p>
    </ObservatoryPanel>
  );
} 