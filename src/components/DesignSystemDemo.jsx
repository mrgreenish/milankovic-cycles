import React, { useState } from 'react';
import { 
  ObservatoryPanel, 
  ObservatoryButton, 
  ObservatorySlider,
  DataDisplay,
  ObservatoryTooltip
} from './ObservatoryPanel';

/**
 * DesignSystemDemo - A component to showcase the Celestial Observatory design system
 */
export function DesignSystemDemo() {
  const [eccentricity, setEccentricity] = useState(0.0167);
  const [axialTilt, setAxialTilt] = useState(23.5);
  const [precession, setPrecession] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  
  return (
    <div className="observatory-layout">
      {/* Header */}
      <div className="col-span-full mb-6">
        <h1 className="text-4xl font-serif text-stardust-white mb-2">
          Milankovitch Cycles <span className="text-antique-brass">Observatory</span>
        </h1>
        <p className="text-stardust-white opacity-80 max-w-2xl">
          Explore how Earth's orbital variations influence our climate over thousands of years.
        </p>
      </div>
      
      {/* Left Panel - Controls */}
      <div className="space-y-4">
        <ObservatoryPanel 
          title="Orbital Parameters" 
          variant="control"
          className="w-full"
        >
          <div className="space-y-6">
            <ObservatorySlider
              label="Eccentricity"
              value={eccentricity}
              onChange={(e) => setEccentricity(parseFloat(e.target.value))}
              min={0}
              max={0.07}
              step={0.001}
              valueDisplay={
                <ObservatoryTooltip 
                  content="Eccentricity measures how elliptical Earth's orbit is. Higher values create more extreme seasons."
                >
                  <span className="text-sm font-mono text-pale-gold cursor-help">{eccentricity.toFixed(4)}</span>
                </ObservatoryTooltip>
              }
            />
            
            <ObservatorySlider
              label="Axial Tilt"
              value={axialTilt}
              onChange={(e) => setAxialTilt(parseFloat(e.target.value))}
              min={22}
              max={24.5}
              step={0.1}
              valueDisplay={
                <ObservatoryTooltip 
                  content="Axial tilt determines how extreme the seasons are. Higher values create more pronounced seasonal differences."
                >
                  <span className="text-sm font-mono text-pale-gold cursor-help">{axialTilt.toFixed(1)}°</span>
                </ObservatoryTooltip>
              }
            />
            
            <ObservatorySlider
              label="Precession"
              value={precession}
              onChange={(e) => setPrecession(parseFloat(e.target.value))}
              min={0}
              max={360}
              step={1}
              valueDisplay={
                <ObservatoryTooltip 
                  content="Precession is the wobble of Earth's axis, which changes which hemisphere faces the Sun during perihelion."
                >
                  <span className="text-sm font-mono text-pale-gold cursor-help">{precession.toFixed(0)}°</span>
                </ObservatoryTooltip>
              }
            />
          </div>
          
          <div className="mt-6 flex justify-between">
            <ObservatoryButton variant="ghost">Reset</ObservatoryButton>
            <ObservatoryButton variant="primary">Apply</ObservatoryButton>
          </div>
        </ObservatoryPanel>
        
        <ObservatoryPanel 
          title="Simulation Controls" 
          variant="control"
        >
          <div className="space-y-4">
            <ObservatorySlider
              label="Simulation Speed"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
              min={0.1}
              max={10}
              step={0.1}
              valueDisplay={
                <span className="text-sm font-mono text-pale-gold">{simulationSpeed.toFixed(1)}x</span>
              }
            />
            
            <div className="flex justify-between gap-2">
              <ObservatoryButton className="flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </ObservatoryButton>
              
              <ObservatoryButton className="flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </ObservatoryButton>
              
              <ObservatoryButton className="flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <rect x="11" y="6" width="2" height="12"></rect>
                </svg>
              </ObservatoryButton>
            </div>
          </div>
        </ObservatoryPanel>
      </div>
      
      {/* Main View - Placeholder for 3D Visualization */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-stardust-white opacity-50 text-center">
            <div className="text-6xl animate-orbit inline-block mb-4">
              <span className="text-antique-brass">⊕</span>
            </div>
            <p>3D Visualization Area</p>
          </div>
        </div>
        
        {/* Time Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3/4">
          <ObservatoryPanel variant="control" className="bg-opacity-60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-stardust-white">-100,000 years</span>
              <div className="h-1 flex-1 mx-4 bg-slate-blue rounded-full overflow-hidden">
                <div 
                  className="h-full bg-antique-brass" 
                  style={{ width: '35%' }}
                ></div>
              </div>
              <span className="text-sm font-mono text-stardust-white">Present</span>
            </div>
          </ObservatoryPanel>
        </div>
      </div>
      
      {/* Right Panel - Data Display */}
      <div className="space-y-4">
        <ObservatoryPanel 
          title="Current Data" 
          variant="data"
          glowing={true}
        >
          <div className="grid grid-cols-2 gap-3">
            <DataDisplay 
              label="Global Temperature" 
              value="+1.2" 
              unit="°C"
            />
            <DataDisplay 
              label="Insolation (65°N)" 
              value="428" 
              unit="W/m²"
            />
            <DataDisplay 
              label="Simulated Year" 
              value="-35,420" 
              unit="BCE"
            />
            <DataDisplay 
              label="Ice Coverage" 
              value="12.3" 
              unit="%"
            />
          </div>
        </ObservatoryPanel>
        
        <ObservatoryPanel 
          title="Information" 
          variant="info"
        >
          <div className="space-y-3 text-sm text-stardust-white">
            <p>
              Milankovitch cycles describe the collective effects of changes in Earth's orbital movements on its climate over thousands of years.
            </p>
            <p className="text-pale-gold">
              The current configuration shows Earth during a period of moderate eccentricity with the Northern Hemisphere tilted away from the Sun at perihelion.
            </p>
          </div>
          
          <div className="mt-4">
            <ObservatoryButton variant="secondary" className="w-full">
              Learn More
            </ObservatoryButton>
          </div>
        </ObservatoryPanel>
      </div>
    </div>
  );
} 