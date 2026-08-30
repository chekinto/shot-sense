import type { CompletedRound } from "../models/round";
import {
  TEE_LIES,
  TEE_OUTCOMES,
  type TeeLie,
  type TeeOutcome,
} from "../models/enums";

const zeroed = <K extends string>(keys: readonly K[]): Record<K, number> =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;

/**
 * §29–31 — the round's tee-shot picture, judged by consequence (not
 * fairways-hit). Event counts only; no success/failure *rate* claims — those
 * wait for the trend engine (corrections #5 / #8). Tee fields never block hole
 * completion (§99), so a round can have fewer tee outcomes than holes played.
 *
 * "Costly" = a tee shot that forced a recovery or drew a penalty stroke — the
 * genuinely stroke-costing outcomes. "Compromised" is trouble but not counted
 * as costly on its own.
 */
export interface TeeContext {
  /** Holes with a tee outcome recorded. */
  recorded: number;
  outcomes: Record<TeeOutcome, number>;
  lies: Record<TeeLie, number>;
  /** compromised + recovery-required + penalty. */
  troubleOffTee: number;
  /** recovery-required + penalty. */
  costlyOffTee: number;
  /** Ascending hole numbers of the costly tee shots. */
  costlyHoles: number[];
  /** Costly holes whose tee shot itself drew a penalty stroke. */
  penaltyOffTee: number;
}

const TROUBLE: readonly TeeOutcome[] = [
  "compromised",
  "recovery-required",
  "penalty",
];
const COSTLY: readonly TeeOutcome[] = ["recovery-required", "penalty"];

export const calculateTeeContext = (round: CompletedRound): TeeContext => {
  const outcomes = zeroed(TEE_OUTCOMES);
  const lies = zeroed(TEE_LIES);
  const costlyHoles: number[] = [];
  let recorded = 0;
  let penaltyOffTee = 0;

  const ordered = [...round.holes].sort(
    (a, b) => a.holeNumber - b.holeNumber,
  );
  for (const hole of ordered) {
    if (hole.teeLie) lies[hole.teeLie] += 1;
    if (!hole.teeOutcome) continue;
    recorded += 1;
    outcomes[hole.teeOutcome] += 1;
    if (COSTLY.includes(hole.teeOutcome)) {
      costlyHoles.push(hole.holeNumber);
      if (hole.teeOutcome === "penalty" && hole.penaltyStrokes > 0) {
        penaltyOffTee += 1;
      }
    }
  }

  const sum = (keys: readonly TeeOutcome[]): number =>
    keys.reduce((total, key) => total + outcomes[key], 0);

  return {
    recorded,
    outcomes,
    lies,
    troubleOffTee: sum(TROUBLE),
    costlyOffTee: sum(COSTLY),
    costlyHoles,
    penaltyOffTee,
  };
};
