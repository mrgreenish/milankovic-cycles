import React from 'react';
import { ObservatoryPanel, ObservatorySlider, ObservatoryTooltip } from './ObservatoryPanel';

/**
 * CycleComparisonPanel - A component that displays and controls Milankovitch cycle parameters
 */
export function CycleComparisonPanel({
  eccentricity,
  axialTilt,
  precession,
  baselineEccentricity,
  baselineAxialTilt,
  baselinePrecession,
  onEccentricityChange,
  onAxialTiltChange,
  onPrecessionChange
}) {
  // Calculate percentage differences from baseline
  const eccentricityDiff = ((eccentricity - baselineEccentricity) / baselineEccentricity) * 100;
  const axialTiltDiff = ((axialTilt - baselineAxialTilt) / baselineAxialTilt) * 100;
  const precessionDiff = precession - baselinePrecession;
  
  return (
    <ObservatoryPanel 
      title="Orbital Parameters" 
      variant="control"
      className="w-full"
    >
      <div className="space-y-6">
        <ObservatorySlider
          label="Eccentricity"
          value={eccentricity}
          onChange={(e) => onEccentricityChange(parseFloat(e.target.value))}
          min={0}
          max={0.07}
          step={0.001}
          valueDisplay={
            <ObservatoryTooltip 
              content="Eccentricity measures how elliptical Earth's orbit is. Higher values create more extreme seasonal differences between hemispheres."
            >
              <div className="flex items-center">
                <span className="text-sm font-mono text-pale-gold cursor-help">{eccentricity.toFixed(4)}</span>
                {eccentricityDiff !== 0 && (
                  <span className={`ml-2 text-xs ${eccentricityDiff > 0 ? 'text-temp-warm' : 'text-temp-cold'}`}>
                    {eccentricityDiff > 0 ? '+' : ''}{eccentricityDiff.toFixed(1)}%
                  </span>
                )}
              </div>
            </ObservatoryTooltip>
          }
        />
        
        <ObservatorySlider
          label="Axial Tilt"
          value={axialTilt}
          onChange={(e) => onAxialTiltChange(parseFloat(e.target.value))}
          min={22}
          max={24.5}
          step={0.1}
          valueDisplay={
            <ObservatoryTooltip 
              content="Axial tilt (obliquity) determines how extreme the seasons are. Higher values create more pronounced seasonal differences."
            >
              <div className="flex items-center">
                <span className="text-sm font-mono text-pale-gold cursor-help">{axialTilt.toFixed(1)}°</span>
                {axialTiltDiff !== 0 && (
                  <span className={`ml-2 text-xs ${axialTiltDiff > 0 ? 'text-temp-warm' : 'text-temp-cold'}`}>
                    {axialTiltDiff > 0 ? '+' : ''}{axialTiltDiff.toFixed(1)}%
                  </span>
                )}
              </div>
            </ObservatoryTooltip>
          }
        />
        
        <ObservatorySlider
          label="Precession"
          value={precession}
          onChange={(e) => onPrecessionChange(parseFloat(e.target.value))}
          min={0}
          max={360}
          step={1}
          valueDisplay={
            <ObservatoryTooltip 
              content="Precession is the wobble of Earth's axis, which changes which hemisphere faces the Sun during perihelion (closest approach)."
            >
              <div className="flex items-center">
                <span className="text-sm font-mono text-pale-gold cursor-help">{precession.toFixed(0)}°</span>
                {precessionDiff !== 0 && (
                  <span className={`ml-2 text-xs ${precessionDiff > 0 ? 'text-temp-warm' : 'text-temp-cold'}`}>
                    {precessionDiff > 0 ? '+' : ''}{precessionDiff.toFixed(0)}°
                  </span>
                )}
              </div>
            </ObservatoryTooltip>
          }
        />
      </div>
      
      <div className="mt-6 text-sm text-stardust-white opacity-80">
        <p>These orbital variations, known as Milankovitch cycles, affect how much solar radiation Earth receives and its distribution across latitudes and seasons.</p>
      </div>
    </ObservatoryPanel>
  );
} 