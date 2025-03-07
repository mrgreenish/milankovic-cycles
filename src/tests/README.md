# Scientific Validation Tests for Milankovitch Cycles Simulation

This directory contains tests to validate the scientific accuracy of the 3D visualization of Milankovitch cycles and related climate effects.

## Test Files

- `scene-scientific-test.js`: Validates the scientific accuracy of the 3D scene, orbital mechanics, Earth orientation, and temperature calculations.

## Testing Approach

The scientific validation tests focus on five key areas:

1. **Orbital Path Geometry**
   - Validates that orbit paths correctly follow elliptical geometry
   - Checks that the Sun is positioned at the correct focus of the ellipse
   - Tests different eccentricity values

2. **Earth Axial Tilt**
   - Verifies that the Earth's axial tilt is accurately represented in the 3D scene
   - Tests quaternion calculations used for rotation

3. **Seasonal Sun Position**
   - Validates that seasonal positions (equinoxes and solstices) are correctly calculated
   - Checks insolation patterns in northern and southern hemispheres match expected seasonal patterns

4. **Temperature Calculations**
   - Compares calculated global temperatures with known historical values
   - Verifies temperature gradients between poles and equator
   - Tests ice coverage factors in different climate regimes

5. **Milankovitch Cycle Periodicities**
   - Validates that the simulation uses scientifically accurate cycle periods:
     - Eccentricity: ~100,000 years
     - Axial Tilt: ~41,000 years
     - Precession: ~23,000 years

## Running the Tests

To run the scientific scene validation tests:

```bash
npm run test:scene
```

## Scientific References

The tests are based on established scientific understanding of Milankovitch cycles from these sources:

1. Berger, A. (1978). Long-term variations of daily insolation and Quaternary climatic changes. Journal of the Atmospheric Sciences, 35(12), 2362-2367.
2. Hays, J. D., Imbrie, J., & Shackleton, N. J. (1976). Variations in the Earth's orbit: pacemaker of the ice ages. Science, 194(4270), 1121-1132.
3. IPCC (2021). Climate Change 2021: The Physical Science Basis. Sixth Assessment Report.
4. Laskar, J., Robutel, P., Joutel, F., Gastineau, M., Correia, A. C. M., & Levrard, B. (2004). A long-term numerical solution for the insolation quantities of the Earth. Astronomy & Astrophysics, 428(1), 261-285.

## Interpreting Test Results

The test results will show a series of PASS/FAIL indicators for each test case. Any failures should be investigated as they may indicate inaccuracies in the scientific representation. The details provided with each test result offer guidance on the expected values and the actual calculated values. 