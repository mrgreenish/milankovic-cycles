/**
 * Temperature Calculation Utilities
 * 
 * This module provides scientifically accurate calculations for global temperature
 * based on Milankovitch cycles and other climate factors.
 * 
 * The calculations incorporate:
 * - Orbital parameters (eccentricity, axial tilt, precession)
 * - CO2 radiative forcing based on IPCC equations
 * - Ice-albedo feedback with latitude dependence
 * - Water vapor and cloud feedbacks
 * - Seasonal variations
 * - Time-dependent responses of different climate components
 * 
 * Scientific references:
 * - Berger, A. (1978). Long-term variations of daily insolation and Quaternary climatic changes. Journal of the Atmospheric Sciences, 35(12), 2362-2367.
 * - IPCC (2021). Climate Change 2021: The Physical Science Basis. Sixth Assessment Report.
 * - Budyko, M. I. (1969). The effect of solar radiation variations on the climate of the Earth. Tellus, 21(5), 611-619.
 * - Hays, J. D., Imbrie, J., & Shackleton, N. J. (1976). Variations in the Earth's orbit: pacemaker of the ice ages. Science, 194(4270), 1121-1132.
 */

// Constants
const PRESENT_DAY_SOLAR_CONSTANT = 1361; // W/m²
const BASELINE_CO2_LEVEL = 280; // ppm (pre-industrial)
const FREEZING_POINT = 0; // °C
const BASELINE_MEAN_ORBITAL_DISTANCE = 1.0; // AU

// CALIBRATION: Realistic temperature ranges by latitude (annual mean)
const LATITUDE_BASE_TEMPS = {
  90: -20,  // North pole
  65: -5,   // Northern high latitude
  30: 15,   // Northern mid latitude
  0: 25,    // Equator
  "-30": 15, // Southern mid latitude
  "-65": -5, // Southern high latitude
  "-90": -20 // South pole
};

// Temperature limits for safety
const MIN_VALID_TEMP = -60; // °C - coldest ever recorded on Earth ~ -89°C
const MAX_VALID_TEMP = 60;  // °C - hottest ever recorded on Earth ~ 57°C

/**
 * Helper function to ensure temperature values are reasonable 
 * 
 * @param {number} temp - Temperature to check
 * @param {number} defaultTemp - Default temperature to return if invalid
 * @returns {number} - Valid temperature within limits
 */
function ensureValidTemperature(temp, defaultTemp = 0) {
  if (!isFinite(temp)) {
    return defaultTemp;
  }
  return Math.max(MIN_VALID_TEMP, Math.min(MAX_VALID_TEMP, temp));
}

/**
 * Calculate daily insolation at a specific latitude based on orbital parameters
 * 
 * @param {number} latitude - Latitude in degrees
 * @param {number} season - Season as a fraction of the year (0-1)
 * @param {number} eccentricity - Earth's orbital eccentricity
 * @param {number} axialTilt - Earth's axial tilt in degrees
 * @param {number} precession - Earth's axial precession in degrees
 * @returns {number} - Daily insolation in W/m²
 */
