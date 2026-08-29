import type { ApproachAttempt } from "./approach";
import type {
  FirstPuttDistanceBand,
  MistakeCategory,
  TeeLie,
  TeeOutcome,
} from "./enums";

/** Fields every hole carries regardless of whether it is finished. */
export interface ScoringHoleIdentity {
  /** 1–18. */
  holeNumber: number;
  /** Snapshot of the hole's par at the time the round was played (3–6). */
  par: number;
}

/**
 * §9 correction — a hole where the golfer stopped and picked up. The strokes
 * actually taken are still recorded (so score/penalty analysis is honest), but
 * putting and approach-success analysis exclude the hole.
 */
export interface PickUpState {
  pickedUp: boolean;
}

/**
 * §85 / §95 — a hole that is still being played. Scoring fields may be missing.
 * The scoring engine never accepts this type; it is the app's active-round shape.
 */
export interface IncompleteScoringHole extends ScoringHoleIdentity, PickUpState {
  status: "incomplete";
  score?: number;
  shotsToZone?: number;
  putts?: number;
  firstPuttDistance?: FirstPuttDistanceBand;
  penaltyStrokes: number;
  bunkerShots: number;
  bunkersVisited: number;
  teeOutcome?: TeeOutcome;
  teeLie?: TeeLie;
  approachAttempts: readonly ApproachAttempt[];
  mistakes: readonly MistakeCategory[];
}

/**
 * §95 — a validated, calculation-ready hole. Only this shape may enter the
 * scoring calculations. Required scoring fields are present and satisfy the
 * hole invariant `shotsToZone + shotsFromZone = score`. Optional analytics
 * fields (tee outcome/lie, mistakes) may still be absent — they never block
 * completion (§99).
 */
export interface CompletedScoringHole extends ScoringHoleIdentity, PickUpState {
  status: "completed";
  /** Total strokes for the hole including penalty strokes (§26). > 0. */
  score: number;
  /** Strokes taken before reaching the Scoring Zone or green (§8). 0 ≤ x ≤ score. */
  shotsToZone: number;
  /** Putts on the green (§27). Putts with a putter from the fringe do not count. */
  putts: number;
  /** Present iff `putts > 0` (§28). */
  firstPuttDistance?: FirstPuttDistanceBand;
  /** Total penalty strokes on the hole (§39). Authoritative. */
  penaltyStrokes: number;
  /** Total strokes played from bunkers on the hole (§38). */
  bunkerShots: number;
  /**
   * Distinct bunkers the ball came to rest in (§38 correction #3). Two clean
   * one-shot escapes from two bunkers => `bunkerShots = 2`, `bunkersVisited = 2`,
   * Bunker STGB 0 — not 1.
   */
  bunkersVisited: number;
  teeOutcome?: TeeOutcome;
  teeLie?: TeeLie;
  approachAttempts: readonly ApproachAttempt[];
  mistakes: readonly MistakeCategory[];
}

export type ScoringHole = IncompleteScoringHole | CompletedScoringHole;

/**
 * The loose shape accepted by {@link validateCompletedHole} — what a mapper or
 * form hands the domain before validation. Everything optional except identity.
 */
export interface RawHoleInput extends Partial<ScoringHoleIdentity> {
  holeNumber?: number;
  par?: number;
  pickedUp?: boolean;
  score?: number;
  shotsToZone?: number;
  putts?: number;
  firstPuttDistance?: FirstPuttDistanceBand;
  penaltyStrokes?: number;
  bunkerShots?: number;
  bunkersVisited?: number;
  teeOutcome?: TeeOutcome;
  teeLie?: TeeLie;
  approachAttempts?: readonly ApproachAttempt[];
  mistakes?: readonly MistakeCategory[];
}

export const isCompletedHole = (
  hole: ScoringHole,
): hole is CompletedScoringHole => hole.status === "completed";
