import type { Profile as PrismaProfile } from "@prisma/client";
import type { Profile } from "@/features/profile/types";

/** Prisma row -> application profile. Decimal handicap becomes a plain number. */
export const toProfile = (row: PrismaProfile): Profile => ({
  userId: row.userId,
  handicap: row.handicap === null ? null : row.handicap.toNumber(),
  defaultScoringZoneYards: row.defaultScoringZoneYards,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
