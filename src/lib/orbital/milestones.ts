import { calculateSummerInsolation } from "./insolation";
import type {
  OrbitalMilestone,
  OrbitalMilestoneId,
  OrbitalParameters,
} from "./types";

type MilestoneFixture = Omit<OrbitalMilestone, "expectedReading" | "sourceId"> & {
  expectedDailyMeanWm2: number;
};

const fixtures: MilestoneFixture[] = [
  {
    id: "lgm21k",
    label: "Last Glacial Maximum",
    shortLabel: "21,000 years ago",
    description:
      "An orbital state during the last glacial maximum. Existing ice, low greenhouse gases, and climate history also mattered.",
    kyrFromJ2000: -21,
    parameters: {
      eccentricity: 0.018835429,
      obliquityDeg: 22.964135,
      earthPerihelionLongitudeDeg: 115.234327,
    },
    expectedDailyMeanWm2: 469.579569,
  },
  {
    id: "midHolocene6k",
    label: "Mid-Holocene",
    shortLabel: "6,000 years ago",
    description:
      "A configuration with much stronger northern summer sunlight than the present reference.",
    kyrFromJ2000: -6,
    parameters: {
      eccentricity: 0.018748384,
      obliquityDeg: 24.10244,
      earthPerihelionLongitudeDeg: 1.407994,
    },
    expectedDailyMeanWm2: 504.89902,
  },
  {
    id: "presentJ2000",
    label: "Present Reference",
    shortLabel: "J2000",
    description: "The J2000 astronomical reference used as the comparison baseline.",
    kyrFromJ2000: 0,
    parameters: {
      eccentricity: 0.016702362,
      obliquityDeg: 23.439291,
      earthPerihelionLongitudeDeg: 102.917945,
    },
    expectedDailyMeanWm2: 477.936747,
  },
  {
    id: "future50k",
    label: "50,000 Years From Now",
    shortLabel: "Orbital geometry",
    description:
      "A calculated future orbital geometry, not a prediction of future climate or ice sheets.",
    kyrFromJ2000: 50,
    parameters: {
      eccentricity: 0.010533999,
      obliquityDeg: 22.522019,
      earthPerihelionLongitudeDeg: 21.081862,
    },
    expectedDailyMeanWm2: 474.869124,
  },
];

export const ORBITAL_MILESTONES: OrbitalMilestone[] = fixtures.map(
  ({ expectedDailyMeanWm2, ...fixture }) => {
    const calculated = calculateSummerInsolation(fixture.parameters);
    return {
      ...fixture,
      sourceId: "La2004",
      expectedReading: {
        ...calculated,
        dailyMeanTopOfAtmosphereWm2: expectedDailyMeanWm2,
        deltaFromPresentWm2: expectedDailyMeanWm2 - 477.936747,
      },
    };
  },
);

export const MILESTONE_BY_ID = Object.fromEntries(
  ORBITAL_MILESTONES.map((milestone) => [milestone.id, milestone]),
) as Record<OrbitalMilestoneId, OrbitalMilestone>;

export function copyParameters(parameters: OrbitalParameters): OrbitalParameters {
  return { ...parameters };
}

