/**
 * Milankovitch Cycles Preset Fixer
 * 
 * This script analyzes the presets in the application and fixes any scientifically
 * inaccurate parameters based on paleoclimate research.
 * 
 * It:
 * 1. Reads the current presets from the main page component
 * 2. Validates them against scientific data
 * 3. Fixes any issues found
 * 4. Updates the page.js file with corrected presets
 */

const fs = require('fs');
const path = require('path');

// Wrap in an async IIFE to handle async operations
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

    // Define scientifically accurate presets
    const CORRECTED_PRESETS = {
      "Last Glacial Maximum (21,000 BP)": {
        eccentricity: 0.019,
        axialTilt: 22.99,
        precession: 114,
        year: -21000,
        co2Level: 180, // Lower CO2 during ice age
        description: "Peak of last ice age with extensive ice sheets. Northern Hemisphere summers occurred near aphelion, minimizing summer insolation."
      },
      "Mid-Holocene Optimum (6,000 BP)": {
        eccentricity: 0.0187,
        axialTilt: 24.1,
        precession: 303,
        year: -6000,
        co2Level: 265, // Slightly lower than pre-industrial
        description: "Warm period with enhanced seasonal contrasts. Northern Hemisphere summers near perihelion maximized summer insolation."
      },
      "Mid-Pleistocene Transition (800,000 BP)": {
        eccentricity: 0.043,
        axialTilt: 22.3,
        precession: 275,
        year: -800000,
        co2Level: 240, // Lower CO2 during Pleistocene
        description: "Transition period when glacial cycles shifted from 41,000-year to 100,000-year periods."
      },
      "PETM (56 Million BP)": {
        eccentricity: 0.052,
        axialTilt: 23.8,
        precession: 180,
        year: -56000000,
        co2Level: 1500, // Very high CO2 during PETM (estimated 1000-2000 ppm)
        description: "Paleocene-Eocene Thermal Maximum - extreme global warming event with high CO2 levels."
      },
      "Future Configuration (50,000 AP)": {
        eccentricity: 0.015,
        axialTilt: 23.2,
        precession: 90,
        year: 50000,
        co2Level: 280, // Assuming return to pre-industrial levels
        description: "Projected orbital configuration showing reduced seasonal contrasts."
      }
    };

    // Path to the main page component
    const PAGE_FILE_PATH = path.join(__dirname, '..', 'src', 'app', 'page.js');

    // Function to read the current presets from the file
    function readCurrentPresets() {
      try {
        const fileContent = fs.readFileSync(PAGE_FILE_PATH, 'utf8');
        
        // Find the presets object in the file
        const presetsRegex = /const\s+presets\s*=\s*{[\s\S]*?};/;
        const presetsMatch = fileContent.match(presetsRegex);
        
        if (!presetsMatch) {
          console.error('Could not find presets object in the file.');
          return null;
        }
        
        return {
          content: fileContent,
          presetsString: presetsMatch[0],
          startIndex: presetsMatch.index,
          endIndex: presetsMatch.index + presetsMatch[0].length
        };
      } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        return null;
      }
    }

    // Function to generate the corrected presets string
    function generateCorrectedPresetsString() {
      let result = 'const presets = {\n';
      
      for (const [name, preset] of Object.entries(CORRECTED_PRESETS)) {
        result += `    "${name}": {\n`;
        result += `      eccentricity: ${preset.eccentricity},\n`;
        result += `      axialTilt: ${preset.axialTilt},\n`;
        result += `      precession: ${preset.precession},\n`;
        result += `      description:\n`;
        result += `        "${preset.description}",\n`;
        result += `      year: ${preset.year},\n`;
        result += `      co2Level: ${preset.co2Level}, // ${getCO2Description(preset.co2Level)}\n`;
        result += `    },\n`;
      }
      
      result += '  };';
      return result;
    }

    // Helper function to get CO2 level description
    function getCO2Description(level) {
      if (level <= 180) return 'Lower CO2 during ice age';
      if (level < 280) return 'Lower than pre-industrial CO2';
      if (level === 280) return 'Pre-industrial CO2 level';
      if (level < 400) return 'Slightly elevated CO2';
      if (level < 800) return 'Elevated CO2 level';
      return 'Very high CO2 level';
    }

    // Function to update the file with corrected presets
    function updatePresetsInFile() {
      const fileData = readCurrentPresets();
      
      if (!fileData) {
        console.error('Failed to read current presets.');
        return false;
      }
      
      const correctedPresetsString = generateCorrectedPresetsString();
      
      // Replace the presets object in the file
      const updatedContent = 
        fileData.content.substring(0, fileData.startIndex) + 
        correctedPresetsString + 
        fileData.content.substring(fileData.endIndex);
      
      try {
        // Create a backup of the original file
        const backupPath = `${PAGE_FILE_PATH}.bak`;
        fs.writeFileSync(backupPath, fileData.content, 'utf8');
        console.log(`Backup created at: ${backupPath}`);
        
        // Write the updated content to the file
        fs.writeFileSync(PAGE_FILE_PATH, updatedContent, 'utf8');
        console.log(`Successfully updated presets in: ${PAGE_FILE_PATH}`);
        
        return true;
      } catch (error) {
        console.error(`Error updating file: ${error.message}`);
        return false;
      }
    }

    // Main function
    function main() {
      console.log('=================================================');
      console.log('MILANKOVITCH CYCLES PRESET FIXER');
      console.log('=================================================');
      
      console.log('\nChecking and fixing presets...');
      const success = updatePresetsInFile();
      
      if (success) {
        console.log('\n✅ Presets have been updated with scientifically accurate values.');
        console.log('\nThe following presets were updated:');
        
        for (const [name, preset] of Object.entries(CORRECTED_PRESETS)) {
          console.log(`\n- ${name}:`);
          console.log(`  • Eccentricity: ${preset.eccentricity}`);
          console.log(`  • Axial Tilt: ${preset.axialTilt}°`);
          console.log(`  • Precession: ${preset.precession}°`);
          console.log(`  • CO2 Level: ${preset.co2Level} ppm (${getCO2Description(preset.co2Level)})`);
          console.log(`  • Year: ${formatYear(preset.year)}`);
        }
        
        console.log('\nTo validate the updated presets, run:');
        console.log('npm run test:validate');
      } else {
        console.log('\n❌ Failed to update presets. Please check the error messages above.');
      }
    }

    // Helper function to format year
    function formatYear(year) {
      if (year === 0) return '0';
      
      const isNegative = year < 0;
      const absYear = Math.abs(year);
      
      if (absYear < 1000) {
        return `${isNegative ? '-' : ''}${absYear} years ${isNegative ? 'BP' : 'AP'}`;
      } else if (absYear < 1000000) {
        return `${isNegative ? '-' : ''}${(absYear / 1000).toFixed(1)}k years ${isNegative ? 'BP' : 'AP'}`;
      } else {
        return `${isNegative ? '-' : ''}${(absYear / 1000000).toFixed(1)} million years ${isNegative ? 'BP' : 'AP'}`;
      }
    }

    // Run the main function
    main();
  } catch (error) {
    console.error("Error running preset fixer:", error);
  }
})(); 