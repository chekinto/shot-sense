import type { MethodologyVersion, ScoringZoneYards } from "./methodology";
import type { CompletedScoringHole } from "./hole";
import type { PlannedHoleCount } from "./enums";

/**
 * §96 — a completed round ready for analysis. `holes` contains only the holes
 * that were actually played and completed; a 9-hole finish of an 18-hole plan
 * carries whichever 9 were played, identified by `holeNumber` (§20 — never
 * assume they are 1–9).
 */
/**
 * §9 correction — `full` rounds carry every input; `coarse` rounds are
 * historical backfills with score / shots-to-zone / putts / penalties only.
 * Field-dependent comparisons must exclude `coarse` rounds.
 */
export type RoundDataCompleteness = "full" | "coarse";

export interface CompletedRound {
  id: string;
  /** Always 100 in V1; stored so a future configurable zone never rewrites history. */
  scoringZoneYards: ScoringZoneYards;
  handicapAtStart?: number;
  plannedHoleCount: PlannedHoleCount;
  holes: readonly CompletedScoringHole[];
  methodologyVersion: MethodologyVersion | string;
  /** Defaults to `full` when absent (every round recorded in-app). */
  dataCompleteness?: RoundDataCompleteness;
}

/** Front nine = holes 1–9, back nine = holes 10–18. */
export const FRONT_NINE_HOLES = { min: 1, max: 9 } as const;
export const BACK_NINE_HOLES = { min: 10, max: 18 } as const;

export const isFrontNine = (holeNumber: number): boolean =>
  holeNumber >= FRONT_NINE_HOLES.min && holeNumber <= FRONT_NINE_HOLES.max;

export const isBackNine = (holeNumber: number): boolean =>
  holeNumber >= BACK_NINE_HOLES.min && holeNumber <= BACK_NINE_HOLES.max;
