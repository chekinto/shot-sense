import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { courseRepository } from "@/infrastructure/prisma/repositories/courseRepository";
import {
  roundRepository,
  type CoarseRoundEdit,
  type CompletedRoundListItem,
} from "@/infrastructure/prisma/repositories/roundRepository";
import type { ActiveRound, PlayableRound } from "./types";

/** Completed rounds for the history page, newest first. */
export const getRoundHistory = async (): Promise<CompletedRoundListItem[]> => {
  const user = await requireUser();
  return roundRepository.listCompleted(user.id);
};

/** A coarse round's editable shape; 404s for a full round or someone else's. */
export const getCoarseRoundForEdit = async (
  roundId: string,
): Promise<CoarseRoundEdit> => {
  const user = await requireUser();
  const round = await roundRepository.findCoarseForEdit(user.id, roundId);
  if (!round) notFound();
  return round;
};

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
