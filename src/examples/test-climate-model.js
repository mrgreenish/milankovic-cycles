/**
 * Climate Model Test Examples
 * 
 * This file demonstrates how to use the updated temperature utilities
 * with scientifically accurate parameter values for different time periods.
 */

import { 
  calculateGlobalTemperature, 
  calculateRegionalTemperatures 
} from '../lib/temperatureUtils.js';

// Print results in a nicely formatted way
function printTemperatureResults(label, results) {
  console.log(`\n===== ${label} =====`);
  console.log(`Temperature: ${results.temperature.toFixed(2)}°C`);
  console.log(`Base temperature: ${results.baseTemperature.toFixed(2)}°C`);
  console.log(`Insolation effect: ${results.insolationEffect.toFixed(2)}°C`);
  console.log(`CO2 effect: ${results.co2Effect.toFixed(2)}°C`);
  console.log(`Water vapor effect: ${results.waterVaporEffect.toFixed(2)}°C`);
  console.log(`Cloud effect: ${results.cloudEffect.toFixed(2)}°C`);
  console.log(`Ice-albedo effect: ${results.iceAlbedoEffect.toFixed(2)}°C`);
  console.log(`Seasonal effect: ${results.seasonalEffect.toFixed(2)}°C`);
  console.log(`Ice factor: ${results.iceFactor.toFixed(2)}`);
  console.log(`Climate sensitivity: ${results.sensitivityUsed} °C/(W/m²)`);
}

function printRegionalResults(label, results) {
  console.log(`\n===== ${label} =====`);
  console.log(`Global average temperature: ${results.globalTemperature.toFixed(2)}°C`);
  console.log("\nRegional breakdown:");
  
  results.bandResults.forEach(band => {
    console.log(`${band.name} (${band.latitude}°): ${band.temperature.toFixed(2)}°C (Ice: ${(band.iceFactor * 100).toFixed(0)}%)`);
  });
}

// ======== TEST SCENARIO 1: PRESENT DAY CONDITIONS ========
console.log("\n\n🌍 SCENARIO 1: PRESENT DAY CONDITIONS");

const presentDayParams = {
  eccentricity: 0.0167,          // Current eccentricity
  axialTilt: 23.44,              // Current axial tilt (obliquity) in degrees
  precession: 102.0,             // Current precession angle in degrees
  co2Level: 415,                 // Current CO2 level (2023) in ppm
  season: 0.5,                   // Mid-year
  sensitivityLevel: 'medium'     // Medium climate sensitivity
};

// Amsterdam temperature (single location)
const presentDayAmsterdam = calculateGlobalTemperature({
  ...presentDayParams,
  latitude: 52.37  // Amsterdam
});
printTemperatureResults("Present day - Amsterdam", presentDayAmsterdam);

// Global regional calculation
const presentDayGlobal = calculateRegionalTemperatures(presentDayParams);
printRegionalResults("Present day - Global", presentDayGlobal);

// ======== TEST SCENARIO 2: LAST GLACIAL MAXIMUM (~20,000 YEARS AGO) ========
console.log("\n\n❄️ SCENARIO 2: LAST GLACIAL MAXIMUM (20,000 YEARS AGO)");

const lgmParams = {
  eccentricity: 0.019,           // Higher eccentricity during LGM
  axialTilt: 22.95,              // Lower axial tilt during LGM
  precession: 114.0,             // Different precession (perihelion in different season)
  co2Level: 180,                 // Lower CO2 during ice age
  season: 0.5,                   // Mid-year
  timeScaleYears: 10000,         // Full ice sheet development
  sensitivityLevel: 'medium'     // Medium climate sensitivity
};

// Global regional calculation
const lgmGlobal = calculateRegionalTemperatures(lgmParams);
printRegionalResults("Last Glacial Maximum - Global", lgmGlobal);

// Check 65°N specifically (critical for ice sheet formation)
const lgm65N = calculateGlobalTemperature({
  ...lgmParams,
  latitude: 65,
  season: 0.5  // Summer in Northern Hemisphere
});
printTemperatureResults("Last Glacial Maximum - 65°N", lgm65N);