export function calculateDailyInsolation(latitude, season, eccentricity, axialTilt, precession) {
  // Convert to radians
  const latRad = (latitude * Math.PI) / 180;
  const tiltRad = (axialTilt * Math.PI) / 180;
  const precRad = (precession * Math.PI) / 180;
  
  // Handle special case for poles where direct insolation formula can be problematic
  if (Math.abs(latitude) >= 89) {
    // For poles, use a simplified approach based on season and tilt
    const poleIsLit = Math.abs(latitude) === 90 && 
                    ((latitude > 0 && season > 0.2 && season < 0.7) || 
                     (latitude < 0 && (season < 0.2 || season > 0.7)));
    
    if (!poleIsLit) {
      return 0; // Dark polar night
    }
    
    // During polar day, simple approximation based on tilt and season
    const seasonalFactor = Math.sin(Math.PI * (season - 0.25));
    const polarInsolation = PRESENT_DAY_SOLAR_CONSTANT * 0.25 * Math.sin(tiltRad) * 
                          (1 + eccentricity * seasonalFactor);
    
    return Math.max(0, polarInsolation);
  }
  
  // Regular calculation for non-polar regions
  // Calculate true anomaly (position in orbit)
  const trueAnomaly = 2 * Math.PI * season + precRad;
  
  // Calculate Earth-Sun distance based on orbital position
  // Ensure we don't get NaN from division by zero
  const distance = Math.max(0.001, (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly)));
  
  // IMPROVED: More accurate solar declination calculation that accounts for longitude of perihelion
  // Calculate longitude of the sun relative to the vernal equinox
  const longitudeOfPerihelion = (precRad + Math.PI) % (2 * Math.PI); // Angle from vernal equinox to perihelion
  const longitudeOfSun = trueAnomaly + longitudeOfPerihelion;
  
  // More accurate solar declination formula based on Berger (1978)
  const solarDeclination = Math.asin(Math.sin(tiltRad) * Math.sin(longitudeOfSun));
  
  // Calculate hour angle (angle between noon and sunset)
  // Clamp input to acos to prevent NaN values - this is a critical fix
  const hourAngleInput = -Math.tan(latRad) * Math.tan(solarDeclination);
  const hourAngle = Math.acos(Math.max(-1, Math.min(1, hourAngleInput)));
  
  // Calculate daily insolation using the standard formula
  // Ensure we don't get NaN from division by zero
  const dailyInsolation = (PRESENT_DAY_SOLAR_CONSTANT / (Math.PI * Math.max(0.001, distance * distance))) *
    (hourAngle * Math.sin(latRad) * Math.sin(solarDeclination) +
     Math.cos(latRad) * Math.cos(solarDeclination) * Math.sin(hourAngle));
  
  // Ensure we return a valid number, not NaN or Infinity
  return isFinite(dailyInsolation) ? Math.max(0, dailyInsolation) : 0;
}

/**
 * Calculate baseline insolation for comparison
 * 
 * @param {number} latitude - Latitude in degrees
 * @param {number} season - Season as a fraction of the year (0-1)
 * @returns {number} - Baseline daily insolation in W/m²
 */
export function calculateBaselineInsolation(latitude, season) {
  const baselineEccentricity = 0.0167; // Current Earth value
  const baselineAxialTilt = 23.44; // Current Earth obliquity in degrees
  const baselinePrecession = 0; // Reference precession
  
  return calculateDailyInsolation(
    latitude,
    season,
    baselineEccentricity,
    baselineAxialTilt,
    baselinePrecession
  );
}

/**
 * Calculate CO2 radiative forcing using IPCC equations
 * 
 * @param {number} co2Level - CO2 concentration in ppm
 * @returns {number} - Radiative forcing in W/m²
 */
export function calculateCO2Forcing(co2Level) {
  // Ensure we don't get NaN from log of zero or negative
  const safeLevel = Math.max(1, co2Level);
  return 5.35 * Math.log(safeLevel / BASELINE_CO2_LEVEL);
}

/**
 * Calculate ice factor based on temperature and latitude
 * 
 * @param {number} temperature - Temperature in °C
 * @param {number} latitude - Latitude in degrees
 * @returns {number} - Ice factor (0-1)
 */
export function calculateIceFactor(temperature, latitude) {
  const latRad = (latitude * Math.PI) / 180;
  const latitudeEffect = Math.cos(latRad); // Ice formation more likely at higher latitudes
  const tempThreshold = FREEZING_POINT + 2 * latitudeEffect; // Latitude-dependent threshold
  const logisticWidth = 1.5; // Width of transition zone
  
  // Prevent division issues with extreme values that could lead to NaN
  const exponent = Math.max(-50, Math.min(50, (temperature - tempThreshold) / logisticWidth));
  const iceFactor = 1 / (1 + Math.exp(exponent));
  
  // Ensure valid output
  return isFinite(iceFactor) ? Math.max(0, Math.min(1, iceFactor)) : 0.5;
}

/**
 * Calculate seasonal temperature variation based on latitude
 * 
 * @param {number} latitude - Latitude in degrees
 * @param {number} season - Season as a fraction of the year (0-1)
 * @returns {number} - Seasonal temperature variation in °C
 */
export function calculateSeasonalVariation(latitude, season) {
  const latRad = (latitude * Math.PI) / 180;
  
  // CALIBRATION FIX: Reduce seasonal amplitude to realistic values
  // Higher latitudes experience more seasonal variation 
  const latitudeEffect = Math.sin(Math.abs(latRad));
  const seasonalAmplitude = 20 * latitudeEffect; // Max ~20°C swing at poles, less at equator
  
  // Adjust seasonal phase based on hemisphere
  const phaseShift = latitude >= 0 ? -Math.PI / 2 : Math.PI / 2;
  
  const variation = seasonalAmplitude * Math.sin(2 * Math.PI * season + phaseShift);
  
  // Ensure valid output
  return isFinite(variation) ? variation : 0;
}

