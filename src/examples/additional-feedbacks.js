/**
 * Additional Climate Feedbacks
 * 
 * This file provides implementations for additional climate feedbacks
 * that can be incorporated into the temperature utilities to enhance
 * the scientific accuracy of the model.
 */

import { 
  calculateGlobalTemperature,
  calculateCO2Forcing 
} from '../lib/temperatureUtils.js';

/**
 * Calculate methane (CH4) radiative forcing
 * 
 * @param {number} ch4Level - CH4 concentration in ppb
 * @returns {number} - Radiative forcing in W/m²
 */
export function calculateMethaneForcing(ch4Level) {
  const BASELINE_CH4_LEVEL = 700; // ppb (pre-industrial)
  const safeLevel = Math.max(1, ch4Level);
  // Formula based on IPCC AR6
  return 0.036 * (Math.sqrt(safeLevel) - Math.sqrt(BASELINE_CH4_LEVEL));
}

/**
 * Calculate nitrous oxide (N2O) radiative forcing
 * 
 * @param {number} n2oLevel - N2O concentration in ppb
 * @returns {number} - Radiative forcing in W/m²
 */
export function calculateN2OForcing(n2oLevel) {
  const BASELINE_N2O_LEVEL = 270; // ppb (pre-industrial)
  const safeLevel = Math.max(1, n2oLevel);
  // Formula based on IPCC AR6
  return 0.12 * (Math.sqrt(safeLevel) - Math.sqrt(BASELINE_N2O_LEVEL));
}

/**
 * Calculate aerosol direct and indirect effects
 * 
 * @param {number} aerosolOpticalDepth - Aerosol optical depth (unitless)
 * @returns {number} - Radiative forcing in W/m²
 */
export function calculateAerosolForcing(aerosolOpticalDepth) {
  // Direct effect (scattering and absorption)
  const directEffect = -25 * aerosolOpticalDepth;
  
  // Indirect effect (cloud albedo and lifetime)
  const indirectEffect = -0.7 * Math.log(1 + aerosolOpticalDepth * 10);
  
  return directEffect + indirectEffect;
}

/**
 * Calculate vegetation albedo feedback
 * 
 * @param {number} baseTemperature - Base temperature in °C
 * @param {number} temperatureChange - Temperature change in °C
 * @param {number} latitude - Latitude in degrees
 * @returns {number} - Temperature effect in °C
 */
export function calculateVegetationAlbedoFeedback(baseTemperature, temperatureChange, latitude) {
  const latRad = (latitude * Math.PI) / 180;
  
  // Stronger at high latitudes where forest/tundra transitions occur
  const latitudeFactor = Math.pow(Math.sin(Math.abs(latRad)), 2);
  
  // Vegetation changes more rapidly in warming scenarios
  const vegetationSensitivity = temperatureChange > 0 ? 0.05 : 0.03;
  
  // Feedback is stronger at high latitudes and depends on temperature change
  return vegetationSensitivity * temperatureChange * latitudeFactor;
}

/**
 * Calculate permafrost carbon feedback
 * 
 * @param {number} temperature - Temperature in °C
 * @param {number} latitude - Latitude in degrees
 * @param {number} timeScaleYears - Time scale in years
 * @returns {number} - Additional CO2 equivalent forcing in W/m²
 */
export function calculatePermafrostFeedback(temperature, latitude, timeScaleYears) {
  // Only relevant at high latitudes
  if (Math.abs(latitude) < 45) return 0;
  
  // Threshold for permafrost thaw
  const thawThreshold = -2; // °C
  
  // No feedback if temperature is below threshold
  if (temperature < thawThreshold) return 0;
  
  // Calculate extent of thaw based on temperature above threshold
  const thawExtent = Math.min(1, (temperature - thawThreshold) / 5);
  
  // Calculate rate of carbon release (slow process)
  const maxCarbonDensity = 1500; // gC/m² potential release
  const releaseTimescale = 100; // years for significant release
  
  // Only release a portion based on time scale
  const releaseRate = Math.min(1, timeScaleYears / releaseTimescale);
  
  // Calculate equivalent CO2 forcing (simplified)
  // Approximately 2.5 GtC = 1 ppm CO2
  const additionalCO2ppm = (maxCarbonDensity * thawExtent * releaseRate) / 2500;
  
  // Approximate forcing change based on additional CO2
  return calculateCO2Forcing(280 + additionalCO2ppm) - calculateCO2Forcing(280);
}

/**
 * Calculate enhanced temperature model with all feedbacks
 * 
 * This function extends the base calculateGlobalTemperature function
 * with additional climate feedbacks for increased accuracy.
 * 
 * @param {Object} params - All base parameters plus:
 * @param {number} params.ch4Level - Methane concentration in ppb
 * @param {number} params.n2oLevel - Nitrous oxide concentration in ppb
 * @param {number} params.aerosolOpticalDepth - Aerosol optical depth
 * @returns {Object} - Enhanced temperature results with additional feedback components
 */
