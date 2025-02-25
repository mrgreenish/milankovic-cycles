/**
 * Regional Temperature Visualization Examples
 * 
 * This file demonstrates how to use the regional temperature calculations
 * to visualize temperature changes across different latitudes.
 */

import { 
  calculateGlobalTemperature, 
  calculateRegionalTemperatures 
} from '../lib/temperatureUtils.js';

/**
 * Generate ASCII visualization of temperatures across latitudes
 * 
 * @param {string} title - Title for the visualization
 * @param {Object} regionalResults - Results from calculateRegionalTemperatures
 * @param {number} minTemp - Minimum temperature for scaling (°C)
 * @param {number} maxTemp - Maximum temperature for scaling (°C)
 */
function visualizeLatitudeTemperatures(title, regionalResults, minTemp = -20, maxTemp = 30) {
  const width = 60; // Width of visualization
  
  console.log(`\n===== ${title} =====`);
  console.log(`Global average: ${regionalResults.globalTemperature.toFixed(1)}°C\n`);
  
  // Sort bands by latitude from north to south
  const sortedBands = [...regionalResults.bandResults].sort((a, b) => b.latitude - a.latitude);
  
  sortedBands.forEach(band => {
    // Normalize temperature to 0-1 range for visualization
    const normalizedTemp = Math.max(0, Math.min(1, (band.temperature - minTemp) / (maxTemp - minTemp)));
    const barLength = Math.round(normalizedTemp * width);
    
    // Choose character based on ice factor
    const barChar = band.iceFactor > 0.5 ? '❄' : (band.temperature > 20 ? '🔥' : '■');
    
    // Create the bar with temperature indicator
    const bar = barChar.repeat(barLength);
    
    // Pad latitude string
    const latString = band.latitude.toString().padStart(4, ' ');
    
    // Print the visualization line
    console.log(`${latString}° | ${band.temperature.toFixed(1).padStart(5, ' ')}°C | ${bar}`);
  });
  
  // Print the temperature scale
  console.log('\n     Temperature scale:');
  console.log(`     ${minTemp}°C ${'-'.repeat(width-12)} ${maxTemp}°C`);
}

/**
 * Compare two regional temperature scenarios side by side
 * 
 * @param {string} title - Title for the comparison
 * @param {Object} scenario1 - First scenario results
 * @param {string} label1 - Label for first scenario
 * @param {Object} scenario2 - Second scenario results
 * @param {string} label2 - Label for second scenario
 */
function compareScenarios(title, scenario1, label1, scenario2, label2) {
  console.log(`\n===== ${title} =====`);
  console.log(`Global averages: ${label1}: ${scenario1.globalTemperature.toFixed(1)}°C | ${label2}: ${scenario2.globalTemperature.toFixed(1)}°C\n`);
  
  // Sort bands by latitude from north to south
  const sortedBands1 = [...scenario1.bandResults].sort((a, b) => b.latitude - a.latitude);
  const sortedBands2 = [...scenario2.bandResults].sort((a, b) => b.latitude - a.latitude);
  
  // Print header
  console.log(`Latitude | ${label1.padEnd(15)} | ${label2.padEnd(15)} | Difference`);
  console.log(`-`.repeat(65));
  
  // Print each latitude comparison
  for (let i = 0; i < sortedBands1.length; i++) {
    const band1 = sortedBands1[i];
    const band2 = sortedBands2[i];
    const difference = band2.temperature - band1.temperature;
    const diffSymbol = difference > 0 ? '↑' : (difference < 0 ? '↓' : '=');
    
    console.log(
      `${band1.latitude.toString().padStart(4, ' ')}° | ` +
      `${band1.temperature.toFixed(1).padStart(5, ' ')}°C (${(band1.iceFactor * 100).toFixed(0)}% ice) | ` +
      `${band2.temperature.toFixed(1).padStart(5, ' ')}°C (${(band2.iceFactor * 100).toFixed(0)}% ice) | ` +
      `${diffSymbol} ${Math.abs(difference).toFixed(1)}°C`
    );
  }
}

// ========== EXAMPLE 1: LATITUDE TEMPERATURE PROFILE - PRESENT DAY ==========
console.log("\n🌍 EXAMPLE 1: PRESENT DAY TEMPERATURE PROFILE BY LATITUDE");

const presentDayParams = {
  eccentricity: 0.0167,          // Current eccentricity
  axialTilt: 23.44,              // Current axial tilt (obliquity) in degrees
  precession: 102.0,             // Current precession angle in degrees
  co2Level: 415,                 // Current CO2 level (2023) in ppm
  season: 0.5,                   // Mid-year (Northern Hemisphere summer)
  sensitivityLevel: 'medium'     // Medium climate sensitivity
};

const presentDayRegional = calculateRegionalTemperatures(presentDayParams);
visualizeLatitudeTemperatures("Present Day Temperature Profile", presentDayRegional);

// ========== EXAMPLE 2: COMPARING ICE AGE VS PRESENT ==========
console.log("\n\n❄️ EXAMPLE 2: ICE AGE VS PRESENT DAY");

const iceAgeParams = {
  eccentricity: 0.019,           // Higher eccentricity during LGM
  axialTilt: 22.95,              // Lower axial tilt during LGM
  precession: 114.0,             // Different precession
  co2Level: 180,                 // Lower CO2 during ice age
  season: 0.5,                   // Mid-year
  timeScaleYears: 10000,         // Full ice sheet development
  sensitivityLevel: 'medium'     // Medium climate sensitivity
};

