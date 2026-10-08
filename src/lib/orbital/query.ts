import { PRESENT_PARAMETERS } from "./insolation";
import { TIME_END_KYR, TIME_START_KYR, orbitalStateAt } from "./timeline";
import type { OrbitScale, OrbitalParameters } from "./types";

const bounds = {
  eccentricity: { min: 0, max: 0.058 },
  obliquityDeg: { min: 22, max: 24.6 },
  earthPerihelionLongitudeDeg: { min: 0, max: 359.999 },
} as const;

type QueryReader = { get: (key: string) => string | null };

export type ParsedLabQuery = {
  parameters: OrbitalParameters;
  /** Thousands of years from J2000 when the orbit follows La2004, else null. */
  timeKyr: number | null;
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
  if (
    !raw.trim() ||
    !Number.isFinite(value) ||
    value < range.min ||
    value > range.max
  ) {
    invalidFields.push(queryKey);
    return PRESENT_PARAMETERS[parameterKey];
  }
  return value;
}

function parseTime(source: QueryReader, invalidFields: string[]) {
  const raw = source.get("t");
  if (raw === null) return null;
  const value = Number(raw);
  if (
    !raw.trim() ||
    !Number.isFinite(value) ||
    value < TIME_START_KYR ||
    value > TIME_END_KYR
  ) {
    invalidFields.push("t");
    return null;
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
  const timeKyr = parseTime(source, invalidFields);
  // A valid time decides the orbit; e, o and p are then ignored.
  if (timeKyr !== null && timeKyr !== 0)
    return {
      parameters: orbitalStateAt(timeKyr),
      timeKyr,
      scale,
      invalidFields,
    };

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
    timeKyr: null,
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

export function labPath(
  parameters: OrbitalParameters,
  scale: OrbitScale,
  timeKyr: number | null = null,
) {
  if (timeKyr !== null && timeKyr !== 0)
    return `/lab?${new URLSearchParams({ t: String(Math.round(timeKyr * 10) / 10), scale })}`;
  const query = serializeLabQuery(parameters, scale);
  return query === serializeLabQuery(PRESENT_PARAMETERS, "5x")
    ? "/lab"
    : `/lab?${query}`;
}
