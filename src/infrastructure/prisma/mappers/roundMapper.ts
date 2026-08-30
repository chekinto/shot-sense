import type {
  Round as PrismaRound,
  RoundCourseSnapshot as PrismaSnapshot,
  RoundHole as PrismaRoundHole,
  RoundStatus as PrismaRoundStatus,
} from "@prisma/client";
import type {
  ActiveRound,
  PlayableRound,
  RoundStatus,
} from "@/features/rounds/types";

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
  holes: PrismaRoundHole[];
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
  scoringZoneYards: row.scoringZoneYards,
  handicapAtStart:
    row.handicapAtStart === null ? null : row.handicapAtStart.toNumber(),
  status: toDomainRoundStatus(row.status),
  holes: [...row.holes]
    .sort((a, b) => a.holeNumber - b.holeNumber)
    .map((h) => ({
      holeNumber: h.holeNumber,
      par: h.par,
      yardage: h.yardage,
      isComplete: h.isComplete,
    })),
});
