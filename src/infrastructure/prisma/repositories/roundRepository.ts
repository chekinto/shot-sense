import "server-only";
import { prisma } from "../client";
import { toActiveRound, toPlayableRound } from "../mappers/roundMapper";
import { METHODOLOGY_VERSION, SCORING_ZONE_YARDS } from "@/domain/scoring";
import type { ActiveRound, PlayableRound } from "@/features/rounds/types";

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
};

export type RoundRepository = typeof roundRepository;
