# GlobalTemperatureGraph Simplification Tasks

## Core Functionality Changes

- [ ] **Remove complex cycle calculations**
  * Replace Milankovitch cycle calculations with simple sine wave
  * Remove individual contributions (eccentricity, axial tilt, precession)
  * Simplify temperature data generation function

- [ ] **Simplify data model**
  * Reduce number of data points for better performance
  * Abstract time scale to show passage of time rather than specific years
  * Create simpler temperature calculation function

- [ ] **Update component props**
  * Remove unnecessary props (eccentricity, axialTilt, precession)
  * Keep only simulatedTime (rename from simulatedYear), simulationSpeed, style
  * Add documentation for simplified props

## Rendering and Visual Changes

- [ ] **Simplify Three.js setup**
  * Remove EffectComposer and post-processing effects
  * Replace complex shader materials with basic materials
  * Remove UnrealBloomPass effects

- [ ] **Create single temperature line**
  * Implement simple line with gradient color based on temperature
  * Remove glow effects and shader-based animations
  * Use basic LineBasicMaterial with color

- [ ] **Simplify time indicator**
  * Create cleaner, simpler time position indicator
  * Remove complex statistics and cycle contributions at time point
  * Show only basic time and temperature information

- [ ] **Clean up visual elements**
  * Remove cycle contribution indicators
  * Remove key period annotations
  * Keep only basic axes and grid
  * Simplify text labels and reduce their number

## UI Improvements

- [ ] **Update legend and info panels**
  * Remove detailed cycle information
  * Simplify to only show temperature range
  * Use cleaner layout for information display

- [ ] **Improve readability**
  * Increase contrast for text elements
  * Make grid and axes subtler
  * Add better spacing between elements

- [ ] **Add simple tooltip**
  * Create hover effect for temperature values
  * Use HTML-based tooltip instead of Three.js sprites
  * Ensure tooltip is accessible and responsive

## Code Structure Improvements

- [ ] **Clean up useEffect hooks**
  * Reduce number of effects and dependencies
  * Separate concerns properly between effects
  * Remove unused state updates

- [ ] **Remove unused state variables and refs**
  * Clean up state declarations
  * Remove refs for elements no longer needed
  * Keep only essential component state

- [ ] **Simplify animation loop**
  * Remove complex uniform updates
  * Use standard render calls instead of composer
  * Optimize animation performance

## Testing and Optimization

- [ ] **Test performance**
  * Verify rendering performance is improved
  * Check for memory leaks
  * Ensure cleanup functions work properly

- [ ] **Ensure responsiveness**
  * Test resize handling works properly
  * Verify canvas scales correctly with container
  * Check mobile compatibility

- [ ] **Final review**
  * Ensure code meets project standards
  * Document key aspects of simplified implementation
  * Verify all requirements for simplification have been met 