/**
 * Get baseline temperature for a latitude based on realistic Earth temperature distribution
 * 
 * @param {number} latitude - Latitude in degrees
 * @returns {number} - Baseline temperature in °C 
 */
export function getLatitudeBaseTemperature(latitude) {
  // Find the closest reference latitude
  const absLat = Math.abs(latitude);
  const referenceLatitudes = [0, 30, 65, 90];
  const closestLat = referenceLatitudes.reduce((prev, curr) => 
    Math.abs(curr - absLat) < Math.abs(prev - absLat) ? curr : prev
  );
  
  // Get the base temperature for this latitude (use northern hemisphere values)
  // and adjust slightly for southern hemisphere (generally slightly warmer)
  const baseTemp = LATITUDE_BASE_TEMPS[closestLat];
  const hemisphereAdjustment = latitude < 0 ? 1 : 0; // Southern hemisphere 1°C warmer
  
  return baseTemp + hemisphereAdjustment;
}

/**
 * Calculate time-dependent response based on timescale differences
 * 
 * @param {number} timeScaleYears - Simulation time scale in years
 * @param {number} processTimeConstant - Time constant of the process in years
 * @param {number} fullResponse - The equilibrium response value
 * @returns {number} - Actual response considering time delays
 */
export function calculateTimeResponse(timeScaleYears, processTimeConstant, fullResponse) {
  // Exponential approach to equilibrium: response = full_response * (1 - e^(-t/τ))
  const responseRatio = 1 - Math.exp(-timeScaleYears / processTimeConstant);
  return fullResponse * responseRatio;
}

/**
 * Calculate global temperature based on all factors
 * 
 * @param {Object} params - Parameters for temperature calculation
 * @param {number} params.latitude - Latitude in degrees (default: 52.37, Amsterdam)
 * @param {number} params.season - Season as a fraction of the year (0-1)
 * @param {number} params.eccentricity - Earth's orbital eccentricity
 * @param {number} params.axialTilt - Earth's axial tilt in degrees
 * @param {number} params.precession - Earth's axial precession in degrees
 * @param {number} params.co2Level - CO2 concentration in ppm
 * @param {number} params.tempOffset - Additional temperature offset in °C
 * @param {number} params.timeScaleYears - Years of climate system response (0 = equilibrium)
 * @param {string} params.sensitivityLevel - Climate sensitivity level: 'low', 'medium', or 'high'
 * @returns {Object} - Temperature data including effective temperature and ice factor
 */
