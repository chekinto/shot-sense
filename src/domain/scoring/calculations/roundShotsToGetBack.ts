import type { CompletedRound } from "../models/round";
import {
  calculateHoleShotsToGetBack,
  type HoleShotsToGetBack,
} from "./shotsToGetBack";

export interface RoundShotsToGetBack extends HoleShotsToGetBack {
  /** Per-hole breakdown for holes that contributed at least one STGB. */
  byHole: Array<{ holeNumber: number } & HoleShotsToGetBack>;
}

/** §42 — round-level Shots to Get Back, summed from every completed hole. */
export const calculateRoundShotsToGetBack = (
  round: Pick<CompletedRound, "holes">,
): RoundShotsToGetBack => {
  let putting = 0;
  let penalty = 0;
  let bunker = 0;
  const byHole: RoundShotsToGetBack["byHole"] = [];

  for (const hole of round.holes) {
    const stgb = calculateHoleShotsToGetBack(hole);
    putting += stgb.putting;
    penalty += stgb.penalty;
    bunker += stgb.bunker;
    if (stgb.total > 0) byHole.push({ holeNumber: hole.holeNumber, ...stgb });
  }

  return {
    putting,
    penalty,
    bunker,
    total: putting + penalty + bunker,
    byHole,
  };
};
