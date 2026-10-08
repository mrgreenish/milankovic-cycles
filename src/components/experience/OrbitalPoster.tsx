"use client";

import { useId } from "react";
import {
  degreesToRadians,
  displayEccentricity,
  latitudeCircleGeometry,
  summerSolsticeAxisVector,
} from "@/lib/orbital/geometry";
import { PRESENT_PARAMETERS } from "@/lib/orbital/insolation";
import type {
  OrbitScale,
  OrbitalParameters,
  OrbitalVisualFocus,
} from "@/lib/orbital/types";

const CENTER_X = 320;
const CENTER_Y = 205;
const SEMI_MAJOR_AXIS = 222;
const Y_PROJECTION = 0.58;

function orbitGeometry(eccentricity: number) {
  return {
    semiMinorAxis: SEMI_MAJOR_AXIS * Math.sqrt(1 - eccentricity * eccentricity),
    focusDistance: SEMI_MAJOR_AXIS * eccentricity,
  };
}

function summerPosition(eccentricity: number, perihelionLongitudeDeg: number) {
  const trueAnomaly = degreesToRadians(270 - perihelionLongitudeDeg);
  const radius =
    (SEMI_MAJOR_AXIS * (1 - eccentricity * eccentricity)) /
    (1 + eccentricity * Math.cos(trueAnomaly));
  return {
    x: CENTER_X + radius * Math.cos(trueAnomaly),
    y: CENTER_Y + radius * Y_PROJECTION * Math.sin(trueAnomaly),
  };
}

