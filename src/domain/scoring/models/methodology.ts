/**
 * The scoring methodology version that produced a given analysis.
 * Bump per {@link https://semver.org} when the deterministic engine's output changes.
 * Completed rounds are stamped with this and their analysis snapshot is frozen at it.
 */
export const METHODOLOGY_VERSION = "1.0.0" as const;

export type MethodologyVersion = typeof METHODOLOGY_VERSION;

/**
 * Fixed Scoring Zone for V1 (yards). Robbins' Scoring Method uses 100.
 * Stored per round so a future configurable zone never rewrites history.
 */
export const SCORING_ZONE_YARDS = 100 as const;

export type ScoringZoneYards = typeof SCORING_ZONE_YARDS;

/**
 * Correction #5 — minimum recorded attempts in a single approach distance band
 * before the engine may name that band (or a miss direction within it) as a
 * weakness. ~12 attempts ≈ 15 rounds of history. Consumed by the trend and
 * recommendation engines (Epics 11+); until a band clears this, approach
 * analysis reports counts only, never a rate-based claim.
 */
export const APPROACH_BAND_MIN_SAMPLE = 12 as const;
