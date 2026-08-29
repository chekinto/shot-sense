import type { CompletedRound } from "../models/round";
import {
  calculateApproachSuccess,
  type ApproachSuccess,
} from "../calculations/approachSuccess";
import {
  calculateBenchmarkScorecard,
  type BenchmarkScorecard,
} from "../calculations/benchmark";
import {
  calculateRoundShotsToGetBack,
  type RoundShotsToGetBack,
} from "../calculations/roundShotsToGetBack";
import {
  calculateRoundSummary,
  type RoundSummary,
} from "../calculations/roundSummary";

/**
 * §96 / §97 — the deterministic analysis of a completed round.
 *
 * This is the Epic 1 / Epic 6 shape: score picture, Shots to Get Back, and the
 * benchmark scorecard. Later epics extend it with severity, round-level
 * observations, trends and recommendations — always downstream of this
 * deterministic core, never replacing it (§74).
 */
export interface RoundAnalysis {
  roundId: string;
  methodologyVersion: string;
  summary: RoundSummary;
  shotsToGetBack: RoundShotsToGetBack;
  benchmark: BenchmarkScorecard;
  /** Round-wide approach success, excluding picked-up holes (§9 correction). */
  approach: ApproachSuccess;
}

export const analyseRound = (round: CompletedRound): RoundAnalysis => {
  const approachAttempts = round.holes
    .filter((hole) => !hole.pickedUp)
    .flatMap((hole) => hole.approachAttempts);

  return {
    roundId: round.id,
    methodologyVersion: round.methodologyVersion,
    summary: calculateRoundSummary(round),
    shotsToGetBack: calculateRoundShotsToGetBack(round),
    benchmark: calculateBenchmarkScorecard(round),
    approach: calculateApproachSuccess(approachAttempts),
  };
};
