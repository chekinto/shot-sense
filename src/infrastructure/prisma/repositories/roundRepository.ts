import "server-only";
import { prisma } from "../client";
import { toActiveRound, toPlayableRound } from "../mappers/roundMapper";
import { METHODOLOGY_VERSION, SCORING_ZONE_YARDS } from "@/domain/scoring";
import type {
  ActiveRound,
  HolePatch,
  PlayHole,
  PlayableRound,
} from "@/features/rounds/types";

/** The round does not exist, is not the user's, or is already completed/abandoned. */
export class RoundNotEditableError extends Error {
  constructor() {
    super("This round can no longer be edited");
    this.name = "RoundNotEditableError";
  }
}

/** A concurrent edit changed the hole since the client last read it (§23). */
export class StaleHoleError extends Error {
  constructor() {
    super("This hole was changed elsewhere — reload to see the latest");
    this.name = "StaleHoleError";
  }
}

export interface StartRoundData {
  userId: string;
  courseId: string;
  teeSetId: string | null;
  handicapAtStart: number | null;
  playedOn: Date;
  plannedHoleCount: number;
  snapshot: { courseName: string; teeName: string | null };
  holes: { holeNumber: number; par: number; yardage: number | null }[];
}

const withSnapshotAndHoles = {
  snapshot: true,
  holes: true,
} as const;

export const roundRepository = {
  /** Creates the round, its course snapshot, and a row per hole in one write. */
  async start(data: StartRoundData): Promise<string> {
    const round = await prisma.round.create({
      data: {
        userId: data.userId,
        courseId: data.courseId,
        teeSetId: data.teeSetId,
        playedOn: data.playedOn,
        plannedHoleCount: data.plannedHoleCount,
        handicapAtStart: data.handicapAtStart,
        scoringZoneYards: SCORING_ZONE_YARDS,
        status: "IN_PROGRESS",
        methodologyVersion: METHODOLOGY_VERSION,
        snapshot: {
          create: {
            courseName: data.snapshot.courseName,
            teeName: data.snapshot.teeName,
          },
        },
        holes: {
          create: data.holes.map((hole) => ({
            holeNumber: hole.holeNumber,
            par: hole.par,
            yardage: hole.yardage,
          })),
        },
      },
      select: { id: true },
    });
    return round.id;
  },

  /** Most recently updated resumable round for the user (§112). */
  async findActive(userId: string): Promise<ActiveRound | null> {
    const row = await prisma.round.findFirst({
      where: { userId, status: { in: ["IN_PROGRESS", "PAUSED"] } },
      orderBy: { updatedAt: "desc" },
      include: withSnapshotAndHoles,
    });
    return row ? toActiveRound(row) : null;
  },

  async findByIdForUser(
    userId: string,
    roundId: string,
  ): Promise<PlayableRound | null> {
    const row = await prisma.round.findFirst({
      where: { id: roundId, userId },
      include: withSnapshotAndHoles,
    });
    return row ? toPlayableRound(row) : null;
  },

  /**
   * Autosave a partial hole update. Verifies the round is the user's and still
   * editable, applies the patch, bumps the hole version. `expectedVersion`, when
   * given, guards against a stale overwrite (§23).
   */
  async saveHolePatch(
    userId: string,
    roundId: string,
    holeNumber: number,
    patch: HolePatch,
    expectedVersion?: number,
  ): Promise<PlayHole> {
    await assertEditable(userId, roundId);

    const current = await prisma.roundHole.findUnique({
      where: { roundId_holeNumber: { roundId, holeNumber } },
      select: { version: true },
    });
    if (!current) throw new RoundNotEditableError();
    if (expectedVersion !== undefined && current.version !== expectedVersion) {
      throw new StaleHoleError();
    }

    const row = await prisma.roundHole.update({
      where: { roundId_holeNumber: { roundId, holeNumber } },
      data: { ...patch, version: { increment: 1 } },
    });
    return {
      holeNumber: row.holeNumber,
      par: row.par,
      yardage: row.yardage,
      isComplete: row.isComplete,
      version: row.version,
      score: row.score,
      shotsToZone: row.shotsToZone,
      putts: row.putts,
      firstPuttDistance:
        (row.firstPuttDistance as PlayHole["firstPuttDistance"]) ?? null,
      penaltyStrokes: row.penaltyStrokes,
    };
  },

  /** Marks a hole complete/incomplete and re-derives the round's completed count. */
  async setHoleComplete(
    userId: string,
    roundId: string,
    holeNumber: number,
    isComplete: boolean,
  ): Promise<{ completedHoleCount: number }> {
    await assertEditable(userId, roundId);

    return prisma.$transaction(async (tx) => {
      await tx.roundHole.update({
        where: { roundId_holeNumber: { roundId, holeNumber } },
        data: { isComplete, version: { increment: 1 } },
      });
      const completedHoleCount = await tx.roundHole.count({
        where: { roundId, isComplete: true },
      });
      await tx.round.update({
        where: { id: roundId },
        data: { completedHoleCount },
      });
      return { completedHoleCount };
    });
  },

  /** Completes the round (§20 — may be fewer holes than planned). */
  async complete(
    userId: string,
    roundId: string,
    completedHoleCount: number,
  ): Promise<void> {
    await assertEditable(userId, roundId);
    await prisma.round.update({
      where: { id: roundId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        completedHoleCount,
        version: { increment: 1 },
      },
    });
  },
};

const assertEditable = async (
  userId: string,
  roundId: string,
): Promise<void> => {
  const round = await prisma.round.findFirst({
    where: { id: roundId, userId },
    select: { status: true },
  });
  if (!round || (round.status !== "IN_PROGRESS" && round.status !== "PAUSED")) {
    throw new RoundNotEditableError();
  }
};

export type RoundRepository = typeof roundRepository;
