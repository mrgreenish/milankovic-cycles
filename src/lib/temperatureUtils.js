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
 * - Seasonal variations
 */

// Constants
const PRESENT_DAY_SOLAR_CONSTANT = 1361; // W/m²
const BASELINE_CO2_LEVEL = 280; // ppm (pre-industrial)
const FREEZING_POINT = 0; // °C
const BASELINE_MEAN_ORBITAL_DISTANCE = 1.0; // AU

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
  
  // Calculate true anomaly (position in orbit)
  const trueAnomaly = 2 * Math.PI * season + precRad;
  
  // Calculate Earth-Sun distance based on orbital position
  const distance = (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
  
  // Calculate solar declination (angle between solar rays and equatorial plane)
  const solarDeclination = Math.asin(Math.sin(tiltRad) * Math.sin(trueAnomaly));
  
  // Calculate hour angle (angle between noon and sunset)
  const hourAngle = Math.acos(-Math.tan(latRad) * Math.tan(solarDeclination));
  
  // Calculate daily insolation using the standard formula
  const dailyInsolation = (PRESENT_DAY_SOLAR_CONSTANT / (Math.PI * distance * distance)) *
    (hourAngle * Math.sin(latRad) * Math.sin(solarDeclination) +
     Math.cos(latRad) * Math.cos(solarDeclination) * Math.sin(hourAngle));
  
  return dailyInsolation;
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
  return 5.35 * Math.log(co2Level / BASELINE_CO2_LEVEL);
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
  
  return 1 / (1 + Math.exp((temperature - tempThreshold) / logisticWidth));
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
  const latitudeEffect = Math.cos(latRad);
  const seasonalAmplitude = 12 * (1 - 0.3 * latitudeEffect); // Larger seasonal swings at higher latitudes
  
  return seasonalAmplitude * Math.sin(2 * Math.PI * season - Math.PI / 2);
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
 * @returns {Object} - Temperature data including effective temperature and ice factor
 */
export function calculateGlobalTemperature({
  latitude = 52.37, // Amsterdam latitude as default
  season = 0,
  eccentricity,
  axialTilt,
  precession,
  co2Level,
  tempOffset = 0
}) {
  // Calculate insolation
  const dailyInsolation = calculateDailyInsolation(
    latitude,
    season,
    eccentricity,
    axialTilt,
    precession
  );
  
  const baselineDailyInsolation = calculateBaselineInsolation(latitude, season);
  const insolationDifference = dailyInsolation - baselineDailyInsolation;
  
  // Base temperature (Amsterdam as reference)
  const baselineTemp = 10; // °C
  
  // Convert insolation difference to temperature effect
  const insolationSensitivity = 0.3; // °C per W/m²
  const tempWithInsolation = baselineTemp + insolationSensitivity * insolationDifference;
  
  // Add CO2 effect
  const co2Forcing = calculateCO2Forcing(co2Level);
  const co2Sensitivity = 1.2; // °C per W/m²
  const tempWithCO2 = tempWithInsolation + co2Sensitivity * co2Forcing;
  
  // Calculate ice factor
  const latRad = (latitude * Math.PI) / 180;
  const latitudeEffect = Math.cos(latRad);
  const iceFactor = calculateIceFactor(tempWithCO2, latitude);
  
  // Ice albedo feedback
  const maxFeedback = 8; // Maximum feedback strength
  const feedback = maxFeedback * (1 - latitudeEffect);
  const effectiveTemp = tempWithCO2 - feedback * iceFactor;
  
  // Add seasonal variation
  const seasonalVariation = calculateSeasonalVariation(latitude, season);
  
  // Final temperature with all factors
  const finalTemp = effectiveTemp + seasonalVariation + tempOffset;
  
  return {
    temperature: finalTemp,
    iceFactor: iceFactor,
    baseTemperature: baselineTemp,
    insolationEffect: insolationSensitivity * insolationDifference,
    co2Effect: co2Sensitivity * co2Forcing,
    iceAlbedoEffect: -feedback * iceFactor,
    seasonalEffect: seasonalVariation,
    offsetEffect: tempOffset
  };
}

/**
 * Normalize temperature for visualization (0-1 scale)
 * 
 * @param {number} temperature - Temperature in °C
 * @param {number} minTemp - Minimum expected temperature (default: 0°C)
 * @param {number} maxTemp - Maximum expected temperature (default: 15°C)
 * @returns {number} - Normalized temperature (0-1)
 */
export function normalizeTemperature(temperature, minTemp = 0, maxTemp = 15) {
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
  return currentTemp + smoothingFactor * (targetTemp - currentTemp);
} 