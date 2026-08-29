/**
 * Framework-independent enumerations for the scoring methodology.
 * These are the domain's own values — never import Prisma-generated enums here.
 * Persistence and UI convert to/from these at the mapper boundary.
 */

/** §26 / §66 — hole result buckets (exact score is always retained in raw data). */
export const HOLE_RESULTS = [
  "eagle-or-better",
  "birdie",
  "par",
  "bogey",
  "double-bogey",
  "triple-bogey-plus",
] as const;
export type HoleResult = (typeof HOLE_RESULTS)[number];

/** §28 — first-putt distance bands (only meaningful when putts > 0). */
export const FIRST_PUTT_DISTANCE_BANDS = [
  "under-5ft",
  "5-15ft",
  "15-30ft",
  "30-50ft",
  "50ft-plus",
] as const;
export type FirstPuttDistanceBand = (typeof FIRST_PUTT_DISTANCE_BANDS)[number];

/** §29 — tee outcome, judged by consequence rather than fairways-hit. */
export const TEE_OUTCOMES = [
  "clear",
  "compromised",
  "recovery-required",
  "penalty",
] as const;
export type TeeOutcome = (typeof TEE_OUTCOMES)[number];

/** §30 — tee lie, supports contextual/traditional stats. */
export const TEE_LIES = ["fairway", "rough", "bunker", "trees-other"] as const;
export type TeeLie = (typeof TEE_LIES)[number];

/** §32 — approach distance bands (exact yardage not required). */
export const APPROACH_DISTANCE_BANDS = [
  "under-100",
  "100-124",
  "125-149",
  "150-174",
  "175-199",
  "200-plus",
] as const;
export type ApproachDistanceBand = (typeof APPROACH_DISTANCE_BANDS)[number];

/** §33 — approach result. */
export const APPROACH_RESULTS = [
  "green",
  "scoring-zone",
  "missed-zone",
  "intentional-layup",
] as const;
export type ApproachResult = (typeof APPROACH_RESULTS)[number];

/** §35 — miss direction (no compound directions in V1). */
export const MISS_DIRECTIONS = ["short", "long", "left", "right"] as const;
export type MissDirection = (typeof MISS_DIRECTIONS)[number];

/** §39 — penalty types are descriptive only; they never imply a stroke count. */
export const PENALTY_TYPES = [
  "out-of-bounds",
  "penalty-area",
  "lost-ball",
  "unplayable",
  "relief-rules",
  "other",
] as const;
export type PenaltyType = (typeof PENALTY_TYPES)[number];

/** §40 — broad mistake categories (detailed reasons are a future feature, §41). */
export const MISTAKE_CATEGORIES = [
  "tee",
  "approach",
  "short-game",
  "putting",
  "strategy",
  "recovery",
  "other",
] as const;
export type MistakeCategory = (typeof MISTAKE_CATEGORIES)[number];

/** Planned hole counts a round can target. */
export const PLANNED_HOLE_COUNTS = [9, 18] as const;
export type PlannedHoleCount = (typeof PLANNED_HOLE_COUNTS)[number];
