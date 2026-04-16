// Preset values are calibrated to produce a clear cold→warm progression
// in the 65°N annual-mean temperature model used by this playground.
// The orbital physics is real; exact historical values are approximated
// so each preset creates a meaningfully different climate outcome.
export const ERAS = {
  iceAge: {
    key: "iceAge",
    name: "Last Ice Age",
    shortLabel: "~21 k yrs ago",
    description:
      "21 k yrs ago — nearly circular orbit; ice sheets covered North America and northern Europe.",
    // Near-circular orbit → less seasonal amplification at 65°N → colder annual mean
    eccentricity: 0.005,
    axialTilt: 22.99,
    precession: 0,
  },
  today: {
    key: "today",
    name: "Today",
    shortLabel: "Today",
    description: "Current orbital configuration.",
    eccentricity: 0.0167,
    axialTilt: 23.44,
    precession: 0,
  },
  warm: {
    key: "warm",
    name: "Warm Period",
    shortLabel: "~6 k yrs ago",
    description:
      "6 k yrs ago — stretched orbit with N hemisphere summer near closest approach; warmer high latitudes.",
    // High eccentricity + N summer near perihelion (prec≈90°) → peak summer insolation at 65°N
    eccentricity: 0.058,
    axialTilt: 24.1,
    precession: 90,
  },
  future: {
    key: "future",
    name: "Future",
    shortLabel: "~50 k yrs ahead",
    description:
      "~50 k yrs from now — orbit circularising again; slightly cooler high-latitude summers.",
    eccentricity: 0.015,
    axialTilt: 23.2,
    precession: 180,
  },
};

export const ERA_ORDER = ["iceAge", "today", "warm", "future"];

const ECC_SPAN = 0.053;
const TILT_SPAN = 2.4;
const PREC_SPAN = 180;

function shortestPrecDelta(a, b) {
  const diff = (((a - b) % 360) + 540) % 360 - 180;
  return Math.abs(diff);
}

export function eraDistance(era, params) {
  const ecc = (params.eccentricity - era.eccentricity) / ECC_SPAN;
  const tilt = (params.axialTilt - era.axialTilt) / TILT_SPAN;
  const prec = shortestPrecDelta(params.precession, era.precession) / PREC_SPAN;
  return ecc * ecc + tilt * tilt + prec * prec;
}

export function findNearestEra(params, tolerance = 0.08) {
  let bestKey = null;
  let bestDist = Infinity;
  for (const key of ERA_ORDER) {
    const d = eraDistance(ERAS[key], params);
    if (d < bestDist) {
      bestDist = d;
      bestKey = key;
    }
  }
  return bestDist <= tolerance ? bestKey : null;
}

export function eraPlayheadPosition(params) {
  const dists = ERA_ORDER.map((k) => ({
    key: k,
    index: ERA_ORDER.indexOf(k),
    dist: eraDistance(ERAS[k], params),
  }));
  dists.sort((a, b) => a.dist - b.dist);
  const [a, b] = dists;
  const total = a.dist + b.dist;
  if (total < 1e-6) return a.index;
  const weight = b.dist / total;
  return a.index * weight + b.index * (1 - weight);
}
