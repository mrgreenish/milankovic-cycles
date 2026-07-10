import {
  degreesToRadians,
  displayEccentricity,
} from "@/lib/orbital/geometry";
import type { OrbitScale, OrbitalParameters } from "@/lib/orbital/types";

export function OrbitalPoster({
  parameters,
  scale,
}: {
  parameters: OrbitalParameters;
  scale: OrbitScale;
}) {
  const eccentricity = displayEccentricity(parameters.eccentricity, scale);
  const a = 222;
  const b = a * Math.sqrt(1 - eccentricity * eccentricity);
  const c = a * eccentricity;
  const trueAnomaly = degreesToRadians(
    270 - parameters.earthPerihelionLongitudeDeg,
  );
  const radius =
    (a * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(trueAnomaly));
  const earthX = 320 + radius * Math.cos(trueAnomaly);
  const earthY = 220 + radius * 0.58 * Math.sin(trueAnomaly);

  return (
    <svg
      className="orbital-poster"
      viewBox="0 0 640 440"
      role="img"
      aria-label="Diagram of Earth orbiting the Sun, with the Sun at one focus of the ellipse"
    >
      <defs>
        <radialGradient id="poster-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff4bd" />
          <stop offset="0.45" stopColor="#f08a4b" />
          <stop offset="1" stopColor="#f08a4b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="poster-earth" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#c8edff" />
          <stop offset="0.45" stopColor="#4b91c8" />
          <stop offset="1" stopColor="#122a49" />
        </radialGradient>
      </defs>
      <g transform={`translate(${-c} 0) scale(1 .58) translate(0 160)`}>
        <ellipse cx="320" cy="104" rx={a} ry={b} fill="none" stroke="#d8b56a" strokeOpacity=".72" strokeWidth="2.4" />
      </g>
      <circle cx="320" cy="220" r="58" fill="url(#poster-sun)" />
      <circle cx="320" cy="220" r="15" fill="#ffd785" />
      <g transform={`translate(${earthX} ${earthY})`}>
        <circle r="19" fill="url(#poster-earth)" stroke="#d9f1ff" strokeOpacity=".7" />
        <line
          x1="0"
          y1="-31"
          x2="0"
          y2="31"
          stroke="#f6f0e5"
          strokeWidth="2"
          transform={`rotate(${parameters.obliquityDeg})`}
        />
      </g>
      <text x="320" y="312" textAnchor="middle">Sun at one focus</text>
      <text x="320" y="340" textAnchor="middle" className="orbital-poster__muted">
        {scale === "5x" ? "Orbit shape exaggerated 5× for visibility" : "Orbit shown at actual scale"}
      </text>
    </svg>
  );
}

