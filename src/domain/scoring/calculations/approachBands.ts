import {
  APPROACH_DISTANCE_BANDS,
  MISS_DIRECTIONS,
  type ApproachDistanceBand,
  type MissDirection,
} from "../models/enums";
import {
  isIntentionalLayup,
  isSuccessfulApproach,
  type ApproachAttempt,
} from "../models/approach";

export interface ApproachBandRow {
  band: ApproachDistanceBand;
  attempts: number;
  successes: number;
  failures: number;
  layups: number;
  /** Miss directions among the failures in this band. */
  misses: Record<MissDirection, number>;
}

export interface ApproachBandBreakdown {
  /** One row per band that has at least one attempt, in distance order. */
  rows: ApproachBandRow[];
  /** Miss directions across every band (failures only). */
  misses: Record<MissDirection, number>;
  /** Total failures — the sum of `misses`. */
  totalMisses: number;
}

const zeroedMisses = (): Record<MissDirection, number> =>
  Object.fromEntries(MISS_DIRECTIONS.map((d) => [d, 0])) as Record<
    MissDirection,
    number
  >;

/**
 * Corrections #5 / #8 — the round's approach play broken out by distance band.
 * Counts only. This never asserts that a band is a weakness: that claim needs
 * {@link APPROACH_BAND_MIN_SAMPLE} attempts and waits for the trend engine.
 * Intentional lay-ups are counted but excluded from success/failure (§36).
 */
export const calculateApproachBands = (
  attempts: readonly ApproachAttempt[],
): ApproachBandBreakdown => {
  const byBand = new Map<ApproachDistanceBand, ApproachBandRow>();
  const misses = zeroedMisses();

  for (const attempt of attempts) {
    let row = byBand.get(attempt.distanceBand);
    if (!row) {
      row = {
        band: attempt.distanceBand,
        attempts: 0,
        successes: 0,
        failures: 0,
        layups: 0,
        misses: zeroedMisses(),
      };
      byBand.set(attempt.distanceBand, row);
    }
    row.attempts += 1;

    if (isIntentionalLayup(attempt)) {
      row.layups += 1;
    } else if (isSuccessfulApproach(attempt)) {
      row.successes += 1;
    } else if (attempt.result === "missed-zone") {
      row.failures += 1;
      row.misses[attempt.missDirection] += 1;
      misses[attempt.missDirection] += 1;
    }
  }

  const rows = APPROACH_DISTANCE_BANDS.map((band) => byBand.get(band)).filter(
    (row): row is ApproachBandRow => row !== undefined,
  );
  const totalMisses = MISS_DIRECTIONS.reduce((sum, d) => sum + misses[d], 0);

  return { rows, misses, totalMisses };
};
