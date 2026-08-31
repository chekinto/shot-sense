import type { CompletedRound } from "../models/round";
import {
  MISTAKE_CATEGORIES,
  type MistakeCategory,
} from "../models/enums";

export interface FaultSummary {
  /** Occurrences per category (a category tagged twice on a hole counts twice). */
  mistakeCounts: Record<MistakeCategory, number>;
  /** Ascending hole numbers with at least one mistake tag. */
  mistakeHoles: number[];
  /** Total mistake tags across the round. */
  totalMistakes: number;
  /** Ascending hole numbers where the ball was in a bunker at all. */
  bunkerHoles: number[];
  /** Ascending hole numbers where a single bunker needed 2+ shots to escape. */
  bunkerStuckHoles: number[];
}

const zeroCounts = (): Record<MistakeCategory, number> =>
  Object.fromEntries(MISTAKE_CATEGORIES.map((c) => [c, 0])) as Record<
    MistakeCategory,
    number
  >;

/**
 * §38 / §40 — the round's mistake tags and bunker trouble, as plain counts. No
 * severity weighting or pattern claims here (that is the priority engine, Epic
 * 10); this just surfaces what was logged.
 */
export const calculateFaults = (round: CompletedRound): FaultSummary => {
  const mistakeCounts = zeroCounts();
  const mistakeHoles: number[] = [];
  const bunkerHoles: number[] = [];
  const bunkerStuckHoles: number[] = [];
  let totalMistakes = 0;

  const ordered = [...round.holes].sort(
    (a, b) => a.holeNumber - b.holeNumber,
  );
  for (const hole of ordered) {
    if (hole.mistakes.length > 0) {
      mistakeHoles.push(hole.holeNumber);
      for (const category of hole.mistakes) {
        mistakeCounts[category] += 1;
        totalMistakes += 1;
      }
    }
    if (hole.bunkerShots > 0) {
      bunkerHoles.push(hole.holeNumber);
      const visited = Math.max(hole.bunkersVisited, 1);
      if (hole.bunkerShots - visited >= 1) {
        bunkerStuckHoles.push(hole.holeNumber);
      }
    }
  }

  return {
    mistakeCounts,
    mistakeHoles,
    totalMistakes,
    bunkerHoles,
    bunkerStuckHoles,
  };
};