export function calculateEnhancedTemperature(params) {
  const {
    ch4Level = 1900,            // Current CH4 level (2023) in ppb
    n2oLevel = 335,             // Current N2O level (2023) in ppb
    aerosolOpticalDepth = 0.03, // Current global average AOD
    ...baseParams
  } = params;
  
  // Get base calculation
  const baseResults = calculateGlobalTemperature(baseParams);
  
  // Calculate additional forcings
  const methaneForcing = calculateMethaneForcing(ch4Level);
  const n2oForcing = calculateN2OForcing(n2oLevel);
  const aerosolForcing = calculateAerosolForcing(aerosolOpticalDepth);
  
  // Convert forcings to temperature effects using climate sensitivity
  const sensitivityUsed = baseResults.sensitivityUsed;
  const methaneEffect = methaneForcing * sensitivityUsed;
  const n2oEffect = n2oForcing * sensitivityUsed;
  const aerosolEffect = aerosolForcing * sensitivityUsed;
  
  // Calculate vegetation albedo feedback based on temperature change
  const temperatureChange = baseResults.temperature - baseResults.baseTemperature;
  const vegetationEffect = calculateVegetationAlbedoFeedback(
    baseResults.baseTemperature, 
    temperatureChange, 
    baseParams.latitude || 52.37
  );
  
  // Calculate permafrost feedback (if applicable)
  const permafrostForcing = calculatePermafrostFeedback(
    baseResults.temperature,
    baseParams.latitude || 52.37,
    baseParams.timeScaleYears || 0
  );
  const permafrostEffect = permafrostForcing * sensitivityUsed;
  
  // Calculate final temperature with all feedbacks
  const finalTemperature = baseResults.temperature + 
                          methaneEffect + 
                          n2oEffect + 
                          aerosolEffect + 
                          vegetationEffect + 
                          permafrostEffect;
  
  // Return enhanced results
  return {
    ...baseResults,
    temperature: finalTemperature,
    methaneEffect,
    n2oEffect,
    aerosolEffect,
    vegetationAlbedoEffect: vegetationEffect,
    permafrostEffect,
    additionalForcingTotal: methaneForcing + n2oForcing + aerosolForcing + permafrostForcing
  };
}

// Example usage:
console.log("\n===== ENHANCED TEMPERATURE MODEL WITH ADDITIONAL FEEDBACKS =====");
console.log("The following additional feedbacks could be included in the model:\n");
console.log("1. Non-CO2 Greenhouse Gases (Methane, N2O)");
console.log("   - Methane has 28-36x the warming potential of CO2 over 100 years");
console.log("   - Primary sources: agriculture, wetlands, permafrost thaw\n");

console.log("2. Aerosol Effects (Direct and Indirect)");
console.log("   - Aerosols typically cause cooling by reflecting sunlight");
console.log("   - Indirect effects include cloud formation changes\n");

console.log("3. Vegetation Albedo Feedback");
console.log("   - Changing vegetation cover alters surface reflectivity");
console.log("   - Example: Northward forest expansion decreases albedo\n");

console.log("4. Permafrost Carbon Feedback");
console.log("   - Thawing permafrost releases CO2 and methane");
console.log("   - Potentially large but slow-acting feedback\n");

console.log("5. Ocean Acidification");
console.log("   - Higher CO2 increases ocean acidity");
console.log("   - Affects marine ecosystems and carbon cycle\n");

console.log("6. Dynamic Ice Sheet Flow");
console.log("   - Ice sheets flow mechanically, not just melt");
console.log("   - Important for long-term sea level projections\n");

console.log("Implementation of these feedbacks would enhance model accuracy, particularly");
console.log("for paleoclimate studies and future high-emission scenarios.\n");

// Test enhanced model with present day conditions
const enhancedResults = calculateEnhancedTemperature({
  eccentricity: 0.0167,          // Current eccentricity
  axialTilt: 23.44,              // Current axial tilt (obliquity) in degrees
  precession: 102.0,             // Current precession angle in degrees
  co2Level: 415,                 // Current CO2 level (2023) in ppm
  ch4Level: 1900,                // Current CH4 level (2023) in ppb
  n2oLevel: 335,                 // Current N2O level (2023) in ppb
  aerosolOpticalDepth: 0.03,     // Current global average AOD
  season: 0.5,                   // Mid-year
  latitude: 45,                  // Mid-latitude
  timeScaleYears: 100,           // 100 year response
  sensitivityLevel: 'medium'     // Medium climate sensitivity
});

console.log("\n===== SAMPLE ENHANCED MODEL RESULTS =====");
console.log(`Final temperature: ${enhancedResults.temperature.toFixed(2)}°C`);
console.log(`Base temperature: ${enhancedResults.baseTemperature.toFixed(2)}°C`);
console.log(`CO2 effect: ${enhancedResults.co2Effect.toFixed(2)}°C`);
console.log(`Methane effect: ${enhancedResults.methaneEffect.toFixed(2)}°C`);
console.log(`N2O effect: ${enhancedResults.n2oEffect.toFixed(2)}°C`);
console.log(`Aerosol effect: ${enhancedResults.aerosolEffect.toFixed(2)}°C`);
console.log(`Vegetation albedo effect: ${enhancedResults.vegetationAlbedoEffect.toFixed(2)}°C`);
console.log(`Permafrost feedback effect: ${enhancedResults.permafrostEffect.toFixed(2)}°C`);
console.log(`Water vapor effect: ${enhancedResults.waterVaporEffect.toFixed(2)}°C`);
console.log(`Cloud effect: ${enhancedResults.cloudEffect.toFixed(2)}°C`);
console.log(`Ice-albedo effect: ${enhancedResults.iceAlbedoEffect.toFixed(2)}°C`); 