import type {
  Round as PrismaRound,
  RoundHole as PrismaRoundHole,
} from "@prisma/client";
import {
  FIRST_PUTT_DISTANCE_BANDS,
  SCORING_ZONE_YARDS,
  assertCompletedHole,
  type CompletedRound,
  type FirstPuttDistanceBand,
} from "@/domain/scoring";

const asBand = (value: string | null): FirstPuttDistanceBand | undefined =>
  value !== null &&
  (FIRST_PUTT_DISTANCE_BANDS as readonly string[]).includes(value)
    ? (value as FirstPuttDistanceBand)
    : undefined;

/**
 * §101 — Prisma completed round -> the domain `CompletedRound` the scoring
 * engine consumes. Only `isComplete` holes are included; each is validated on
 * the way in (`assertCompletedHole`) — a hole marked complete has already
 * passed the same validator server-side, so this is a defensive backstop.
 *
 * Tee outcome/lie, approach attempts and mistakes join in Epics 8–9; for now
 * they are empty. `pickedUp` has no column yet — always `false`.
 */
export const toScoringRound = (
  round: PrismaRound & { holes: PrismaRoundHole[] },
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
