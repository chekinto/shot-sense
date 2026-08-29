import {
  isFailedApproach,
  isIntentionalLayup,
  isSuccessfulApproach,
  type ApproachAttempt,
} from "../models/approach";

export interface ApproachSuccess {
  successes: number;
  failures: number;
  /** §36 — intentional lay-ups, excluded from both numerator and denominator. */
  layups: number;
  /** successes + failures (the rate denominator). */
  ratedAttempts: number;
  /** successes / ratedAttempts, or `null` when no rated attempts exist. */
  successRate: number | null;
}

/**
 * §34 / §36 / §70 — approach success rate. A `green` or `scoring-zone` result is
 * a success; `missed-zone` is a failure; `intentional-layup` is excluded.
 *
 * Example from §36: 5 successes, 3 failures, 2 lay-ups → rate = 5 / 8.
 */
export const calculateApproachSuccess = (
  attempts: readonly ApproachAttempt[],
): ApproachSuccess => {
  let successes = 0;
  let failures = 0;
  let layups = 0;

  for (const attempt of attempts) {
    if (isIntentionalLayup(attempt)) layups += 1;
    else if (isSuccessfulApproach(attempt)) successes += 1;
    else if (isFailedApproach(attempt)) failures += 1;
  }

  const ratedAttempts = successes + failures;
  return {
    successes,
    failures,
    layups,
    ratedAttempts,
    successRate: ratedAttempts === 0 ? null : successes / ratedAttempts,
  };
};
