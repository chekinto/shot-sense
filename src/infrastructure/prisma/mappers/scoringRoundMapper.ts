import type {
  Round as PrismaRound,
  RoundHole as PrismaRoundHole,
  RoundHoleApproach as PrismaApproach,
} from "@prisma/client";
import {
  APPROACH_DISTANCE_BANDS,
  APPROACH_RESULTS,
  FIRST_PUTT_DISTANCE_BANDS,
  MISS_DIRECTIONS,
  SCORING_ZONE_YARDS,
  TEE_LIES,
  TEE_OUTCOMES,
  assertCompletedHole,
  type ApproachAttempt,
  type ApproachDistanceBand,
  type ApproachResult,
  type CompletedRound,
  type FirstPuttDistanceBand,
  type MissDirection,
  type TeeLie,
  type TeeOutcome,
} from "@/domain/scoring";

const asBand = (value: string | null): FirstPuttDistanceBand | undefined =>
  value !== null &&
  (FIRST_PUTT_DISTANCE_BANDS as readonly string[]).includes(value)
    ? (value as FirstPuttDistanceBand)
    : undefined;

const asTeeOutcome = (value: string | null): TeeOutcome | undefined =>
  value !== null && (TEE_OUTCOMES as readonly string[]).includes(value)
    ? (value as TeeOutcome)
    : undefined;

const asTeeLie = (value: string | null): TeeLie | undefined =>
  value !== null && (TEE_LIES as readonly string[]).includes(value)
    ? (value as TeeLie)
    : undefined;

/**
 * DB approach rows -> domain attempts. Rows with an unrecognised band or result,
 * or a `missed-zone` row missing a valid direction, are dropped (defensive —
 * the write path validates first). Sequence is re-derived from play order.
 */
const toApproachAttempts = (rows: PrismaApproach[]): ApproachAttempt[] =>
  [...rows]
    .sort((a, b) => a.sequence - b.sequence)
    .flatMap((row, index): ApproachAttempt[] => {
      const band = (APPROACH_DISTANCE_BANDS as readonly string[]).includes(
        row.distanceBand,
      )
        ? (row.distanceBand as ApproachDistanceBand)
        : null;
      const result = (APPROACH_RESULTS as readonly string[]).includes(row.result)
        ? (row.result as ApproachResult)
        : null;
      if (!band || !result) return [];
      const sequence = index + 1;

      if (result === "missed-zone") {
        const direction = (MISS_DIRECTIONS as readonly string[]).includes(
          row.missDirection ?? "",
        )
          ? (row.missDirection as MissDirection)
          : null;
        if (!direction) return [];
        return [
          { sequence, distanceBand: band, result, missDirection: direction },
        ];
      }
      return [{ sequence, distanceBand: band, result }];
    });

/**
 * §101 — Prisma completed round -> the domain `CompletedRound` the scoring
 * engine consumes. Only `isComplete` holes are included; each is validated on
 * the way in (`assertCompletedHole`) — a hole marked complete has already
 * passed the same validator server-side, so this is a defensive backstop.
 *
 * Tee outcome/lie (Epic 7) and approach attempts (Epic 8) are carried through.
 * Mistakes join in Epic 9. `pickedUp` has no column yet — always `false`.
 */
export const toScoringRound = (
  round: PrismaRound & {
    holes: (PrismaRoundHole & { approaches: PrismaApproach[] })[];
  },
): CompletedRound => {
  const holes = round.holes
    .filter((h) => h.isComplete)
    .sort((a, b) => a.holeNumber - b.holeNumber)
    .map((h) =>
      assertCompletedHole({
        holeNumber: h.holeNumber,
        par: h.par,
        pickedUp: false,
        score: h.score ?? undefined,
        shotsToZone: h.shotsToZone ?? undefined,
        putts: h.putts ?? undefined,
        firstPuttDistance:
          h.putts !== null && h.putts > 0
            ? asBand(h.firstPuttDistance)
            : undefined,
        penaltyStrokes: h.penaltyStrokes,
        bunkerShots: h.bunkerShots,
        bunkersVisited: h.bunkersVisited,
        teeOutcome: asTeeOutcome(h.teeOutcome),
        teeLie: asTeeLie(h.teeLie),
        approachAttempts: toApproachAttempts(h.approaches),
      }),
    );

  return {
    id: round.id,
    scoringZoneYards: SCORING_ZONE_YARDS,
    ...(round.handicapAtStart !== null
      ? { handicapAtStart: round.handicapAtStart.toNumber() }
      : {}),
    plannedHoleCount: round.plannedHoleCount === 9 ? 9 : 18,
    holes,
    methodologyVersion: round.methodologyVersion,
  };
};