const iceAgeRegional = calculateRegionalTemperatures(iceAgeParams);
visualizeLatitudeTemperatures("Ice Age Temperature Profile", iceAgeRegional, -30, 30);

// Compare the two scenarios
compareScenarios(
  "Ice Age vs Present Day Comparison",
  iceAgeRegional,
  "Ice Age",
  presentDayRegional,
  "Present Day"
);

// ========== EXAMPLE 3: ORBITAL VS CO2 EFFECTS ==========
console.log("\n\n🔄 EXAMPLE 3: ISOLATING ORBITAL VS CO2 EFFECTS");

// Scenario with only orbital changes (ice age orbit, present CO2)
const orbitalOnlyParams = {
  ...iceAgeParams,
  co2Level: 415,              // Present day CO2
  timeScaleYears: 5000        // Partial ice sheet response
};
const orbitalOnlyRegional = calculateRegionalTemperatures(orbitalOnlyParams);

// Scenario with only CO2 changes (present orbit, ice age CO2)
const co2OnlyParams = {
  ...presentDayParams,
  co2Level: 180,              // Ice age CO2
  timeScaleYears: 5000        // Partial deep ocean equilibrium
};
const co2OnlyRegional = calculateRegionalTemperatures(co2OnlyParams);

// Compare orbital vs CO2 effects
compareScenarios(
  "Orbital Changes vs CO2 Changes",
  presentDayRegional,
  "Present Day",
  orbitalOnlyRegional,
  "Orbital Changes"
);

compareScenarios(
  "Orbital Changes vs CO2 Changes",
  presentDayRegional,
  "Present Day",
  co2OnlyRegional,
  "CO2 Changes"
);

// ========== EXAMPLE 4: SEASONAL VARIATIONS BY LATITUDE ==========
console.log("\n\n🌞 EXAMPLE 4: SEASONAL VARIATIONS BY LATITUDE");

// Function to calculate temperatures for a specific season
function calculateSeasonalTemperatures(params, seasonValue, seasonName) {
  const seasonalParams = {
    ...params,
    season: seasonValue
  };
  const results = calculateRegionalTemperatures(seasonalParams);
  return {
    ...results,
    seasonName
  };
}

// Calculate temperatures for different seasons
const summerResults = calculateSeasonalTemperatures(presentDayParams, 0.5, "Summer");
const winterResults = calculateSeasonalTemperatures(presentDayParams, 0.0, "Winter");

// Compare summer vs winter
compareScenarios(
  "Summer vs Winter Temperature Comparison",
  winterResults,
  "Winter",
  summerResults,
  "Summer"
);

// ========== EXAMPLE 5: POLAR AMPLIFICATION IN WARMING SCENARIO ==========
console.log("\n\n🌡️ EXAMPLE 5: POLAR AMPLIFICATION IN WARMING SCENARIO");

// High emission scenario
const highEmissionParams = {
  ...presentDayParams,
  co2Level: 800,                 // High emission scenario
  timeScaleYears: 100            // 100-year response
};
const highEmissionRegional = calculateRegionalTemperatures(highEmissionParams);

// Calculate and display polar amplification factors
console.log("\n===== Polar Amplification Factors =====");
console.log("Latitude | Temp Change | Amplification Factor");
console.log("-".repeat(50));

const globalMeanChange = highEmissionRegional.globalTemperature - presentDayRegional.globalTemperature;

highEmissionRegional.bandResults.forEach(band => {
  const presentBand = presentDayRegional.bandResults.find(b => b.latitude === band.latitude);
  const tempChange = band.temperature - presentBand.temperature;
  const amplificationFactor = tempChange / globalMeanChange;
  
  console.log(
    `${band.latitude.toString().padStart(4, ' ')}° | ` +
    `${tempChange.toFixed(1).padStart(5, ' ')}°C | ` +
    `${amplificationFactor.toFixed(1).padStart(5, ' ')}x`
  );
});

// Visualize the high emission scenario
visualizeLatitudeTemperatures("High Emission Scenario (800 ppm CO2)", highEmissionRegional);

// ========== EXAMPLE 6: INTERACTIVE REGIONAL CLIMATE EXPLORER SIMULATION ==========
console.log("\n\n🔍 EXAMPLE 6: INTERACTIVE REGIONAL CLIMATE EXPLORER");
console.log("\nTo create an interactive visualization in your application:");
console.log("1. Use the regional temperature calculations to generate data for all latitudes");
console.log("2. Map the temperature values to colors (blue for cold, red for warm)");
console.log("3. Render a world map with color gradients based on latitude temperatures");
console.log("4. Add sliders for parameters like CO2, orbital values, and time scale");
console.log("5. Update the visualization in real-time as users adjust parameters\n");

console.log("Example pseudocode for a React-based interactive component:");
console.log(`
// In your React component
function ClimateExplorer() {
  const [params, setParams] = useState({
    eccentricity: 0.0167,
    axialTilt: 23.44,
    precession: 102.0,
    co2Level: 415,
    season: 0.5,
    timeScaleYears: 0,
    sensitivityLevel: 'medium'
  });
  
  // Calculate temperatures whenever params change
  const regionalData = useMemo(() => 
    calculateRegionalTemperatures(params), 
    [params]
  );
  
  // Render a map colored by temperature with interactive controls
  return (
    <div>
      <TemperatureMap data={regionalData} />
      <ControlPanel 
        params={params} 
        onChange={newParams => setParams(newParams)} 
      />
    </div>
  );
}
`);

console.log("\nAll regional temperature visualization examples completed."); 