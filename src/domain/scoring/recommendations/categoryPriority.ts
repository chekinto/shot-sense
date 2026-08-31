import type { CompletedRound } from "../models/round";
import type { CompletedScoringHole } from "../models/hole";
import { MISTAKE_CATEGORIES, type MistakeCategory } from "../models/enums";
import { regulationShotsToZone } from "../calculations/benchmark";
import { calculateShotsFromZone } from "../calculations/shotsFromZone";

/**
 * §47–57 — the severity / frequency / category-priority engine.
 *
 * A deterministic, single-round attribution of *lost shots* to the seven §40
 * skill categories, ranked worst-first. This is the shared engine behind both
 * the round observations and (from Epic 12) the Primary / Secondary
 * recommendations — one analysis pass, two surfaces (correction #8).
 *
 * The methodology's "why" model is extrapolated and unproven (see plan). Every
 * weight below is a documented judgement, not a measurement. It blends the
 * near-certain losses (putts over two, penalty strokes, benchmark leaks) with a
 * conservative fractional estimate for the softer signals (a compromised tee
 * shot, a missed approach, a strategy call, the golfer's own mistake tags).
 * Picked-up holes are excluded — their "why" is too muddy (§9 correction).
 */
export type ScoringCategory = MistakeCategory;

export interface CategoryPriority {
  category: ScoringCategory;
  /** Estimated shots this category cost across the round (rounded to 0.5). */
  severity: number;
  /** Distinct holes where this category cost something. */
  frequency: number;
  /** Those hole numbers, ascending. */
  holes: number[];
  /** Self-flagged mistake tags in this category (§47 — a repeat is a signal). */
  flagged: number;
}

export interface CategoryPriorityAnalysis {
  /** Non-zero categories, worst first: severity, then frequency, then §40 order. */
  categories: CategoryPriority[];
  /** The single biggest leak this round, or null when nothing stood out. */
  top: CategoryPriority | null;
}

const toHalf = (n: number): number => Math.round(n * 2) / 2;

const LONG_LAG = new Set(["30-50ft", "50ft-plus"]);

/** Estimated shots each category cost on one (non-picked-up) hole. */
const attributeHole = (
  hole: CompletedScoringHole,
): Partial<Record<ScoringCategory, number>> => {
  const out: Partial<Record<ScoringCategory, number>> = {};
  const add = (category: ScoringCategory, amount: number): void => {
    if (amount > 0) out[category] = (out[category] ?? 0) + amount;
  };

  const shotsFromZone = calculateShotsFromZone(hole);
  const fromZoneLeak = Math.max(shotsFromZone - 3, 0);
  const toZoneLeak = Math.max(
    hole.shotsToZone - regulationShotsToZone(hole.par),
    0,
  );

  // Putting — putts over two; a long-lag 3-putt is discounted by half (#4).
  const rawPuttLoss = Math.max(hole.putts - 2, 0);
  add(
    "putting",
    hole.firstPuttDistance && LONG_LAG.has(hole.firstPuttDistance)
      ? rawPuttLoss / 2
      : rawPuttLoss,
  );

  // Short game — the finishing leak that wasn't putting (chips, pitches, sand).
  add("short-game", Math.max(fromZoneLeak - rawPuttLoss, 0));

  // Tee — the getting-to-the-zone leak, capped by how bad the tee shot was.
  const teeCap =
    hole.teeOutcome === "penalty"
      ? 2
      : hole.teeOutcome === "recovery-required"
        ? 1.5
        : hole.teeOutcome === "compromised"
          ? 1
          : 0;
  const teeLoss = Math.min(toZoneLeak, teeCap);
  add("tee", teeLoss);

  // Approach — the rest of the to-zone leak, plus a nod to a missed approach
  // that was scrambled back without adding a counted stroke.
  const missedApproaches = hole.approachAttempts.filter(
    (a) => a.result === "missed-zone",
  ).length;
  let approachLoss = Math.max(toZoneLeak - teeLoss, 0);
  if (approachLoss === 0 && missedApproaches > 0) approachLoss = 0.5;
  add("approach", Math.min(approachLoss, 2));

  // Strategy — a lay-up that still missed the zone is a plan that didn't work.
  if (
    missedApproaches > 0 &&
    hole.approachAttempts.some((a) => a.result === "intentional-layup")
  ) {
    add("strategy", 0.5);
  }

  // Recovery — a recovery-required tee shot that still cost the hole shots.
  if (hole.teeOutcome === "recovery-required" && toZoneLeak + fromZoneLeak >= 2) {
    add("recovery", 0.5);
  }

  // The golfer's own read, blended in at half a shot per tag.
  for (const tag of hole.mistakes) add(tag, 0.5);

  return out;
};

export const calculateCategoryPriority = (
  round: CompletedRound,
): CategoryPriorityAnalysis => {
  const severity = new Map<ScoringCategory, number>();
  const holes = new Map<ScoringCategory, Set<number>>();
  const flagged = new Map<ScoringCategory, number>();

  for (const hole of round.holes) {
    if (hole.pickedUp) continue;

    const contributions = attributeHole(hole);
    for (const category of MISTAKE_CATEGORIES) {
      const amount = contributions[category] ?? 0;
      if (amount <= 0) continue;
      severity.set(category, (severity.get(category) ?? 0) + amount);
      const set = holes.get(category) ?? new Set<number>();
      set.add(hole.holeNumber);
      holes.set(category, set);
    }
    for (const tag of hole.mistakes) {
      flagged.set(tag, (flagged.get(tag) ?? 0) + 1);
    }
  }

  const categories = MISTAKE_CATEGORIES.map(
    (category): CategoryPriority => ({
      category,
      severity: toHalf(severity.get(category) ?? 0),
      frequency: holes.get(category)?.size ?? 0,
      holes: [...(holes.get(category) ?? [])].sort((a, b) => a - b),
      flagged: flagged.get(category) ?? 0,
    }),
  )
    .filter((entry) => entry.severity > 0)
    .sort(
      (a, b) =>
        b.severity - a.severity ||
        b.frequency - a.frequency ||
        MISTAKE_CATEGORIES.indexOf(a.category) -
          MISTAKE_CATEGORIES.indexOf(b.category),
    );

  return { categories, top: categories[0] ?? null };
};
