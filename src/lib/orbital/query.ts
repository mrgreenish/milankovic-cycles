import { PRESENT_PARAMETERS } from "./insolation";
import type { OrbitScale, OrbitalParameters } from "./types";

const bounds = {
  eccentricity: { min: 0.005, max: 0.058 },
  obliquityDeg: { min: 22.1, max: 24.5 },
  earthPerihelionLongitudeDeg: { min: 0, max: 359.999 },
} as const;

type QueryReader = { get: (key: string) => string | null };

export type ParsedLabQuery = {
  parameters: OrbitalParameters;
  scale: OrbitScale;
  invalidFields: string[];
};

function parseField(
  source: QueryReader,
  queryKey: string,
  parameterKey: keyof OrbitalParameters,
  invalidFields: string[],
) {
  const raw = source.get(queryKey);
  if (raw === null) return PRESENT_PARAMETERS[parameterKey];
  const value = Number(raw);
  const range = bounds[parameterKey];
  if (!Number.isFinite(value) || value < range.min || value > range.max) {
    invalidFields.push(queryKey);
    return PRESENT_PARAMETERS[parameterKey];
  }
  return value;
}

export function parseLabQuery(source: QueryReader): ParsedLabQuery {
  const invalidFields: string[] = [];
  const scaleRaw = source.get("scale");
  const scale: OrbitScale = scaleRaw === "actual" ? "actual" : "5x";
  if (scaleRaw !== null && scaleRaw !== "actual" && scaleRaw !== "5x") {
    invalidFields.push("scale");
  }

  return {
    parameters: {
      eccentricity: parseField(source, "e", "eccentricity", invalidFields),
      obliquityDeg: parseField(source, "o", "obliquityDeg", invalidFields),
      earthPerihelionLongitudeDeg: parseField(
        source,
        "p",
        "earthPerihelionLongitudeDeg",
        invalidFields,
      ),
    },
    scale,
    invalidFields,
  };
}

export function serializeLabQuery(
  parameters: OrbitalParameters,
  scale: OrbitScale,
) {
  const query = new URLSearchParams({
    e: parameters.eccentricity.toFixed(6),
    o: parameters.obliquityDeg.toFixed(4),
    p: parameters.earthPerihelionLongitudeDeg.toFixed(3),
    scale,
  });
  return query.toString();
}