export function calculateGlobalTemperature({
  latitude = 52.37, // Amsterdam latitude as default
  season = 0,
  eccentricity,
  axialTilt,
  precession,
  co2Level,
  tempOffset = 0,
  timeScaleYears = 0, // Default to equilibrium response
  sensitivityLevel = 'medium' // Default to medium climate sensitivity
}) {
  try {
    // Get realistic baseline temperature for this latitude
    const baselineTemp = getLatitudeBaseTemperature(latitude);
    
    // Calculate insolation
    const dailyInsolation = calculateDailyInsolation(
      latitude,
      season,
      eccentricity,
      axialTilt,
      precession
    );
    
    const baselineDailyInsolation = calculateBaselineInsolation(latitude, season);
    
    // CALIBRATION FIX: Reduce insolation sensitivity to realistic values
    // Avoid division by zero
    const normalizedInsolationDiff = baselineDailyInsolation > 0.001 
      ? (dailyInsolation - baselineDailyInsolation) / baselineDailyInsolation
      : 0;
    
    const insolationSensitivity = 10; // °C per 100% change in insolation
    const insolationEffect = insolationSensitivity * normalizedInsolationDiff;
    const tempWithInsolation = baselineTemp + insolationEffect;
    
    // IMPROVED: CO2 sensitivity based on IPCC AR6 (2021)
    // Define sensitivity range based on scientific literature
    const co2SensitivityLevels = {
      low: 0.5,    // °C per W/m² (lower bound)
      medium: 0.75, // °C per W/m² (best estimate)
      high: 1.0     // °C per W/m² (upper bound)
    };
    const co2Sensitivity = co2SensitivityLevels[sensitivityLevel] || co2SensitivityLevels.medium;
    
    // Add CO2 effect
    const co2Forcing = calculateCO2Forcing(co2Level);
    const co2Effect = co2Sensitivity * co2Forcing;
    const tempWithCO2 = tempWithInsolation + co2Effect;
    
    // IMPROVED: Add water vapor feedback (strongest positive feedback)
    // Based on IPCC models showing water vapor approximately doubles warming
    const waterVaporFeedbackFactor = 1.6; // Amplification factor
    const waterVaporEffect = co2Effect * (waterVaporFeedbackFactor - 1);
    const tempWithWaterVapor = tempWithCO2 + waterVaporEffect;
    
    // IMPROVED: Add cloud feedback (mixed positive/negative)
    // Net slightly positive in most climate models
    const cloudFeedbackFactor = 0.1; // °C per °C of initial warming
    const cloudEffect = co2Effect * cloudFeedbackFactor;
    const tempWithClouds = tempWithWaterVapor + cloudEffect;
    
    // Calculate ice factor using the temperature including all atmospheric feedbacks
    const iceFactor = calculateIceFactor(tempWithClouds, latitude);
    
    // IMPROVED: Ice albedo feedback with more accurate latitude dependence based on Budyko-Sellers model
    // Values calibrated to match paleo records
    const maxPolarFeedback = 4.0; // °C at poles (reduced from 8)
    const equatorialFeedback = 0.5; // Minimal feedback at equator
    const latitudeFactor = Math.pow(Math.sin(Math.abs(latitude * Math.PI / 180)), 2); // Stronger at high latitudes
    const feedback = equatorialFeedback + (maxPolarFeedback - equatorialFeedback) * latitudeFactor;
    const iceAlbedoEffect = -feedback * iceFactor;
    
    // IMPROVED: Apply time scale adjustments to different feedbacks
    const atmosphericTimeConstant = 1;    // ~1 year for atmosphere
    const oceanTimeConstant = 500;        // ~500 years for deep ocean
    const iceSheetTimeConstant = 5000;    // ~5000 years for ice sheets
  
    // Adjust feedbacks based on time scales if timeScaleYears > 0
    const co2EffectAdjusted = timeScaleYears > 0 
      ? calculateTimeResponse(timeScaleYears, atmosphericTimeConstant, co2Effect)
      : co2Effect;
      
    const waterVaporEffectAdjusted = timeScaleYears > 0
      ? calculateTimeResponse(timeScaleYears, atmosphericTimeConstant, waterVaporEffect)
      : waterVaporEffect;
      
    const cloudEffectAdjusted = timeScaleYears > 0
      ? calculateTimeResponse(timeScaleYears, atmosphericTimeConstant, cloudEffect)
      : cloudEffect;
      
    const iceAlbedoEffectAdjusted = timeScaleYears > 0
      ? calculateTimeResponse(timeScaleYears, iceSheetTimeConstant, iceAlbedoEffect)
      : iceAlbedoEffect;
    
    // Add seasonal variation
    const seasonalVariation = calculateSeasonalVariation(latitude, season);
    
    // Final temperature with all factors
    let finalTemp = baselineTemp + 
                    insolationEffect +
                    co2EffectAdjusted + 
                    waterVaporEffectAdjusted + 
                    cloudEffectAdjusted + 
                    iceAlbedoEffectAdjusted + 
                    seasonalVariation + 
                    tempOffset;
    
    // Ensure temperature is within realistic bounds
    finalTemp = ensureValidTemperature(finalTemp, baselineTemp);
    
    return {
      temperature: finalTemp,
      iceFactor: iceFactor,
      baseTemperature: baselineTemp,
      insolationEffect: insolationEffect,
      co2Effect: co2EffectAdjusted,
      waterVaporEffect: waterVaporEffectAdjusted,
      cloudEffect: cloudEffectAdjusted,
      iceAlbedoEffect: iceAlbedoEffectAdjusted,
      seasonalEffect: seasonalVariation,
      offsetEffect: tempOffset,
      sensitivityUsed: co2Sensitivity,
      timeScaleApplied: timeScaleYears > 0
    };
  } catch (error) {
    console.error(`Error calculating temperature for latitude ${latitude}: ${error.message}`);
    // Return fallback values
    return {
      temperature: getLatitudeBaseTemperature(latitude),
      iceFactor: latitude > 60 || latitude < -60 ? 0.8 : 0,
      baseTemperature: getLatitudeBaseTemperature(latitude),
      insolationEffect: 0,
      co2Effect: 0,
      waterVaporEffect: 0,
      cloudEffect: 0,
      iceAlbedoEffect: 0,
      seasonalEffect: 0,
      offsetEffect: tempOffset,
      sensitivityUsed: co2SensitivityLevels?.medium || 0.75,
      timeScaleApplied: false,
      calculationError: true
    };
  }
}

