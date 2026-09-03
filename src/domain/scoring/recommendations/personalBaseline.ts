import type { CompletedRound } from "../models/round";
import { calculateBenchmarkScorecard } from "../calculations/benchmark";
import { calculateRoundShotsToGetBack } from "../calculations/roundShotsToGetBack";
import { calculateRoundSummary } from "../calculations/roundSummary";
import {
  calculateCategoryPriority,
  type ScoringCategory,
} from "./categoryPriority";

/** Rounds averaged into the baseline. */
export const BASELINE_WINDOW = 5;
/**
 * Below this many prior rounds the baseline is withheld — a single round's swing
 * isn't a trend (#10). Two prior rounds means it first appears on round three.
 */
export const BASELINE_MIN_ROUNDS = 2;

export type BaselineConfidence = "early" | "established";

export interface PersonalBaseline {
  /** How many rounds went into the average (≤ {@link BASELINE_WINDOW}). */
  roundsUsed: number;
  /** `early` at 3–4 rounds (caveat heavily), `established` at 5+. */
  confidence: BaselineConfidence;
  /** Mean fraction of holes entered in regulation. */
  enteredInRegulationRate: number;
  /** Mean fraction of holes got down in three. */
  downInThreeRate: number;
  /** Mean strokes over par, per hole. */
  scoreToParPerHole: number;
  /** Mean Shots to Get Back, per hole. */
  shotsToGetBackPerHole: number;
  /**
   * Most frequent top-leak category across the window — full rounds only, since
   * category priority leans on tee/approach data a coarse round lacks (#9).
   * Null when there aren't at least two full rounds agreeing.
   */
  commonLeak: ScoringCategory | null;
}

const mean = (values: number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * §65–73 / correction #10 — the golfer's recent form, averaged over the last few
 * completed rounds, for the post-round to compare against. Rates are per-hole so
 * 9- and 18-hole rounds mix cleanly. Returns null below {@link BASELINE_MIN_ROUNDS};
 * the caller is responsible for filtering to a single methodology major version
 * (#6) and ordering newest-first.
 */
export const calculatePersonalBaseline = (
  history: readonly CompletedRound[],
): PersonalBaseline | null => {
  const window = history.slice(0, BASELINE_WINDOW);
  if (window.length < BASELINE_MIN_ROUNDS) return null;

  const perRound = window.map((round) => {
    const holes = round.holes.length || 1;
    const benchmark = calculateBenchmarkScorecard(round);
    const summary = calculateRoundSummary(round);
    const stgb = calculateRoundShotsToGetBack(round);
    return {
      enteredRate: benchmark.enteredInRegulation.count / holes,
      downRate: benchmark.downInThree.count / holes,
      scoreToParPerHole: summary.overall.toPar / holes,
      stgbPerHole: stgb.total / holes,
    };
  });

  const leakCounts = new Map<ScoringCategory, number>();
  for (const round of window) {
    if (round.dataCompleteness === "coarse") continue;
    const top = calculateCategoryPriority(round).top;
    if (top) leakCounts.set(top.category, (leakCounts.get(top.category) ?? 0) + 1);
  }
  const rankedLeaks = [...leakCounts.entries()].sort((a, b) => b[1] - a[1]);
  const commonLeak =
    rankedLeaks.length > 0 && rankedLeaks[0]![1] >= 2 ? rankedLeaks[0]![0] : null;

  return {
    roundsUsed: window.length,
    confidence: window.length >= BASELINE_WINDOW ? "established" : "early",
    enteredInRegulationRate: mean(perRound.map((r) => r.enteredRate)),
    downInThreeRate: mean(perRound.map((r) => r.downRate)),
    scoreToParPerHole: mean(perRound.map((r) => r.scoreToParPerHole)),
    shotsToGetBackPerHole: mean(perRound.map((r) => r.stgbPerHole)),
    commonLeak,
  };
};
