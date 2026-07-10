export type OrbitalParameters = {
  eccentricity: number;
  obliquityDeg: number;
  earthPerihelionLongitudeDeg: number;
};

export type SummerInsolationReading = {
  latitudeDeg: 65;
  solarLongitudeDeg: 90;
  dailyMeanTopOfAtmosphereWm2: number;
  deltaFromPresentWm2: number;
  daylightHours: number;
  earthSunDistanceAu: number;
};

export type OrbitalMeltPressure =
  | "less-summer-melt"
  | "near-present"
  | "more-summer-melt";

export type OrbitalMilestoneId =
  | "lgm21k"
  | "midHolocene6k"
  | "presentJ2000"
  | "future50k";

export type OrbitalMilestone = {
  id: OrbitalMilestoneId;
  label: string;
  shortLabel: string;
  description: string;
  kyrFromJ2000: number;
  parameters: OrbitalParameters;
  expectedReading: SummerInsolationReading;
  sourceId: "La2004";
};

export type OrbitScale = "actual" | "5x";

export type OrbitalVisualFocus =
  | "shape"
  | "tilt"
  | "direction"
  | "combined";
