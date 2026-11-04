// Literal URLs let Next emit each asset separately with its own content hash.
export const TEXTURE_URLS = {
  "day-1024": {
    ktx2: new URL("../../../../public/textures/space/day-1024.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/day-1024.webp", import.meta.url).href,
  },
  "day-2048": {
    ktx2: new URL("../../../../public/textures/space/day-2048.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/day-2048.webp", import.meta.url).href,
  },
  "day-4096": {
    ktx2: new URL("../../../../public/textures/space/day-4096.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/day-4096.webp", import.meta.url).href,
  },
  "detail-1024": {
    ktx2: new URL("../../../../public/textures/space/detail-1024.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/detail-1024.webp", import.meta.url).href,
  },
  "detail-2048": {
    ktx2: new URL("../../../../public/textures/space/detail-2048.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/detail-2048.webp", import.meta.url).href,
  },
  "night-1024": {
    ktx2: new URL("../../../../public/textures/space/night-1024.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/night-1024.webp", import.meta.url).href,
  },
  "night-2048": {
    ktx2: new URL("../../../../public/textures/space/night-2048.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/night-2048.webp", import.meta.url).href,
  },
  "clouds-1024": {
    ktx2: new URL("../../../../public/textures/space/clouds-1024.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/clouds-1024.webp", import.meta.url).href,
  },
  "clouds-2048": {
    ktx2: new URL("../../../../public/textures/space/clouds-2048.ktx2", import.meta.url).href,
    image: new URL("../../../../public/textures/space/clouds-2048.webp", import.meta.url).href,
  },
  "flow-noise": {
    ktx2: null,
    image: new URL("../../../../public/textures/space/flow-noise.png", import.meta.url).href,
  },
} as const;
