import "server-only";
import { prisma } from "../client";
import {
  toActiveRound,
  toPlayHole,
  toPlayableRound,
} from "../mappers/roundMapper";
import {
  METHODOLOGY_VERSION,
  SCORING_ZONE_YARDS,
  validateCompletedHole,
} from "@/domain/scoring";
import type {
  ActiveRound,
  HolePatch,
  PlayApproach,
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

export interface CoarseHoleInput {
  holeNumber: number;
  par: number;
  score: number;
  shotsToZone: number;
  putts: number;
  penaltyStrokes: number;
}

export interface CoarseRoundData {
  userId: string;
  courseName: string;
  playedOn: Date;
  handicapAtStart: number | null;
  holes: CoarseHoleInput[];
}

export interface CompletedRoundListItem {
  id: string;
  courseName: string;
  playedOn: Date;
  holesPlayed: number;
  score: number;
  toPar: number;
  dataCompleteness: "full" | "coarse";
}

export interface CoarseRoundEdit {
  id: string;
  courseName: string;
  playedOn: Date;
  handicapAtStart: number | null;
  holes: CoarseHoleInput[];
}

const withSnapshotAndHoles = {
  snapshot: true,
  holes: { include: { approaches: true } },
} as const;

const withHolesAndApproaches = {
  holes: { include: { approaches: true } },
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

  /** Raw completed round (+ snapshot + holes) for the analysis engine. */
  async findCompletedRow(userId: string, roundId: string) {
    return prisma.round.findFirst({
      where: {
        id: roundId,
        userId,
        status: { in: ["COMPLETED", "ABANDONED"] },
      },
      include: withSnapshotAndHoles,
    });
  },

  /**
   * The user's most recent completed rounds before `beforeCompletedAt` (or all,
   * when null), newest first, for the rolling personal baseline (Epic 11).
   */
  async recentCompletedRows(
    userId: string,
    beforeCompletedAt: Date | null,
    limit: number,
  ) {
    return prisma.round.findMany({
      where: {
        userId,
        status: "COMPLETED",
        ...(beforeCompletedAt ? { completedAt: { lt: beforeCompletedAt } } : {}),
      },
      orderBy: { completedAt: "desc" },
      take: limit,
      include: withHolesAndApproaches,
    });
  },

  async countCompleted(userId: string): Promise<number> {
    return prisma.round.count({ where: { userId, status: "COMPLETED" } });
  },

  /** Completed rounds for the history page — lightweight, newest first. */
  async listCompleted(userId: string): Promise<CompletedRoundListItem[]> {
    const rows = await prisma.round.findMany({
      where: { userId, status: "COMPLETED" },
      orderBy: [{ playedOn: "desc" }, { completedAt: "desc" }],
      include: {
        snapshot: { select: { courseName: true } },
        holes: { select: { score: true, par: true, isComplete: true } },
      },
    });
    return rows.map((row) => {
      const played = row.holes.filter((h) => h.isComplete);
      const score = played.reduce((sum, h) => sum + (h.score ?? 0), 0);
      const par = played.reduce((sum, h) => sum + h.par, 0);
      return {
        id: row.id,
        courseName: row.snapshot?.courseName ?? "Round",
        playedOn: row.playedOn,
        holesPlayed: played.length,
        score,
        toPar: score - par,
        dataCompleteness: row.dataCompleteness === "COARSE" ? "coarse" : "full",
      };
    });
  },

  /** Hard-delete a round the user owns (holes + snapshot cascade). */
  async deleteById(userId: string, roundId: string): Promise<void> {
    const { count } = await prisma.round.deleteMany({
      where: { id: roundId, userId },
    });
    if (count === 0) throw new RoundNotEditableError();
  },

  /** Create a finished, coarse historical round in one write (Epic 11, #9). */
  async createCoarse(data: CoarseRoundData): Promise<string> {
    const now = new Date();
    const round = await prisma.round.create({
      data: {
        userId: data.userId,
        courseId: null,
        teeSetId: null,
        playedOn: data.playedOn,
        plannedHoleCount: data.holes.length === 9 ? 9 : 18,
        completedHoleCount: data.holes.length,
        handicapAtStart: data.handicapAtStart,
        scoringZoneYards: SCORING_ZONE_YARDS,
        status: "COMPLETED",
        dataCompleteness: "COARSE",
        methodologyVersion: METHODOLOGY_VERSION,
        completedAt: now,
        snapshot: { create: { courseName: data.courseName, teeName: null } },
        holes: {
          create: data.holes.map((hole) => ({
            holeNumber: hole.holeNumber,
            par: hole.par,
            score: hole.score,
            shotsToZone: hole.shotsToZone,
            putts: hole.putts,
            penaltyStrokes: hole.penaltyStrokes,
            isComplete: true,
          })),
        },
      },
      select: { id: true },
    });
    return round.id;
  },

  /** Rewrite a coarse round's snapshot + holes wholesale (Epic 11 edit). */
  async updateCoarse(
    userId: string,
    roundId: string,
    data: Omit<CoarseRoundData, "userId">,
  ): Promise<void> {
    const round = await prisma.round.findFirst({
      where: { id: roundId, userId, dataCompleteness: "COARSE" },
      select: { id: true },
    });
    if (!round) throw new RoundNotEditableError();

    await prisma.$transaction([
      prisma.roundCourseSnapshot.update({
        where: { roundId },
        data: { courseName: data.courseName },
      }),
      prisma.roundHole.deleteMany({ where: { roundId } }),
      prisma.roundHole.createMany({
        data: data.holes.map((hole) => ({
          roundId,
          holeNumber: hole.holeNumber,
          par: hole.par,
          score: hole.score,
          shotsToZone: hole.shotsToZone,
          putts: hole.putts,
          penaltyStrokes: hole.penaltyStrokes,
          isComplete: true,
        })),
      }),
      prisma.round.update({
        where: { id: roundId },
        data: {
          playedOn: data.playedOn,
          handicapAtStart: data.handicapAtStart,
          plannedHoleCount: data.holes.length === 9 ? 9 : 18,
          completedHoleCount: data.holes.length,
          version: { increment: 1 },
        },
      }),
    ]);
  },

  /** A coarse round's editable shape, or null. */
  async findCoarseForEdit(
    userId: string,
    roundId: string,
  ): Promise<CoarseRoundEdit | null> {
    const row = await prisma.round.findFirst({
      where: { id: roundId, userId, dataCompleteness: "COARSE" },
      include: { snapshot: true, holes: { orderBy: { holeNumber: "asc" } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      courseName: row.snapshot?.courseName ?? "",
      playedOn: row.playedOn,
      handicapAtStart: row.handicapAtStart?.toNumber() ?? null,
      holes: row.holes.map((h) => ({
        holeNumber: h.holeNumber,
        par: h.par,
        score: h.score ?? 0,
        shotsToZone: h.shotsToZone ?? 0,
        putts: h.putts ?? 0,
        penaltyStrokes: h.penaltyStrokes,
      })),
    };
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

    // `approaches` live in their own table — never a column on round_holes.
    const { approaches, ...scalarPatch } = patch;

    let row = await prisma.roundHole.update({
      where: { roundId_holeNumber: { roundId, holeNumber } },
      data: { ...scalarPatch, version: { increment: 1 } },
      include: { approaches: true },
    });

    // Only touch the approaches table when there's something to change — the
    // common hole has none and the sync payload still carries an empty list.
    if (
      approaches !== undefined &&
      (approaches.length > 0 || row.approaches.length > 0)
    ) {
      await replaceApproaches(row.id, approaches);
      row = await prisma.roundHole.findUniqueOrThrow({
        where: { id: row.id },
        include: { approaches: true },
      });
    }

    // A previously-completed hole that an edit has made invalid drops back to
    // incomplete (never auto-completed — that stays an explicit Save, §24).
    if (row.isComplete) {
      const stillValid = validateCompletedHole({
        holeNumber: row.holeNumber,
        par: row.par,
        score: row.score ?? undefined,
        shotsToZone: row.shotsToZone ?? undefined,
        putts: row.putts ?? undefined,
        firstPuttDistance:
          (row.firstPuttDistance as PlayHole["firstPuttDistance"]) ?? undefined,
        penaltyStrokes: row.penaltyStrokes,
        bunkerShots: row.bunkerShots,
        bunkersVisited: row.bunkersVisited,
      }).ok;
      if (!stillValid) {
        row = await prisma.roundHole.update({
          where: { roundId_holeNumber: { roundId, holeNumber } },
          data: { isComplete: false },
          include: { approaches: true },
        });
        await recomputeCompletedCount(roundId);
      }
    }

    return toPlayHole(row);
  },

  /** Marks a hole complete/incomplete and re-derives the round's completed count. */
  async setHoleComplete(
    userId: string,
    roundId: string,
    holeNumber: number,
    isComplete: boolean,
  ): Promise<{ completedHoleCount: number }> {
    await assertEditable(userId, roundId);
    await prisma.roundHole.update({
      where: { roundId_holeNumber: { roundId, holeNumber } },
      data: { isComplete, version: { increment: 1 } },
    });
    return { completedHoleCount: await recomputeCompletedCount(roundId) };
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

/**
 * Replace a hole's approach attempts wholesale. Full-state, to match the offline
 * sync model — the client always sends the hole's complete approach list.
 * Unrecognised bands/results are dropped; missing miss directions become null.
 */
const replaceApproaches = async (
  roundHoleId: string,
  approaches: PlayApproach[],
): Promise<void> => {
  await prisma.roundHoleApproach.deleteMany({ where: { roundHoleId } });
  if (approaches.length === 0) return;
  await prisma.roundHoleApproach.createMany({
    data: approaches.map((approach, index) => ({
      roundHoleId,
      sequence: index + 1,
      distanceBand: approach.distanceBand,
      result: approach.result,
      missDirection:
        approach.result === "missed-zone" ? approach.missDirection : null,
    })),
  });
};

/** Re-derive and store `rounds.completed_hole_count` from the hole rows. */
const recomputeCompletedCount = async (roundId: string): Promise<number> => {
  const completedHoleCount = await prisma.roundHole.count({
    where: { roundId, isComplete: true },
  });
  await prisma.round.update({
    where: { id: roundId },
    data: { completedHoleCount },
  });
  return completedHoleCount;
};

export type RoundRepository = typeof roundRepository;
