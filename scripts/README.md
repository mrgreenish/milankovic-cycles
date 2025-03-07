# Milankovitch Cycles Validation Scripts

This directory contains scripts for validating and fixing the scientific accuracy of the Milankovitch cycles simulation.

## Available Scripts

### `validate-parameters.js`

This script validates that all parameters and presets used in the application are scientifically accurate according to paleoclimate research.

It tests:
1. Orbital parameter ranges (eccentricity, axial tilt, precession)
2. CO2 levels for different geological periods
3. Temperature calculations for known climate states
4. Preset configurations for historical climate events

To run:
```bash
npm run test:validate
```

### `fix-presets.js`

This script analyzes the presets in the application and fixes any scientifically inaccurate parameters based on paleoclimate research.

It:
1. Reads the current presets from the main page component
2. Validates them against scientific data
3. Fixes any issues found
4. Updates the page.js file with corrected presets

To run:
```bash
npm run fix:presets
```

## Scientific References

The validation is based on the following scientific sources:

1. **Orbital Parameters**:
   - Berger, A. (1978). Long-term variations of daily insolation and Quaternary climatic changes. Journal of the Atmospheric Sciences, 35(12), 2362-2367.
   - Laskar, J., Robutel, P., Joutel, F., Gastineau, M., Correia, A. C. M., & Levrard, B. (2004). A long-term numerical solution for the insolation quantities of the Earth. Astronomy & Astrophysics, 428(1), 261-285.

2. **CO2 Levels**:
   - IPCC (2021). Climate Change 2021: The Physical Science Basis. Sixth Assessment Report.
   - Zachos, J. C., Dickens, G. R., & Zeebe, R. E. (2008). An early Cenozoic perspective on greenhouse warming and carbon-cycle dynamics. Nature, 451(7176), 279-283.

3. **Temperature Reconstructions**:
   - Snyder, C. W. (2016). Evolution of global temperature over the past two million years. Nature, 538(7624), 226-228.
   - Marcott, S. A., Shakun, J. D., Clark, P. U., & Mix, A. C. (2013). A reconstruction of regional and global temperature for the past 11,300 years. Science, 339(6124), 1198-1201.

4. **PETM (Paleocene-Eocene Thermal Maximum)**:
   - McInerney, F. A., & Wing, S. L. (2011). The Paleocene-Eocene Thermal Maximum: A perturbation of carbon cycle, climate, and biosphere with implications for the future. Annual Review of Earth and Planetary Sciences, 39, 489-516.
   - Zeebe, R. E., Zachos, J. C., & Dickens, G. R. (2009). Carbon dioxide forcing alone insufficient to explain Palaeocene–Eocene Thermal Maximum warming. Nature Geoscience, 2(8), 576-580.

## Usage in Development

These scripts should be run:
1. After making significant changes to the climate model
2. Before deploying new versions
3. When adding new presets or modifying existing ones

This ensures that the simulation maintains scientific accuracy while allowing for educational simplifications where appropriate. 