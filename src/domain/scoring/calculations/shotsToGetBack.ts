import type { CompletedScoringHole } from "../models/hole";

/**
 * §42–46 — Shots to Get Back is a conservative, defensible collection of clear
 * scoring opportunities. Only three things count:
 *   1. penalty strokes
 *   2. putts above two on a hole
 *   3. bunker strokes beyond the first needed to escape each bunker
 *
 * It is NOT a hypothetical adjusted score (§46) — never present it as one.
 * Compromised tee shots, approach inefficiency, strategy mistakes etc. are
 * improvement signals, not STGB.
 */

/** §43 — every putt above two counts. `max(putts - 2, 0)`. */
export const calculatePuttingShotsToGetBack = (putts: number): number =>
  Math.max(putts - 2, 0);

/** §44 — every penalty stroke counts directly. */
export const calculatePenaltyShotsToGetBack = (penaltyStrokes: number): number =>
  Math.max(penaltyStrokes, 0);

/**
 * §45 + correction #3 — being in a bunker is not itself a shot to get back; only
 * repeated attempts in the same bunker are. `max(bunkerShots - bunkersVisited, 0)`.
 * If `bunkersVisited` is missing/zero while shots were played, assume one bunker.
 */
export const calculateBunkerShotsToGetBack = (input: {
  bunkerShots: number;
  bunkersVisited: number;
}): number => {
  const bunkerShots = Math.max(input.bunkerShots, 0);
  const visited = Math.max(input.bunkersVisited, bunkerShots > 0 ? 1 : 0);
  return Math.max(bunkerShots - visited, 0);
};

export interface HoleShotsToGetBack {
  putting: number;
  penalty: number;
  bunker: number;
  total: number;
}

/** §42 — `STGB = Penalty STGB + Putting STGB + Bunker STGB` for one hole. */
export const calculateHoleShotsToGetBack = (
  hole: Pick<
    CompletedScoringHole,
    "putts" | "penaltyStrokes" | "bunkerShots" | "bunkersVisited"
  >,
): HoleShotsToGetBack => {
  const putting = calculatePuttingShotsToGetBack(hole.putts);
  const penalty = calculatePenaltyShotsToGetBack(hole.penaltyStrokes);
  const bunker = calculateBunkerShotsToGetBack(hole);
  return { putting, penalty, bunker, total: putting + penalty + bunker };
};
