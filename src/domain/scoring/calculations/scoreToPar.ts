import { HOLE_RESULTS, type HoleResult } from "../models/enums";

/** §26 / §66 — `Score to Par = Hole Score − Hole Par`. */
export const calculateScoreToPar = (input: {
  score: number;
  par: number;
}): number => input.score - input.par;

/**
 * §66 — classify a hole from its score-to-par:
 * `≤ -2` eagle or better · `-1` birdie · `0` par · `+1` bogey ·
 * `+2` double bogey · `≥ +3` triple bogey or worse.
 * The exact score is always retained separately in raw data (§26).
 */
export const classifyHoleResult = (scoreToPar: number): HoleResult => {
  if (scoreToPar <= -2) return "eagle-or-better";
  if (scoreToPar === -1) return "birdie";
  if (scoreToPar === 0) return "par";
  if (scoreToPar === 1) return "bogey";
  if (scoreToPar === 2) return "double-bogey";
  return "triple-bogey-plus";
};

/** Zeroed tally of every hole-result bucket, for accumulation. */
export const emptyHoleResultTally = (): Record<HoleResult, number> =>
  HOLE_RESULTS.reduce(
    (acc, result) => {
      acc[result] = 0;
      return acc;
    },
    {} as Record<HoleResult, number>,
  );
