# Earth and Sun texture assets

All maps are local, equirectangular, north-up geographically, with pixels vertically flipped at build time. Both KTX2 and WebP loaders use `flipY=false`. Day color is sRGB; packed normals, ocean masks, night intensity, clouds, and noise are linear data. No browser requests go to imagery providers.

## Sources and usage

- **Day:** NASA Blue Marble Next Generation, June 2004 base map, 5400×2700. Reto Stöckli / NASA Earth Observatory. [Collection](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/), [source JPEG](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/june/world.200406.3x5400x2700.jpg).
- **Night:** NASA Earth Observatory, Black Marble 2016 grayscale, NASA Earth Observatory / Joshua Stevens, using Suomi NPP VIIRS data from Miguel Román, NASA GSFC. [Collection](https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/), [source JPEG](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144897/BlackMarble_2016_01deg_gray.jpg).
- **Clouds:** NASA Blue Marble global cloud composite, 2048×1024. NASA Goddard Space Flight Center. [Source JPEG](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg). Static illustrative composite, not current weather.
- **Terrain:** NASA Earth Observatory's GEBCO 2008 elevation map. Jesse Allen / NASA Earth Observatory, using GEBCO data from the British Oceanographic Data Centre. [Collection and credit](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/), [source JPEG](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg). Used to derive subtle tangent-space normal detail; not a physical displacement model.

NASA imagery is generally available for informational/educational use under [NASA's imagery guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), subject to third-party credits and no implied endorsement. GEBCO data is available under [GEBCO's terms of use](https://www.gebco.net/data_and_products/gridded_bathymetry_data/gebco_2024/#terms). These assets contain no NASA logos or identifiable people. Credits above must accompany redistribution.

`flow-noise.png`, the ocean mask, and all shader animation are authored by this project. Cloud flow, solar granulation, prominence placement, daily rotation speed, and atmospheric thickness are illustrative. Geography and the June surface appearance are fixed when orbital parameters change. Night lights show modern human activity, including when comparing ancient orbital settings.

## Rebuilding

Download the four source JPEGs into an external scratch directory as `day.jpg`, `night.jpg`, `clouds.jpg`, and `height.jpg`. Then run:

```sh
npm ci
npm run textures:build -- /absolute/path/to/source-directory
```

The build uses Sharp and the pinned Basis Universal encoder. `SPACE_BASISU` can point to a compatible native encoder on another platform. The script generates mipmapped ETC1S KTX2 color/cloud/night maps, UASTC packed surface detail, and WebP fallbacks. Surface detail packs tangent normal X/Y into R/G and an ocean mask into B. Night intensity is masked to land, with the diffuse daytime baseline removed. The 4K tier upgrades the day map only; terrain/cloud/night detail stays at its useful 2K source resolution.

`manifest.json` records output dimensions and exact file sizes. `public/decoders/basis/` contains the unmodified decoder from the installed Three.js package, licensed Apache-2.0 (see its LICENSE). Rebuilding copies the matching decoder to avoid encoder/loader version drift.