// ======== TEST SCENARIO 3: MID-HOLOCENE OPTIMUM (~6,000 YEARS AGO) ========
console.log("\n\n☀️ SCENARIO 3: MID-HOLOCENE OPTIMUM (6,000 YEARS AGO)");

const midHoloceneParams = {
  eccentricity: 0.019,           // Higher eccentricity than today
  axialTilt: 24.1,               // Higher tilt than today
  precession: 0.0,               // Perihelion close to Northern Hemisphere summer
  co2Level: 265,                 // Slightly lower CO2 than pre-industrial
  season: 0.5,                   // Summer in Northern Hemisphere
  timeScaleYears: 5000,          // Long-term equilibrium
  sensitivityLevel: 'medium'
};

// Global regional calculation
const midHoloceneGlobal = calculateRegionalTemperatures(midHoloceneParams);
printRegionalResults("Mid-Holocene Optimum - Global", midHoloceneGlobal);

// ======== TEST SCENARIO 4: FUTURE HIGH CO2 SCENARIO (2100) ========
console.log("\n\n🔥 SCENARIO 4: FUTURE HIGH CO2 SCENARIO (YEAR 2100)");

const futureScenariosParams = {
  eccentricity: 0.0167,          // Same as present (negligible change over 100 years)
  axialTilt: 23.44,              // Same as present (negligible change over 100 years)
  precession: 102.0,             // Same as present (negligible change over 100 years)
  season: 0.5                    // Mid-year
};

// Test different climate sensitivities and CO2 levels
// RCP8.5 high-end scenario: ~1000 ppm CO2 by 2100
const future2100HighCO2 = calculateRegionalTemperatures({
  ...futureScenariosParams,
  co2Level: 1000,                // High-end projection for 2100
  timeScaleYears: 100,           // 100 years of adjustment (partial ocean response)
  sensitivityLevel: 'high'       // High climate sensitivity
});
printRegionalResults("Year 2100 - High Emissions & High Sensitivity", future2100HighCO2);

// RCP4.5 moderate scenario: ~550 ppm CO2 by 2100
const future2100ModerateCO2 = calculateRegionalTemperatures({
  ...futureScenariosParams,
  co2Level: 550,                 // Moderate projection for 2100
  timeScaleYears: 100,           // 100 years of adjustment
  sensitivityLevel: 'medium'     // Medium climate sensitivity
});
printRegionalResults("Year 2100 - Moderate Emissions & Medium Sensitivity", future2100ModerateCO2);

// ======== TEST SCENARIO 5: IMPACT OF TIMESCALES ========
console.log("\n\n⏱️ SCENARIO 5: IMPACT OF DIFFERENT TIMESCALES");

// Test the same CO2 increase with different response times
const co2DoubleImmediateResponse = calculateGlobalTemperature({
  ...presentDayParams,
  co2Level: 560,                 // Double pre-industrial CO2
  timeScaleYears: 0              // Immediate equilibrium response
});
printTemperatureResults("CO2 Doubling - Immediate Response", co2DoubleImmediateResponse);

const co2Double10yrResponse = calculateGlobalTemperature({
  ...presentDayParams,
  co2Level: 560,                 // Double pre-industrial CO2
  timeScaleYears: 10             // 10 year response (atmosphere and upper ocean)
});
printTemperatureResults("CO2 Doubling - 10 Year Response", co2Double10yrResponse);

const co2Double100yrResponse = calculateGlobalTemperature({
  ...presentDayParams,
  co2Level: 560,                 // Double pre-industrial CO2
  timeScaleYears: 100            // 100 year response (partial deep ocean)
});
printTemperatureResults("CO2 Doubling - 100 Year Response", co2Double100yrResponse);

const co2Double1000yrResponse = calculateGlobalTemperature({
  ...presentDayParams,
  co2Level: 560,                 // Double pre-industrial CO2
  timeScaleYears: 1000           // 1000 year response (most deep ocean, partial ice)
});
printTemperatureResults("CO2 Doubling - 1000 Year Response", co2Double1000yrResponse);

console.log("\n\nAll tests completed.");
