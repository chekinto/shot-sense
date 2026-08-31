import type {
  Round as PrismaRound,
  RoundCourseSnapshot as PrismaSnapshot,
  RoundHole as PrismaRoundHole,
  RoundHoleApproach as PrismaApproach,
  RoundStatus as PrismaRoundStatus,
} from "@prisma/client";
import {
  APPROACH_DISTANCE_BANDS,
  APPROACH_RESULTS,
  FIRST_PUTT_DISTANCE_BANDS,
  MISS_DIRECTIONS,
  MISTAKE_CATEGORIES,
  TEE_LIES,
  TEE_OUTCOMES,
  type ApproachDistanceBand,
  type ApproachResult,
  type FirstPuttDistanceBand,
  type MissDirection,
  type MistakeCategory,
  type TeeLie,
  type TeeOutcome,
} from "@/domain/scoring";
import type {
  ActiveRound,
  PlayApproach,
  PlayHole,
  PlayableRound,
  RoundStatus,
} from "@/features/rounds/types";

const asFirstPuttBand = (value: string | null): FirstPuttDistanceBand | null =>
  value !== null &&
  (FIRST_PUTT_DISTANCE_BANDS as readonly string[]).includes(value)
    ? (value as FirstPuttDistanceBand)
    : null;

const asTeeOutcome = (value: string | null): TeeOutcome | null =>
  value !== null && (TEE_OUTCOMES as readonly string[]).includes(value)
    ? (value as TeeOutcome)
    : null;

const asTeeLie = (value: string | null): TeeLie | null =>
  value !== null && (TEE_LIES as readonly string[]).includes(value)
    ? (value as TeeLie)
    : null;

const asBand = (value: string): ApproachDistanceBand | null =>
  (APPROACH_DISTANCE_BANDS as readonly string[]).includes(value)
    ? (value as ApproachDistanceBand)
    : null;

const asResult = (value: string): ApproachResult | null =>
  (APPROACH_RESULTS as readonly string[]).includes(value)
    ? (value as ApproachResult)
    : null;

const asMissDirection = (value: string | null): MissDirection | null =>
  value !== null && (MISS_DIRECTIONS as readonly string[]).includes(value)
    ? (value as MissDirection)
    : null;

const asMistakes = (values: string[]): MistakeCategory[] =>
  values.filter((v): v is MistakeCategory =>
    (MISTAKE_CATEGORIES as readonly string[]).includes(v),
  );

/** Rows with an unrecognised band/result are dropped; sequences are re-numbered. */
const toPlayApproaches = (rows: PrismaApproach[]): PlayApproach[] =>
  [...rows]
    .sort((a, b) => a.sequence - b.sequence)
    .flatMap((row) => {
      const distanceBand = asBand(row.distanceBand);
      const result = asResult(row.result);
      if (!distanceBand || !result) return [];
      return [
        {
          sequence: 0,
          distanceBand,
          result,
          missDirection:
            result === "missed-zone" ? asMissDirection(row.missDirection) : null,
        },
      ];
    })
    .map((approach, index) => ({ ...approach, sequence: index + 1 }));

type PrismaHoleWithApproaches = PrismaRoundHole & { approaches: PrismaApproach[] };

export const toPlayHole = (h: PrismaHoleWithApproaches): PlayHole => ({
  holeNumber: h.holeNumber,
  par: h.par,
  yardage: h.yardage,
  isComplete: h.isComplete,
  version: h.version,
  score: h.score,
  shotsToZone: h.shotsToZone,
  putts: h.putts,
  firstPuttDistance: asFirstPuttBand(h.firstPuttDistance),
  teeOutcome: asTeeOutcome(h.teeOutcome),
  teeLie: asTeeLie(h.teeLie),
  approaches: toPlayApproaches(h.approaches),
  bunkerShots: h.bunkerShots,
  bunkersVisited: h.bunkersVisited,
  mistakes: asMistakes(h.mistakes),
  penaltyStrokes: h.penaltyStrokes,
});

const STATUS_FROM_DB: Record<PrismaRoundStatus, RoundStatus> = {
  DRAFT: "draft",
  IN_PROGRESS: "in-progress",
  PAUSED: "paused",
  COMPLETED: "completed",
  ABANDONED: "abandoned",
};

export const toDomainRoundStatus = (status: PrismaRoundStatus): RoundStatus =>
  STATUS_FROM_DB[status];

const firstIncompleteHole = (
  holes: Pick<PrismaRoundHole, "holeNumber" | "isComplete">[],
  plannedHoleCount: number,
): number => {
  const pending = holes
    .filter((h) => !h.isComplete)
    .map((h) => h.holeNumber)
    .sort((a, b) => a - b);
  return pending[0] ?? plannedHoleCount;
};

type RoundWithSnapshotAndHoles = PrismaRound & {
  snapshot: PrismaSnapshot | null;
  holes: PrismaHoleWithApproaches[];
};

export const toActiveRound = (row: RoundWithSnapshotAndHoles): ActiveRound => ({
  id: row.id,
  courseName: row.snapshot?.courseName ?? "Round",
  teeName: row.snapshot?.teeName ?? null,
  plannedHoleCount: row.plannedHoleCount,
  completedHoleCount: row.holes.filter((h) => h.isComplete).length,
  resumeHoleNumber: firstIncompleteHole(row.holes, row.plannedHoleCount),
  playedOn: row.playedOn,
  status: toDomainRoundStatus(row.status),
});

export const toPlayableRound = (
  row: RoundWithSnapshotAndHoles,
): PlayableRound => ({
  id: row.id,
  courseName: row.snapshot?.courseName ?? "Round",
  teeName: row.snapshot?.teeName ?? null,
  plannedHoleCount: row.plannedHoleCount,
  completedHoleCount: row.holes.filter((h) => h.isComplete).length,
  scoringZoneYards: row.scoringZoneYards,
  handicapAtStart:
    row.handicapAtStart === null ? null : row.handicapAtStart.toNumber(),
  status: toDomainRoundStatus(row.status),
  holes: [...row.holes]
    .sort((a, b) => a.holeNumber - b.holeNumber)
    .map(toPlayHole),
});
