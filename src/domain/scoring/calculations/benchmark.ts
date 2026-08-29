import type { CompletedScoringHole } from "../models/hole";
import type { CompletedRound } from "../models/round";
import { calculateShotsFromZone } from "./shotsFromZone";

/**
 * Correction #1 / Will Robbins' Scoring Method benchmark — the V1 north star.
 * With the fixed 100-yard Scoring Zone:
 *   - enter the zone in regulation  = reach it within `par - 2` strokes
 *     (par 3 → tee shot, par 4 → 2, par 5 → 3)
 *   - get down in three             = `shotsFromZone <= 3`
 * Hitting both on every hole keeps a golfer bogey-or-better and out of doubles.
 */

/** Strokes allowed to reach the zone "in regulation" for a given par. */
export const regulationShotsToZone = (par: number): number =>
  Math.max(par - 2, 0);

export const enteredZoneInRegulation = (input: {
  par: number;
  shotsToZone: number;
}): boolean => input.shotsToZone <= regulationShotsToZone(input.par);

export const gotDownInThree = (input: { shotsFromZone: number }): boolean =>
  input.shotsFromZone <= 3;

/** Per-hole gap to the benchmark, split by where the strokes leaked (§ "where, not why"). */
export interface HoleBenchmark {
  holeNumber: number;
  enteredInRegulation: boolean;
  downInThree: boolean;
  /** Strokes over the regulation allowance getting to the zone. */
  toZoneLeak: number;
  /** Strokes over three finishing from the zone. */
  fromZoneLeak: number;
}

export const calculateHoleBenchmark = (
  hole: Pick<
    CompletedScoringHole,
    "holeNumber" | "par" | "score" | "shotsToZone"
  >,
): HoleBenchmark => {
  const allowance = regulationShotsToZone(hole.par);
  const shotsFromZone = calculateShotsFromZone(hole);
  return {
    holeNumber: hole.holeNumber,
    enteredInRegulation: hole.shotsToZone <= allowance,
    downInThree: shotsFromZone <= 3,
    toZoneLeak: Math.max(hole.shotsToZone - allowance, 0),
    fromZoneLeak: Math.max(shotsFromZone - 3, 0),
  };
};

export interface BenchmarkScorecard {
  /** e.g. entered 11 of 18. */
  enteredInRegulation: { count: number; of: number };
  downInThree: { count: number; of: number };
  totalToZoneLeak: number;
  totalFromZoneLeak: number;
  holes: HoleBenchmark[];
  /** Holes that missed at least one half of the benchmark, worst leak first. */
  leakHoles: HoleBenchmark[];
}

/** Round-level benchmark scorecard — the core of the Epic 6 post-round screen. */
export const calculateBenchmarkScorecard = (
  round: Pick<CompletedRound, "holes">,
): BenchmarkScorecard => {
  const holes = round.holes.map(calculateHoleBenchmark);

  const enteredCount = holes.filter((h) => h.enteredInRegulation).length;
  const downCount = holes.filter((h) => h.downInThree).length;
  const totalToZoneLeak = holes.reduce((sum, h) => sum + h.toZoneLeak, 0);
  const totalFromZoneLeak = holes.reduce((sum, h) => sum + h.fromZoneLeak, 0);

  const leakHoles = holes
    .filter((h) => !h.enteredInRegulation || !h.downInThree)
    .sort(
      (a, b) =>
        b.toZoneLeak + b.fromZoneLeak - (a.toZoneLeak + a.fromZoneLeak) ||
        a.holeNumber - b.holeNumber,
    );

  return {
    enteredInRegulation: { count: enteredCount, of: holes.length },
    downInThree: { count: downCount, of: holes.length },
    totalToZoneLeak,
    totalFromZoneLeak,
    holes,
    leakHoles,
  };
};
