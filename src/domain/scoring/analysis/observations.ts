import type { CompletedRound } from "../models/round";
import type { CompletedScoringHole } from "../models/hole";
import { isBackNine } from "../models/round";
import { calculateScoreToPar } from "../calculations/scoreToPar";

/**
 * Correction #8 — the "This round" tier of the post-round screen.
 *
 * V1 observations are **event counts and within-round facts only**. No
 * success/failure *rate* claims ("your 175 yd approach game") — those aren't
 * defensible from a single round and wait for the trend engine. Language is
 * always "this round", never "you tend to".
 *
 * Deterministic. At most {@link OBSERVATION_LIMIT} are surfaced, ranked by
 * `weight` with a stable `id` tie-break.
 */
export interface RoundObservation {
  id: string;
  basis: "event-count";
  text: string;
  /** Ordering + top-N cut only; never shown to the user. */
  weight: number;
}

export const OBSERVATION_LIMIT = 3;

const LONG_RANGE_BANDS = new Set(["30-50ft", "50ft-plus"]);

const holeNumbers = (holes: CompletedScoringHole[]): string =>
  holes.map((h) => h.holeNumber).join(", ");

const penaltyObservation = (
  holes: readonly CompletedScoringHole[],
): RoundObservation | null => {
  const affected = holes.filter((h) => h.penaltyStrokes > 0);
  const strokes = affected.reduce((sum, h) => sum + h.penaltyStrokes, 0);
  if (strokes === 0) return null;
  return {
    id: "penalties",
    basis: "event-count",
    text:
      affected.length === 1
        ? `${strokes} penalty stroke${strokes === 1 ? "" : "s"} on hole ${affected[0]!.holeNumber}.`
        : `${strokes} penalty strokes across ${affected.length} holes (${holeNumbers([...affected])}).`,
    weight: 100 + strokes * 5,
  };
};

const threePuttObservation = (
  holes: readonly CompletedScoringHole[],
): RoundObservation | null => {
  const threePutts = holes.filter((h) => h.putts >= 3);
  if (threePutts.length === 0) return null;
  const longRange = threePutts.filter(
    (h) => h.firstPuttDistance && LONG_RANGE_BANDS.has(h.firstPuttDistance),
  ).length;

  let text = `${threePutts.length} hole${threePutts.length === 1 ? "" : "s"} with 3 or more putts (${holeNumbers([...threePutts])}).`;
  if (longRange === threePutts.length) {
    text += " All from long range — lag putts, not clear giveaways.";
  } else if (longRange > 0) {
    text += ` ${longRange} from long range.`;
  }
  return { id: "three-putts", basis: "event-count", text, weight: 60 + threePutts.length * 5 };
};

const blowUpObservation = (
  holes: readonly CompletedScoringHole[],
): RoundObservation | null => {
  const blowUps = holes.filter((h) => calculateScoreToPar(h) >= 3);
  if (blowUps.length === 0) return null;
  const allBack = blowUps.every((h) => isBackNine(h.holeNumber));
  const allPar4 = blowUps.every((h) => h.par === 4);
  let text = `${blowUps.length} blow-up hole${blowUps.length === 1 ? "" : "s"} (triple bogey or worse): ${holeNumbers([...blowUps])}.`;
  if (blowUps.length > 1 && allBack) text += " All on the back nine.";
  else if (blowUps.length > 1 && allPar4) text += " All par 4s.";
  return { id: "blow-ups", basis: "event-count", text, weight: 70 + blowUps.length * 5 };
};

const bunkerObservation = (
  holes: readonly CompletedScoringHole[],
): RoundObservation | null => {
  const stuck = holes.filter((h) => h.bunkerShots >= 2);
  if (stuck.length === 0) return null;
  return {
    id: "bunkers",
    basis: "event-count",
    text: `${stuck.length} hole${stuck.length === 1 ? "" : "s"} needed 2 or more shots to escape a bunker (${holeNumbers([...stuck])}).`,
    weight: 55 + stuck.length * 5,
  };
};

const nineSplitObservation = (
  round: CompletedRound,
): RoundObservation | null => {
  if (round.plannedHoleCount !== 18) return null;
  const front = round.holes.filter((h) => h.holeNumber <= 9);
  const back = round.holes.filter((h) => h.holeNumber >= 10);
  if (front.length < 9 || back.length < 9) return null;

  const toPar = (hs: CompletedScoringHole[]) =>
    hs.reduce((sum, h) => sum + calculateScoreToPar(h), 0);
  const diff = toPar(front) - toPar(back);
  if (Math.abs(diff) < 4) return null;

  return {
    id: "nine-split",
    basis: "event-count",
    text:
      diff > 0
        ? `Your back nine was ${diff} shots better than your front.`
        : `Your front nine was ${-diff} shots better than your back.`,
    weight: 40,
  };
};

const tidyRoundObservation = (
  holes: readonly CompletedScoringHole[],
): RoundObservation | null => {
  const clean =
    holes.every((h) => h.penaltyStrokes === 0) &&
    holes.every((h) => h.putts < 3) &&
    holes.every((h) => calculateScoreToPar(h) < 3);
  if (!clean) return null;
  return {
    id: "tidy",
    basis: "event-count",
    text: "No penalties, no 3-putts and no blow-up holes — a tidy round.",
    weight: 10,
  };
};

export const generateRoundObservations = (
  round: CompletedRound,
): RoundObservation[] => {
  const played = round.holes.filter((h) => !h.pickedUp);
  const candidates = [
    penaltyObservation(played),
    blowUpObservation(played),
    threePuttObservation(played),
    bunkerObservation(played),
    nineSplitObservation(round),
    tidyRoundObservation(played),
  ].filter((o): o is RoundObservation => o !== null);

  return candidates
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, OBSERVATION_LIMIT);
};