export function OrbitalPoster({
  parameters,
  scale,
  focus,
}: {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  focus: OrbitalVisualFocus;
}) {
  const gradientId = useId();
  // The still diagram has three close-ups; every other view uses the overview.
  focus = focus === "shape" || focus === "tilt" || focus === "direction" ? focus : "combined";
  const eccentricity = displayEccentricity(parameters.eccentricity, scale);
  const presentEccentricity = displayEccentricity(
    PRESENT_PARAMETERS.eccentricity,
    scale,
  );
  const currentOrbit = orbitGeometry(eccentricity);
  const presentOrbit = orbitGeometry(presentEccentricity);
  const earth = summerPosition(
    eccentricity,
    parameters.earthPerihelionLongitudeDeg,
  );
  const todayEarth = summerPosition(
    eccentricity,
    PRESENT_PARAMETERS.earthPerihelionLongitudeDeg,
  );
  const axisVector = summerSolsticeAxisVector(parameters);
  const projectedAxis = {
    x: axisVector[0],
    y: axisVector[2] * Y_PROJECTION - axisVector[1],
  };
  const projectedAxisLength = Math.hypot(projectedAxis.x, projectedAxis.y);
  const orbitAxis = {
    x: (projectedAxis.x / projectedAxisLength) * 31,
    y: (projectedAxis.y / projectedAxisLength) * 31,
  };

  if (focus === "tilt") {
    const earthRadius = 72;
    const axisLength = 120;
    const latitudeRing = latitudeCircleGeometry(earthRadius, 65);
    const axisLine = (tiltDeg: number) => {
      const tilt = degreesToRadians(tiltDeg);
      return {
        x1: CENTER_X - Math.sin(tilt) * axisLength,
        y1: CENTER_Y + Math.cos(tilt) * axisLength,
        x2: CENTER_X + Math.sin(tilt) * axisLength,
        y2: CENTER_Y - Math.cos(tilt) * axisLength,
      };
    };
    const currentAxis = axisLine(parameters.obliquityDeg);
    const presentAxis = axisLine(PRESENT_PARAMETERS.obliquityDeg);

    return (
      <svg className="orbital-poster" viewBox="0 35 640 330" aria-hidden="true">
        <PosterDefinitions id={gradientId} />
        <g opacity=".28" stroke="#ffd97a" strokeWidth="2">
          <line x1="70" y1="154" x2="205" y2="174" />
          <line x1="70" y1="205" x2="205" y2="205" />
          <line x1="70" y1="256" x2="205" y2="236" />
        </g>
        <line
          x1={CENTER_X}
          y1="70"
          x2={CENTER_X}
          y2="340"
          stroke="#a9b4c5"
          strokeOpacity=".28"
          strokeDasharray="5 7"
        />
        <line
          {...presentAxis}
          stroke="#85c7f2"
          strokeOpacity=".72"
          strokeWidth="3"
          strokeDasharray="5 7"
        />
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          r={earthRadius}
          fill={`url(#${gradientId}-earth)`}
          stroke="#d9f1ff"
          strokeOpacity=".7"
        />
        <ellipse
          transform={`rotate(${parameters.obliquityDeg} ${CENTER_X} ${CENTER_Y})`}
          cx={CENTER_X}
          cy={CENTER_Y - latitudeRing.axisOffset}
          rx={latitudeRing.circleRadius}
          ry={latitudeRing.circleRadius * 0.3}
          fill="none"
          stroke="#85c7f2"
          strokeWidth="3"
        />
        <line
          {...currentAxis}
          stroke="#ffd97a"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={currentAxis.x2} cy={currentAxis.y2} r="6" fill="#ffd97a" />
        <text x="405" y="110" className="poster-label">
          {parameters.obliquityDeg.toFixed(2)}°
        </text>
        <text x="405" y="161" className="poster-label poster-label--ice">
          65°N
        </text>
      </svg>
    );
  }

  return (
    <svg className="orbital-poster" viewBox="0 35 640 330" aria-hidden="true">
      <PosterDefinitions id={gradientId} />
      {focus === "shape" ? (
        <ellipse
          cx={CENTER_X - presentOrbit.focusDistance}
          cy={CENTER_Y}
          rx={SEMI_MAJOR_AXIS}
          ry={presentOrbit.semiMinorAxis * Y_PROJECTION}
          fill="none"
          stroke="#85c7f2"
          strokeOpacity=".65"
          strokeWidth="2"
          strokeDasharray="5 7"
        />
      ) : null}
      <ellipse
        cx={CENTER_X - currentOrbit.focusDistance}
        cy={CENTER_Y}
        rx={SEMI_MAJOR_AXIS}
        ry={currentOrbit.semiMinorAxis * Y_PROJECTION}
        fill="none"
        stroke="#d8b56a"
        strokeOpacity=".8"
        strokeWidth={focus === "shape" ? 4 : 2.4}
      />
      {focus === "direction" ? (
        <>
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={todayEarth.x}
            y2={todayEarth.y}
            stroke="#a9b4c5"
            strokeOpacity=".3"
            strokeDasharray="5 7"
          />
          <line
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={earth.x}
            y2={earth.y}
            stroke="#85c7f2"
            strokeOpacity=".86"
            strokeWidth="3"
          />
          <circle
            cx={todayEarth.x}
            cy={todayEarth.y}
            r="15"
            fill="none"
            stroke="#a9b4c5"
            strokeOpacity=".35"
            strokeDasharray="3 4"
          />
        </>
      ) : null}
      {focus === "shape" || focus === "direction" ? (
        <>
          <circle
            cx={CENTER_X + SEMI_MAJOR_AXIS * (1 - eccentricity)}
            cy={CENTER_Y}
            r="5"
            fill="#f08a4b"
          />
          <circle
            cx={CENTER_X - SEMI_MAJOR_AXIS * (1 + eccentricity)}
            cy={CENTER_Y}
            r="5"
            fill="#85c7f2"
          />
        </>
      ) : null}
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        r="58"
        fill={`url(#${gradientId}-sun)`}
      />
      <circle cx={CENTER_X} cy={CENTER_Y} r="15" fill="#ffd785" />
      {focus === "direction" ? (
        <circle
          cx={earth.x}
          cy={earth.y}
          r="26"
          fill="none"
          stroke="#ffd97a"
          strokeWidth="2"
        />
      ) : null}
      <g transform={`translate(${earth.x} ${earth.y})`}>
        <circle
          r="19"
          fill={`url(#${gradientId}-earth)`}
          stroke="#d9f1ff"
          strokeOpacity=".7"
        />
        <line
          x1={-orbitAxis.x}
          y1={-orbitAxis.y}
          x2={orbitAxis.x}
          y2={orbitAxis.y}
          stroke="#f6f0e5"
          strokeWidth="2"
        />
      </g>
      {focus === "shape" ? (
        <>
          <text
            x={CENTER_X + SEMI_MAJOR_AXIS * (1 - eccentricity)}
            y={CENTER_Y + 34}
            textAnchor="middle"
            className="poster-label"
          >
            Closest
          </text>
          <text
            x={CENTER_X - SEMI_MAJOR_AXIS * (1 + eccentricity)}
            y={CENTER_Y + 34}
            textAnchor="middle"
            className="poster-label poster-label--ice"
          >
            Farthest
          </text>
        </>
      ) : null}
      {focus === "direction"
        ? [
            { label: "Spring", longitude: 0 },
            { label: "Summer", longitude: 90 },
            { label: "Autumn", longitude: 180 },
            { label: "Winter", longitude: 270 },
          ].map(({ label, longitude }) => {
            const point = summerPosition(
              eccentricity,
              parameters.earthPerihelionLongitudeDeg + 90 - longitude,
            );
            return (
              <text
                key={label}
                x={point.x}
                y={point.y + (point.y > CENTER_Y ? 30 : -28)}
                textAnchor="middle"
                className={`poster-label${label === "Summer" ? " poster-label--summer" : ""}`}
              >
                {label}
              </text>
            );
          })
        : null}
    </svg>
  );
}

function PosterDefinitions({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#fff4bd" />
        <stop offset="0.45" stopColor="#f08a4b" />
        <stop offset="1" stopColor="#f08a4b" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-earth`} cx="35%" cy="30%" r="70%">
        <stop offset="0" stopColor="#c8edff" />
        <stop offset="0.45" stopColor="#4b91c8" />
        <stop offset="1" stopColor="#122a49" />
      </radialGradient>
    </defs>
  );
}