/**
 * Calculate global temperature accounting for latitudinal bands
 * 
 * @param {Object} params - Parameters including orbit and CO2
 * @returns {Object} - Temperature data for different latitude bands and global mean
 */
export function calculateRegionalTemperatures(params) {
  try {
    // Key latitudes for climate models
    const latitudeBands = [
      { lat: 90, name: "North Pole", weight: 0.05 },
      { lat: 65, name: "Northern High Latitude", weight: 0.15 }, // Critical for ice ages
      { lat: 30, name: "Northern Mid Latitude", weight: 0.25 },
      { lat: 0, name: "Equator", weight: 0.1 },
      { lat: -30, name: "Southern Mid Latitude", weight: 0.25 },
      { lat: -65, name: "Southern High Latitude", weight: 0.15 },
      { lat: -90, name: "South Pole", weight: 0.05 }
    ];
    
    // Calculate temperature for each band
    const bandResults = latitudeBands.map(band => {
      const bandParams = {...params, latitude: band.lat};
      const result = calculateGlobalTemperature(bandParams);
      return {
        latitude: band.lat,
        name: band.name,
        weight: band.weight,
        ...result
      };
    });
    
    // Calculate weighted global mean (handle potential errors by filtering)
    const validBands = bandResults.filter(band => !band.calculationError && isFinite(band.temperature));
    
    if (validBands.length === 0) {
      throw new Error("No valid temperature calculations");
    }
    
    const totalWeight = validBands.reduce((sum, band) => sum + band.weight, 0);
    const globalTemperature = validBands.reduce(
      (sum, band) => sum + band.temperature * band.weight, 0
    ) / (totalWeight > 0 ? totalWeight : 1);
    
    return {
      bandResults,
      globalTemperature: ensureValidTemperature(globalTemperature, 15) // Default to 15°C if invalid
    };
  } catch (error) {
    console.error(`Error calculating regional temperatures: ${error.message}`);
    
    // Return fallback regional data
    const fallbackBandResults = [
      { lat: 90, name: "North Pole", temperature: -20, iceFactor: 0.9, weight: 0.05 },
      { lat: 65, name: "Northern High Latitude", temperature: -5, iceFactor: 0.7, weight: 0.15 },
      { lat: 30, name: "Northern Mid Latitude", temperature: 15, iceFactor: 0, weight: 0.25 },
      { lat: 0, name: "Equator", temperature: 25, iceFactor: 0, weight: 0.1 },
      { lat: -30, name: "Southern Mid Latitude", temperature: 16, iceFactor: 0, weight: 0.25 },
      { lat: -65, name: "Southern High Latitude", temperature: -4, iceFactor: 0.5, weight: 0.15 },
      { lat: -90, name: "South Pole", temperature: -19, iceFactor: 0.9, weight: 0.05 }
    ];
    
    return {
      bandResults: fallbackBandResults,
      globalTemperature: 15, // Global average temperature (approximate)
      calculationError: true
    };
  }
}

/**
 * Normalize temperature for visualization (0-1 scale)
 * 
 * @param {number} temperature - Temperature in °C
 * @param {number} minTemp - Minimum expected temperature (default: -30°C)
 * @param {number} maxTemp - Maximum expected temperature (default: 30°C)
 * @returns {number} - Normalized temperature (0-1)
 */
export function normalizeTemperature(temperature, minTemp = -30, maxTemp = 30) {
  // Safety check for invalid inputs
  if (!isFinite(temperature) || !isFinite(minTemp) || !isFinite(maxTemp) || minTemp === maxTemp) {
    return 0.5; // Return a reasonable default value
  }
  return Math.max(0, Math.min(1, (temperature - minTemp) / (maxTemp - minTemp)));
}

/**
 * Apply smoothing to temperature changes
 * 
 * @param {number} currentTemp - Current displayed temperature
 * @param {number} targetTemp - Target temperature to smooth towards
 * @param {number} smoothingFactor - Smoothing factor (0-1, default: 0.5)
 * @returns {number} - Smoothed temperature
 */
export function smoothTemperature(currentTemp, targetTemp, smoothingFactor = 0.5) {
  // Safety check for invalid inputs
  if (!isFinite(currentTemp) || !isFinite(targetTemp) || !isFinite(smoothingFactor)) {
    return isFinite(currentTemp) ? currentTemp : isFinite(targetTemp) ? targetTemp : 10;
  }
  return currentTemp + smoothingFactor * (targetTemp - currentTemp);
} 