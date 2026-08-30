import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { courseRepository } from "@/infrastructure/prisma/repositories/courseRepository";
import { roundRepository } from "@/infrastructure/prisma/repositories/roundRepository";
import type { ActiveRound, PlayableRound } from "./types";

/** The user's resumable round, if any. Memoised per request. */
export const getActiveRound = cache(async (): Promise<ActiveRound | null> => {
  const user = await requireUser();
  return roundRepository.findActive(user.id);
});

export const getPlayableRound = async (
  roundId: string,
): Promise<PlayableRound> => {
  const user = await requireUser();
  const round = await roundRepository.findByIdForUser(user.id, roundId);
  if (!round) notFound();
  return round;
};

export interface StartRoundCourse {
  id: string;
  name: string;
  holeCount: number;
  teeSets: { id: string; name: string }[];
}

export const getStartRoundOptions = async (): Promise<StartRoundCourse[]> => {
  const user = await requireUser();
  return courseRepository.listForRoundStart(user.id);
};
