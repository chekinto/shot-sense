import type { CompletedRound } from "../models/round";
import type { CompletedScoringHole } from "../models/hole";
import { MISTAKE_CATEGORIES } from "../models/enums";
import { calculateApproachSuccess } from "../calculations/approachSuccess";
import { calculateScoreToPar } from "../calculations/scoreToPar";
import {
  calculateCategoryPriority,
  type ScoringCategory,
} from "./categoryPriority";

/** A caveated Primary appears from here; the full set lands at {@link RECOMMENDATION_FIRM_ROUNDS}. */
export const RECOMMENDATION_MIN_ROUNDS = 3;
export const RECOMMENDATION_FIRM_ROUNDS = 5;

export type RecommendationConfidence = "early" | "firm";

export interface FocusArea {
  category: ScoringCategory;
  /** Estimated shots this cost across the window, rounded to 0.5. */
  totalSeverity: number;
  /** Rounds where it was one of the two biggest leaks. */
  roundsProminent: number;
  /** Rounds it cost anything at all. */
  roundsPresent: number;
}

export interface KeepDoing {
  /** Short id for the win — the feature layer turns it into copy. */
  id:
    | "no-penalties"
    | "no-blow-ups"
    | "putting"
    | "approach"
    | "tee"
    | "scrambling";
  /** The skill category, when the win is one; null for a round-shape win. */
  category: ScoringCategory | null;
}

export interface RecommendationSet {
  confidence: RecommendationConfidence;
  roundsUsed: number;
  primary: FocusArea;
  /** Only when the runner-up is materially costly (never padded, #11). */
  secondary: FocusArea | null;
  /** A genuine strength, or null — "nothing stood out" (#11). */
  keepDoing: KeepDoing | null;
}

const toHalf = (n: number): number => Math.round(n * 2) / 2;

/** Severity dominates; a recurring problem edges out a one-round spike. */
const rankScore = (area: FocusArea): number =>
  area.totalSeverity + area.roundsProminent * 0.75;

const findKeepDoing = (
  holes: CompletedScoringHole[],
  avoid: Set<ScoringCategory>,
): KeepDoing | null => {
  const played = holes.filter((h) => !h.pickedUp);

  if (holes.every((h) => h.penaltyStrokes === 0)) {
    return { id: "no-penalties", category: null };
  }
  if (holes.every((h) => calculateScoreToPar(h) < 3)) {
    return { id: "no-blow-ups", category: null };
  }

  const threePutts = holes.filter((h) => h.putts >= 3).length;
  if (threePutts <= 1 && !avoid.has("putting")) {
    return { id: "putting", category: "putting" };
  }

  const approach = calculateApproachSuccess(
    played.flatMap((h) => h.approachAttempts),
  );
  if (
    !avoid.has("approach") &&
    approach.ratedAttempts >= 10 &&
    approach.successRate !== null &&
    approach.successRate >= 0.65
  ) {
    return { id: "approach", category: "approach" };
  }

  const teeShots = holes.filter((h) => h.teeOutcome);
  const clearTee = teeShots.filter((h) => h.teeOutcome === "clear").length;
  if (
    !avoid.has("tee") &&
    teeShots.length >= 20 &&
    clearTee / teeShots.length >= 0.8
  ) {
    return { id: "tee", category: "tee" };
  }

  // Scrambling: reached the zone late but still got down in three most times.
  const missedInReg = holes.filter(
    (h) => h.shotsToZone > Math.max(h.par - 2, 0),
  );
  const scrambled = missedInReg.filter(
    (h) => h.score - h.shotsToZone <= 3,
  ).length;
  if (
    !avoid.has("short-game") &&
    missedInReg.length >= 8 &&
    scrambled / missedInReg.length >= 0.6
  ) {
    return { id: "scrambling", category: null };
  }

  return null;
};

/**
 * §60–64 — the golfer's Primary / Secondary focus and one thing to keep doing,
 * aggregated from the category-priority engine over the recent window. Returns
 * null below {@link RECOMMENDATION_MIN_ROUNDS} or when the stretch is genuinely
 * clean. The caller passes the last few completed rounds, newest first,
 * filtered to one methodology major (#6).
 */
export const calculateRecommendations = (
  history: readonly CompletedRound[],
): RecommendationSet | null => {
  const window = history.slice(0, RECOMMENDATION_FIRM_ROUNDS);
  if (window.length < RECOMMENDATION_MIN_ROUNDS) return null;

  const totalSeverity = new Map<ScoringCategory, number>();
  const roundsPresent = new Map<ScoringCategory, number>();
  const roundsProminent = new Map<ScoringCategory, number>();

  for (const round of window) {
    const { categories } = calculateCategoryPriority(round);
    const topTwo = new Set(categories.slice(0, 2).map((c) => c.category));
    for (const entry of categories) {
      totalSeverity.set(
        entry.category,
        (totalSeverity.get(entry.category) ?? 0) + entry.severity,
      );
      roundsPresent.set(
        entry.category,
        (roundsPresent.get(entry.category) ?? 0) + 1,
      );
      if (topTwo.has(entry.category)) {
        roundsProminent.set(
          entry.category,
          (roundsProminent.get(entry.category) ?? 0) + 1,
        );
      }
    }
  }

  const ranked = MISTAKE_CATEGORIES.map(
    (category): FocusArea => ({
      category,
      totalSeverity: toHalf(totalSeverity.get(category) ?? 0),
      roundsProminent: roundsProminent.get(category) ?? 0,
      roundsPresent: roundsPresent.get(category) ?? 0,
    }),
  )
    .filter((area) => area.totalSeverity > 0)
    .sort(
      (a, b) =>
        rankScore(b) - rankScore(a) ||
        MISTAKE_CATEGORIES.indexOf(a.category) -
          MISTAKE_CATEGORIES.indexOf(b.category),
    );

  if (ranked.length === 0) return null;

  const firm = window.length >= RECOMMENDATION_FIRM_ROUNDS;
  const primary = ranked[0]!;
  const runnerUp = ranked[1] ?? null;
  // Show a Secondary only when the runner-up is genuinely recurring and costly —
  // a top-two leak in 2+ rounds, worth ~2 shots. Never padded to fill a slot (#11).
  const secondary =
    firm && runnerUp && runnerUp.totalSeverity >= 2 && runnerUp.roundsProminent >= 2
      ? runnerUp
      : null;

  const avoid = new Set<ScoringCategory>([primary.category]);
  if (secondary) avoid.add(secondary.category);

  return {
    confidence: firm ? "firm" : "early",
    roundsUsed: window.length,
    primary,
    secondary,
    keepDoing: firm
      ? findKeepDoing(
          window.flatMap((r) => [...r.holes]),
          avoid,
        )
      : null,
  };
};
