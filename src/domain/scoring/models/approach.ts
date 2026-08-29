import type {
  ApproachDistanceBand,
  ApproachResult,
  MissDirection,
} from "./enums";

/**
 * §94 — a single approach attempt, modelled as a discriminated union so a
 * `missed-zone` result cannot exist without a miss direction, and the other
 * results cannot carry one.
 *
 * `id` and persistence concerns live outside the domain; the scoring engine
 * only needs sequence + shape.
 */
export type ApproachAttempt =
  | {
      sequence: number;
      distanceBand: ApproachDistanceBand;
      result: Exclude<ApproachResult, "missed-zone">;
    }
  | {
      sequence: number;
      distanceBand: ApproachDistanceBand;
      result: "missed-zone";
      missDirection: MissDirection;
    };

/** §34 — an approach succeeds if it reaches the green or the Scoring Zone. */
export const isSuccessfulApproach = (attempt: ApproachAttempt): boolean =>
  attempt.result === "green" || attempt.result === "scoring-zone";

/** §35 — a failed approach is one that missed the zone. */
export const isFailedApproach = (attempt: ApproachAttempt): boolean =>
  attempt.result === "missed-zone";

/** §36 — intentional lay-ups are excluded from approach success rate entirely. */
export const isIntentionalLayup = (attempt: ApproachAttempt): boolean =>
  attempt.result === "intentional-layup";
