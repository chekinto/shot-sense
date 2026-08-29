import type { HoleResult } from "../models/enums";
import type { CompletedScoringHole } from "../models/hole";
import type { CompletedRound } from "../models/round";
import { isBackNine, isFrontNine } from "../models/round";
import {
  calculateScoreToPar,
  classifyHoleResult,
  emptyHoleResultTally,
} from "./scoreToPar";

export interface SectionSummary {
  holesPlayed: number;
  score: number;
  par: number;
  /** `score - par` (§66). */
  toPar: number;
  results: Record<HoleResult, number>;
}

export interface RoundSummary {
  plannedHoleCount: CompletedRound["plannedHoleCount"];
  /** True when every planned hole was completed. */
  isComplete: boolean;
  overall: SectionSummary;
  /** Holes 1–9 that were played, or `null` if none (§65 — never invent holes). */
  front: SectionSummary | null;
  /** Holes 10–18 that were played, or `null` if none. */
  back: SectionSummary | null;
}

const summariseHoles = (
  holes: readonly CompletedScoringHole[],
): SectionSummary => {
  const results = emptyHoleResultTally();
  let score = 0;
  let par = 0;

  for (const hole of holes) {
    score += hole.score;
    par += hole.par;
    const toPar = calculateScoreToPar(hole);
    results[classifyHoleResult(toPar)] += 1;
  }

  return { holesPlayed: holes.length, score, par, toPar: score - par, results };
};

/**
 * §65 / §66 — front nine, back nine and overall totals. For a 9-hole round only
 * the nine that was played is populated; the other section is `null`.
 */
export const calculateRoundSummary = (round: CompletedRound): RoundSummary => {
  const front = round.holes.filter((h) => isFrontNine(h.holeNumber));
  const back = round.holes.filter((h) => isBackNine(h.holeNumber));

  return {
    plannedHoleCount: round.plannedHoleCount,
    isComplete: round.holes.length === round.plannedHoleCount,
    overall: summariseHoles(round.holes),
    front: front.length > 0 ? summariseHoles(front) : null,
    back: back.length > 0 ? summariseHoles(back) : null,
  };
};
