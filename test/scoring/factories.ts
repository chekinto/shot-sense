import {
  METHODOLOGY_VERSION,
  SCORING_ZONE_YARDS,
  type ApproachAttempt,
  type ApproachDistanceBand,
  type CompletedRound,
  type CompletedScoringHole,
} from "@/domain/scoring";

/** A par-4 played to par: drive + approach to green + 2 putts. */
export const completedHole = (
  overrides: Partial<CompletedScoringHole> = {},
): CompletedScoringHole => ({
  status: "completed",
  holeNumber: 1,
  par: 4,
  pickedUp: false,
  score: 4,
  shotsToZone: 2,
  putts: 2,
  firstPuttDistance: "15-30ft",
  penaltyStrokes: 0,
  bunkerShots: 0,
  bunkersVisited: 0,
  approachAttempts: [],
  mistakes: [],
  ...overrides,
});

export const approach = (
  overrides: {
    sequence?: number;
    distanceBand?: ApproachDistanceBand;
    result?: "green" | "scoring-zone" | "intentional-layup";
  } = {},
): ApproachAttempt => ({
  sequence: overrides.sequence ?? 1,
  distanceBand: overrides.distanceBand ?? "150-174",
  result: overrides.result ?? "green",
});

export const missedApproach = (
  overrides: {
    sequence?: number;
    distanceBand?: ApproachDistanceBand;
    missDirection?: "short" | "long" | "left" | "right";
  } = {},
): ApproachAttempt => ({
  sequence: overrides.sequence ?? 1,
  distanceBand: overrides.distanceBand ?? "150-174",
  result: "missed-zone",
  missDirection: overrides.missDirection ?? "short",
});

export const completedRound = (
  holes: CompletedScoringHole[],
  overrides: Partial<CompletedRound> = {},
): CompletedRound => ({
  id: "round-1",
  scoringZoneYards: SCORING_ZONE_YARDS,
  plannedHoleCount: holes.length === 9 ? 9 : 18,
  holes,
  methodologyVersion: METHODOLOGY_VERSION,
  ...overrides,
});

/** 18 identical par-4 pars — a clean baseline to perturb in tests. */
export const eighteenPars = (): CompletedScoringHole[] =>
  Array.from({ length: 18 }, (_, i) =>
    completedHole({ holeNumber: i + 1 }),
  );
