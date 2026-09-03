import type { CompletedRound } from "../models/round";
import { APPROACH_BAND_MIN_SAMPLE } from "../models/methodology";
import {
  APPROACH_DISTANCE_BANDS,
  type ApproachDistanceBand,
} from "../models/enums";
import { calculateBenchmarkScorecard } from "../calculations/benchmark";
import { calculateRoundShotsToGetBack } from "../calculations/roundShotsToGetBack";
import { calculateRoundSummary } from "../calculations/roundSummary";
import { isSuccessfulApproach, isFailedApproach } from "../models/approach";
import {
  calculateCategoryPriority,
  type ScoringCategory,
} from "./categoryPriority";

/** Rounds shown on the trend view. Band-level history needs most of a season. */
export const GAME_TREND_WINDOW = 15;
/** Basic score / benchmark / STGB trends need at least this many rounds. */
export const GAME_TREND_MIN_ROUNDS = 3;

export type TrendDirection = "improving" | "declining" | "steady" | null;

export interface MetricSeries {
  /** One value per round, oldest first — per-hole so 9s and 18s compare. */
  values: number[];
  /** Direction over the window, respecting whether higher or lower is better. */
  direction: TrendDirection;
}

export interface ApproachBandHistory {
  band: ApproachDistanceBand;
  attempts: number;
  successRate: number;
}

export interface GameTrend {
  roundCount: number;
  /** roundIds oldest-first, aligned with every series' `values`. */
  roundIds: string[];
  enteredInRegulation: MetricSeries;
  downInThree: MetricSeries;
  scoreToPar: MetricSeries;
  shotsToGetBack: MetricSeries;
  /** Bands that cleared {@link APPROACH_BAND_MIN_SAMPLE} across the window (#5). */
  approachBands: ApproachBandHistory[];
  /** Rated approach attempts across the window (excludes lay-ups). */
  approachAttempts: number;
  /** Whether the golfer has enough approach history for band-level claims yet. */
  approachBandsUnlocked: boolean;
  /** Categories that were a top-two leak in at least half the rounds. */
  recurringLeaks: { category: ScoringCategory; rounds: number }[];
}

const HALF_HOLE = 0.1;

const directionOf = (
  values: number[],
  lowerIsBetter: boolean,
): TrendDirection => {
  if (values.length < GAME_TREND_MIN_ROUNDS) return null;
  const mid = Math.floor(values.length / 2);
  const early = values.slice(0, mid);
  const late = values.slice(values.length - mid);
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const delta = mean(late) - mean(early);
  if (Math.abs(delta) < HALF_HOLE) return "steady";
  const better = lowerIsBetter ? delta < 0 : delta > 0;
  return better ? "improving" : "declining";
};

const series = (values: number[], lowerIsBetter: boolean): MetricSeries => ({
  values,
  direction: directionOf(values, lowerIsBetter),
});

/**
 * §65–73 / correction #5 — the golfer's game over their recent rounds. Rounds
 * are passed oldest-first, already filtered to one methodology major (#6) and
 * trimmed to {@link GAME_TREND_WINDOW}. Returns null below
 * {@link GAME_TREND_MIN_ROUNDS} — a couple of rounds isn't a trend.
 */
export const calculateGameTrend = (
  rounds: readonly CompletedRound[],
): GameTrend | null => {
  if (rounds.length < GAME_TREND_MIN_ROUNDS) return null;

  const perRound = rounds.map((round) => {
    const holes = round.holes.length || 1;
    const benchmark = calculateBenchmarkScorecard(round);
    return {
      entered: benchmark.enteredInRegulation.count / holes,
      down: benchmark.downInThree.count / holes,
      scoreToPar: calculateRoundSummary(round).overall.toPar / holes,
      stgb: calculateRoundShotsToGetBack(round).total / holes,
    };
  });

  // Approach bands across the whole window.
  const bandTally = new Map<
    ApproachDistanceBand,
    { attempts: number; successes: number }
  >();
  for (const round of rounds) {
    for (const hole of round.holes) {
      if (hole.pickedUp) continue;
      for (const attempt of hole.approachAttempts) {
        if (!isSuccessfulApproach(attempt) && !isFailedApproach(attempt)) continue;
        const entry = bandTally.get(attempt.distanceBand) ?? {
          attempts: 0,
          successes: 0,
        };
        entry.attempts += 1;
        if (isSuccessfulApproach(attempt)) entry.successes += 1;
        bandTally.set(attempt.distanceBand, entry);
      }
    }
  }
  const approachBands = APPROACH_DISTANCE_BANDS.flatMap((band) => {
    const entry = bandTally.get(band);
    if (!entry || entry.attempts < APPROACH_BAND_MIN_SAMPLE) return [];
    return [
      {
        band,
        attempts: entry.attempts,
        successRate: entry.successes / entry.attempts,
      },
    ];
  });
  const totalRatedApproaches = [...bandTally.values()].reduce(
    (sum, e) => sum + e.attempts,
    0,
  );

  // Recurring leaks — top-two in at least half the rounds.
  const leakRounds = new Map<ScoringCategory, number>();
  for (const round of rounds) {
    const topTwo = calculateCategoryPriority(round)
      .categories.slice(0, 2)
      .map((c) => c.category);
    for (const category of new Set(topTwo)) {
      leakRounds.set(category, (leakRounds.get(category) ?? 0) + 1);
    }
  }
  const recurringLeaks = [...leakRounds.entries()]
    .filter(([, count]) => count >= Math.ceil(rounds.length / 2))
    .map(([category, rounds]) => ({ category, rounds }))
    .sort((a, b) => b.rounds - a.rounds);

  return {
    roundCount: rounds.length,
    roundIds: rounds.map((r) => r.id),
    enteredInRegulation: series(perRound.map((r) => r.entered), false),
    downInThree: series(perRound.map((r) => r.down), false),
    scoreToPar: series(perRound.map((r) => r.scoreToPar), true),
    shotsToGetBack: series(perRound.map((r) => r.stgb), true),
    approachBands,
    approachAttempts: totalRatedApproaches,
    approachBandsUnlocked: totalRatedApproaches >= APPROACH_BAND_MIN_SAMPLE,
    recurringLeaks,
  };
};
