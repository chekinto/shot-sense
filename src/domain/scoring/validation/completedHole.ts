import { isFailedApproach, type ApproachAttempt } from "../models/approach";
import {
  FIRST_PUTT_DISTANCE_BANDS,
  MISS_DIRECTIONS,
} from "../models/enums";
import type {
  CompletedScoringHole,
  RawHoleInput,
} from "../models/hole";

export interface HoleValidationError {
  field: string;
  message: string;
}

export type HoleValidationResult =
  | { ok: true; hole: CompletedScoringHole }
  | { ok: false; errors: HoleValidationError[] };

const PAR_MIN = 3;
const PAR_MAX = 6;
const HOLE_NUMBER_MIN = 1;
const HOLE_NUMBER_MAX = 18;

const isInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value);

const validateApproachAttempts = (
  attempts: readonly ApproachAttempt[],
  errors: HoleValidationError[],
): void => {
  attempts.forEach((attempt, index) => {
    if (
      isFailedApproach(attempt) &&
      !MISS_DIRECTIONS.includes(
        (attempt as { missDirection?: (typeof MISS_DIRECTIONS)[number] })
          .missDirection as (typeof MISS_DIRECTIONS)[number],
      )
    ) {
      errors.push({
        field: `approachAttempts.${index}.missDirection`,
        message: "missDirection is required when an approach result is missed-zone",
      });
    }
  });
};

/**
 * §99 — validate the required scoring fields of a hole and the conditional
 * integrity rules. Optional analytics fields (tee outcome/lie, mistakes) are
 * never checked here — they must not block round completion.
 *
 * Pure and framework-free. Zod schemas at API/form trust boundaries reuse these
 * same rules; this is the single source of truth for them.
 */
export const validateCompletedHole = (
  input: RawHoleInput,
): HoleValidationResult => {
  const errors: HoleValidationError[] = [];

  const {
    holeNumber,
    par,
    score,
    shotsToZone,
    putts,
    firstPuttDistance,
    penaltyStrokes = 0,
    bunkerShots = 0,
    bunkersVisited = 0,
    pickedUp = false,
    teeOutcome,
    teeLie,
    approachAttempts = [],
    mistakes = [],
  } = input;

  if (!isInt(holeNumber) || holeNumber < HOLE_NUMBER_MIN || holeNumber > HOLE_NUMBER_MAX) {
    errors.push({ field: "holeNumber", message: "holeNumber must be an integer 1–18" });
  }
  if (!isInt(par) || par < PAR_MIN || par > PAR_MAX) {
    errors.push({ field: "par", message: "par must be an integer 3–6" });
  }
  if (!isInt(score) || (score as number) <= 0) {
    errors.push({ field: "score", message: "score must be a positive integer" });
  }
  if (!isInt(shotsToZone) || (shotsToZone as number) < 0) {
    errors.push({ field: "shotsToZone", message: "shotsToZone must be a non-negative integer" });
  }
  if (isInt(score) && isInt(shotsToZone) && (shotsToZone as number) > (score as number)) {
    errors.push({ field: "shotsToZone", message: "shotsToZone cannot exceed score" });
  }
  if (!isInt(putts) || (putts as number) < 0) {
    errors.push({ field: "putts", message: "putts must be a non-negative integer" });
  }

  const shotsFromZone =
    isInt(score) && isInt(shotsToZone)
      ? (score as number) - (shotsToZone as number)
      : null;
  if (shotsFromZone !== null && isInt(putts) && (putts as number) > shotsFromZone) {
    errors.push({
      field: "putts",
      message: "putts cannot exceed shots from zone (score − shotsToZone)",
    });
  }

  if (isInt(putts) && (putts as number) > 0) {
    if (!firstPuttDistance || !FIRST_PUTT_DISTANCE_BANDS.includes(firstPuttDistance)) {
      errors.push({
        field: "firstPuttDistance",
        message: "firstPuttDistance is required when putts > 0",
      });
    }
  } else if (firstPuttDistance !== undefined) {
    errors.push({
      field: "firstPuttDistance",
      message: "firstPuttDistance must be absent when putts = 0",
    });
  }

  if (!isInt(penaltyStrokes) || penaltyStrokes < 0) {
    errors.push({ field: "penaltyStrokes", message: "penaltyStrokes must be a non-negative integer" });
  }
  if (!isInt(bunkerShots) || bunkerShots < 0) {
    errors.push({ field: "bunkerShots", message: "bunkerShots must be a non-negative integer" });
  }
  if (!isInt(bunkersVisited) || bunkersVisited < 0) {
    errors.push({ field: "bunkersVisited", message: "bunkersVisited must be a non-negative integer" });
  }
  if (isInt(bunkerShots) && isInt(bunkersVisited)) {
    if (bunkersVisited > bunkerShots) {
      errors.push({ field: "bunkersVisited", message: "bunkersVisited cannot exceed bunkerShots" });
    }
    if (bunkerShots > 0 && bunkersVisited === 0) {
      errors.push({ field: "bunkersVisited", message: "bunkersVisited must be at least 1 when bunkerShots > 0" });
    }
  }

  validateApproachAttempts(approachAttempts, errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    hole: {
      status: "completed",
      holeNumber: holeNumber as number,
      par: par as number,
      pickedUp,
      score: score as number,
      shotsToZone: shotsToZone as number,
      putts: putts as number,
      ...(firstPuttDistance ? { firstPuttDistance } : {}),
      penaltyStrokes,
      bunkerShots,
      bunkersVisited,
      ...(teeOutcome ? { teeOutcome } : {}),
      ...(teeLie ? { teeLie } : {}),
      approachAttempts,
      mistakes,
    },
  };
};

/** Throwing variant for trusted call sites (mappers over already-persisted rows). */
export const assertCompletedHole = (
  input: RawHoleInput,
): CompletedScoringHole => {
  const result = validateCompletedHole(input);
  if (!result.ok) {
    throw new Error(
      `Invalid completed hole: ${result.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ")}`,
    );
  }
  return result.hole;
};
