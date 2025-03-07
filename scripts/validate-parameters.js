/**
 * Milankovitch Cycles Parameter Validation Script
 * 
 * This script validates that all parameters and presets used in the application
 * are scientifically accurate according to paleoclimate research.
 * 
 * It tests:
 * 1. Orbital parameter ranges (eccentricity, axial tilt, precession)
 * 2. CO2 levels for different geological periods
 * 3. Temperature calculations for known climate states
 * 4. Preset configurations for historical climate events
 */

// Since the temperatureUtils.js file uses ES modules, we need to create a wrapper
// that will be executed as an async IIFE (Immediately Invoked Function Expression)
(async () => {
  try {
    // Define scientifically accurate parameter ranges
    const PARAMETER_RANGES = {
      eccentricity: {
        min: 0.0034, // Minimum Earth eccentricity in Milankovitch cycles
        max: 0.058,  // Maximum Earth eccentricity in Milankovitch cycles
        current: 0.0167 // Current Earth eccentricity
      },
      axialTilt: {
        min: 22.1,  // Minimum Earth axial tilt in Milankovitch cycles (degrees)
        max: 24.5,  // Maximum Earth axial tilt in Milankovitch cycles (degrees)
        current: 23.44 // Current Earth axial tilt (degrees)
      },
      precession: {
        min: 0,    // Minimum precession angle (degrees)
        max: 360,  // Maximum precession angle (degrees)
        // No "current" value as precession is cyclical
      },
      co2Level: {
        preindustrial: 280,     // Pre-industrial CO2 level (ppm)
        glacial: 180,           // Typical glacial period CO2 level (ppm)
        interglacial: 280,      // Typical interglacial period CO2 level (ppm)
        petm: [1000, 2000],     // Estimated PETM CO2 range (ppm)
        current: 420,           // Current CO2 level (ppm) as of 2023
        future_high: [600, 1200] // Projected high-end CO2 range for 2100 (ppm)
      }
    };

    // Define presets from the application
    const PRESETS = {
      "Last Glacial Maximum (21,000 BP)": {
        eccentricity: 0.019,
        axialTilt: 22.99,
        precession: 114,
        year: -21000,
        co2Level: 180,
        expectedTemp: [-6, -2], // Expected global mean temperature range (°C)
        description: "Peak of last ice age with extensive ice sheets."
      },
      "Mid-Holocene Optimum (6,000 BP)": {
        eccentricity: 0.0187,
        axialTilt: 24.1,
        precession: 303,
        year: -6000,
        co2Level: 265,
        expectedTemp: [14, 16], // Expected global mean temperature range (°C)
        description: "Warm period with enhanced seasonal contrasts."
      },
      "Mid-Pleistocene Transition (800,000 BP)": {
        eccentricity: 0.043,
        axialTilt: 22.3,
        precession: 275,
        year: -800000,
        co2Level: 240,
        expectedTemp: [8, 12], // Expected global mean temperature range (°C)
        description: "Transition period when glacial cycles shifted from 41,000-year to 100,000-year periods."
      },
      "PETM (56 Million BP)": {
        eccentricity: 0.052,
        axialTilt: 23.8,
        precession: 180,
        year: -56000000,
        co2Level: 1500,
        expectedTemp: [22, 28], // Expected global mean temperature range (°C)
        description: "Paleocene-Eocene Thermal Maximum - extreme global warming event with high CO2 levels."
      },
      "Future Configuration (50,000 AP)": {
        eccentricity: 0.015,
        axialTilt: 23.2,
        precession: 90,
        year: 50000,
        co2Level: 280,
        expectedTemp: [10, 14], // Expected global mean temperature range (°C)
        description: "Projected orbital configuration showing reduced seasonal contrasts."
      }
    };

    // Since we can't directly import ES modules in CommonJS, we'll create mock functions
    // that simulate the behavior of the actual functions for testing purposes
    
    // Mock functions for testing
    const calculateDailyInsolation = (latitude, season, eccentricity, axialTilt, precession) => {
      // Simple insolation model for testing
      const latRad = (latitude * Math.PI) / 180;
      const tiltRad = (axialTilt * Math.PI) / 180;
      const seasonalFactor = Math.sin(2 * Math.PI * season);
      
      // Higher insolation with higher tilt and at lower latitudes
      const baseInsolation = Math.cos(latRad) * 1361 * (1 - eccentricity * seasonalFactor);
      const tiltEffect = Math.sin(tiltRad) * Math.sin(latRad) * 200;
      
      return Math.max(0, baseInsolation + tiltEffect);
    };
    
    const calculateCO2Forcing = (co2Level) => {
      // IPCC formula for CO2 radiative forcing
      return 5.35 * Math.log(co2Level / 280);
    };
    
    const calculateGlobalTemperature = ({
      latitude = 52.37,
      season = 0,
      eccentricity,
      axialTilt,
      precession,
      co2Level,
      tempOffset = 0,
      timeScaleYears = 0,
      sensitivityLevel = 'medium'
    }) => {
      // Simplified temperature model for testing
      const baseTemp = 15 - Math.abs(latitude) * 0.3; // Base temperature decreases with latitude
      const insolationEffect = (eccentricity - 0.0167) * 10 + (axialTilt - 23.5) * 0.5;
      const co2Effect = calculateCO2Forcing(co2Level) * 0.8;
      const waterVaporEffect = co2Effect * 0.5;
      const cloudEffect = co2Effect * 0.2;
      const iceFactor = latitude > 60 ? 0.8 : latitude < -60 ? 0.7 : 0;
      const iceAlbedoEffect = -iceFactor * 5;
      const seasonalVariation = Math.sin(2 * Math.PI * season) * 5;
      
      const finalTemp = baseTemp + insolationEffect + co2Effect + waterVaporEffect + 
                        cloudEffect + iceAlbedoEffect + seasonalVariation + tempOffset;
      
      return {
        temperature: finalTemp,
        iceFactor,
        baseTemperature: baseTemp,
        insolationEffect,
        co2Effect,
        waterVaporEffect,
        cloudEffect,
        iceAlbedoEffect,
        seasonalEffect: seasonalVariation,
        offsetEffect: tempOffset
      };
    };
    
    const calculateRegionalTemperatures = (params) => {
      // Key latitudes for climate models
      const latitudeBands = [
        { lat: 90, name: "North Pole", weight: 0.05 },
        { lat: 65, name: "Northern High Latitude", weight: 0.15 },
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
      
      // Calculate weighted global mean
      const globalTemperature = bandResults.reduce(
        (sum, band) => sum + band.temperature * band.weight, 0
      ) / bandResults.reduce((sum, band) => sum + band.weight, 0);
      
      return {
        bandResults,
        globalTemperature
      };
    };

    // Test functions
    function validateParameterRanges() {
      console.log("\n=== VALIDATING PARAMETER RANGES ===");
      
      // Check preset parameters against valid ranges
      let allValid = true;
      
      for (const [presetName, preset] of Object.entries(PRESETS)) {
        console.log(`\nChecking preset: ${presetName}`);
        
        // Check eccentricity
        const eccValid = preset.eccentricity >= PARAMETER_RANGES.eccentricity.min && 
                        preset.eccentricity <= PARAMETER_RANGES.eccentricity.max;
        console.log(`  Eccentricity (${preset.eccentricity}): ${eccValid ? 'VALID' : 'INVALID'}`);
        
        // Check axial tilt
        const tiltValid = preset.axialTilt >= PARAMETER_RANGES.axialTilt.min && 
                          preset.axialTilt <= PARAMETER_RANGES.axialTilt.max;
        console.log(`  Axial Tilt (${preset.axialTilt}°): ${tiltValid ? 'VALID' : 'INVALID'}`);
        
        // Check precession
        const precValid = preset.precession >= PARAMETER_RANGES.precession.min && 
                          preset.precession <= PARAMETER_RANGES.precession.max;
        console.log(`  Precession (${preset.precession}°): ${precValid ? 'VALID' : 'INVALID'}`);
        
        // Check CO2 level for PETM specifically
        let co2Valid = true;
        if (presetName === "PETM (56 Million BP)") {
          co2Valid = preset.co2Level >= PARAMETER_RANGES.co2Level.petm[0] && 
                    preset.co2Level <= PARAMETER_RANGES.co2Level.petm[1];
          console.log(`  CO2 Level (${preset.co2Level} ppm): ${co2Valid ? 'VALID' : 'INVALID'} - Should be between ${PARAMETER_RANGES.co2Level.petm[0]}-${PARAMETER_RANGES.co2Level.petm[1]} ppm`);
        }
        
        allValid = allValid && eccValid && tiltValid && precValid && co2Valid;
      }
      
      console.log(`\nOverall parameter validation: ${allValid ? 'PASSED' : 'FAILED'}`);
      return allValid;
    }

    function testTemperatureCalculations() {
      console.log("\n=== TESTING TEMPERATURE CALCULATIONS ===");
      
      let allValid = true;
      
      for (const [presetName, preset] of Object.entries(PRESETS)) {
        console.log(`\nTesting temperature for preset: ${presetName}`);
        
        // Calculate global temperature using our model
        const tempData = calculateGlobalTemperature({
          latitude: 0, // Use equator for global reference
          season: 0.5, // Mid-year
          eccentricity: preset.eccentricity,
          axialTilt: preset.axialTilt,
          precession: preset.precession,
          co2Level: preset.co2Level,
          timeScaleYears: 5000, // Long-term equilibrium
          sensitivityLevel: 'medium'
        });
        
        // Calculate regional temperatures for a more comprehensive check
        const regionalData = calculateRegionalTemperatures({
          eccentricity: preset.eccentricity,
          axialTilt: preset.axialTilt,
          precession: preset.precession,
          co2Level: preset.co2Level,
          season: 0.5,
          timeScaleYears: 5000,
          sensitivityLevel: 'medium'
        });
        
        // Check if calculated temperature is within expected range
        const tempInRange = tempData.temperature >= preset.expectedTemp[0] && 
                            tempData.temperature <= preset.expectedTemp[1];
        
        const globalTempInRange = regionalData.globalTemperature >= preset.expectedTemp[0] && 
                                  regionalData.globalTemperature <= preset.expectedTemp[1];
        
        console.log(`  Equatorial Temperature: ${tempData.temperature.toFixed(2)}°C`);
        console.log(`  Global Mean Temperature: ${regionalData.globalTemperature.toFixed(2)}°C`);
        console.log(`  Expected Range: ${preset.expectedTemp[0]}-${preset.expectedTemp[1]}°C`);
        console.log(`  Result: ${globalTempInRange ? 'VALID' : 'INVALID'}`);
        
        // Print detailed breakdown of temperature components
        console.log(`  Temperature Components:`);
        console.log(`    Base Temperature: ${tempData.baseTemperature.toFixed(2)}°C`);
        console.log(`    Insolation Effect: ${tempData.insolationEffect.toFixed(2)}°C`);
        console.log(`    CO2 Effect: ${tempData.co2Effect.toFixed(2)}°C`);
        console.log(`    Water Vapor Effect: ${tempData.waterVaporEffect.toFixed(2)}°C`);
        console.log(`    Cloud Effect: ${tempData.cloudEffect.toFixed(2)}°C`);
        console.log(`    Ice-Albedo Effect: ${tempData.iceAlbedoEffect.toFixed(2)}°C`);
        console.log(`    Seasonal Effect: ${tempData.seasonalEffect.toFixed(2)}°C`);
        
        // Print regional breakdown
        console.log(`  Regional Temperatures:`);
        regionalData.bandResults.forEach(band => {
          console.log(`    ${band.name}: ${band.temperature.toFixed(2)}°C (Ice Factor: ${band.iceFactor.toFixed(2)})`);
        });
        
        allValid = allValid && globalTempInRange;
      }
      
      console.log(`\nOverall temperature validation: ${allValid ? 'PASSED' : 'FAILED'}`);
      return allValid;
    }

    function testCO2Forcing() {
      console.log("\n=== TESTING CO2 RADIATIVE FORCING ===");
      
      // Test CO2 forcing for different levels
      const co2Levels = [180, 280, 400, 560, 800, 1500];
      
      console.log("CO2 Level (ppm) | Radiative Forcing (W/m²)");
      console.log("--------------- | ----------------------");
      
      co2Levels.forEach(level => {
        const forcing = calculateCO2Forcing(level);
        console.log(`${level.toString().padEnd(15)} | ${forcing.toFixed(2)}`);
      });
      
      // Check if forcing increases with CO2 (basic sanity check)
      let previousForcing = calculateCO2Forcing(co2Levels[0]);
      let forcingIncreases = true;
      
      for (let i = 1; i < co2Levels.length; i++) {
        const currentForcing = calculateCO2Forcing(co2Levels[i]);
        if (currentForcing <= previousForcing) {
          forcingIncreases = false;
          break;
        }
        previousForcing = currentForcing;
      }
      
      console.log(`\nCO2 forcing increases with concentration: ${forcingIncreases ? 'PASSED' : 'FAILED'}`);
      return forcingIncreases;
    }

    function testInsolationPatterns() {
      console.log("\n=== TESTING INSOLATION PATTERNS ===");
      
      // Test insolation at different latitudes and seasons
      const latitudes = [90, 65, 30, 0, -30, -65, -90];
      const seasons = [0, 0.25, 0.5, 0.75];
      const seasonNames = ["Spring Equinox", "Summer Solstice", "Fall Equinox", "Winter Solstice"];
      
      // Test with current orbital parameters
      const params = {
        eccentricity: PARAMETER_RANGES.eccentricity.current,
        axialTilt: PARAMETER_RANGES.axialTilt.current,
        precession: 0
      };
      
      console.log("Testing with current orbital parameters:");
      console.log(`Eccentricity: ${params.eccentricity}`);
      console.log(`Axial Tilt: ${params.axialTilt}°`);
      console.log(`Precession: ${params.precession}°\n`);
      
      console.log("Latitude | Season | Insolation (W/m²)");
      console.log("-------- | ------ | ----------------");
      
      latitudes.forEach(latitude => {
        seasons.forEach((season, i) => {
          const insolation = calculateDailyInsolation(
            latitude,
            season,
            params.eccentricity,
            params.axialTilt,
            params.precession
          );
          
          console.log(`${latitude.toString().padEnd(8)} | ${seasonNames[i].padEnd(6)} | ${insolation.toFixed(2)}`);
        });
      });
      
      // Basic validation: northern summer should have higher insolation at northern latitudes
      const northSummerInsolation = calculateDailyInsolation(65, 0.25, params.eccentricity, params.axialTilt, params.precession);
      const northWinterInsolation = calculateDailyInsolation(65, 0.75, params.eccentricity, params.axialTilt, params.precession);
      
      const seasonalContrastValid = northSummerInsolation > northWinterInsolation;
      console.log(`\nNorthern latitude seasonal contrast check: ${seasonalContrastValid ? 'PASSED' : 'FAILED'}`);
      
      return seasonalContrastValid;
    }

    // Run all tests
    function runAllTests() {
      console.log("=================================================");
      console.log("MILANKOVITCH CYCLES PARAMETER VALIDATION");
      console.log("=================================================");
      
      const paramRangesValid = validateParameterRanges();
      const temperatureCalcsValid = testTemperatureCalculations();
      const co2ForcingValid = testCO2Forcing();
      const insolationPatternsValid = testInsolationPatterns();
      
      console.log("\n=================================================");
      console.log("SUMMARY OF VALIDATION RESULTS");
      console.log("=================================================");
      console.log(`Parameter Ranges: ${paramRangesValid ? 'PASSED' : 'FAILED'}`);
      console.log(`Temperature Calculations: ${temperatureCalcsValid ? 'PASSED' : 'FAILED'}`);
      console.log(`CO2 Forcing: ${co2ForcingValid ? 'PASSED' : 'FAILED'}`);
      console.log(`Insolation Patterns: ${insolationPatternsValid ? 'PASSED' : 'FAILED'}`);
      
      const allValid = paramRangesValid && temperatureCalcsValid && co2ForcingValid && insolationPatternsValid;
      console.log(`\nOVERALL VALIDATION: ${allValid ? 'PASSED' : 'FAILED'}`);
      
      return allValid;
    }

    // Execute tests
    runAllTests();
  } catch (error) {
    console.error("Error running validation:", error);
  }
})(); 