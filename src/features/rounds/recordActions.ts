"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import {
  roundRepository,
  RoundNotEditableError,
} from "@/infrastructure/prisma/repositories/roundRepository";

export type FinishRoundResult = { ok: false; incompleteHoles: number[] };

/**
 * Finish the round. With `holeCount` omitted every planned hole must be
 * complete; with `holeCount` set the golfer is explicitly finishing early (§20).
 *
 * Hole edits reach the server through the offline sync queue
 * (`/api/rounds/[roundId]/sync`). The Finish button stays disabled until that
 * queue is empty, so by the time this runs the server round is up to date.
 */
export const finishRound = async (input: {
  roundId: string;
  holeCount?: number;
}): Promise<FinishRoundResult> => {
  const user = await requireUser();
  const round = await roundRepository.findByIdForUser(user.id, input.roundId);
  if (!round) throw new RoundNotEditableError();

  const target = input.holeCount ?? round.plannedHoleCount;
  const relevant = round.holes
    .filter((h) => h.holeNumber <= target)
    .slice(0, target);
  const incompleteHoles = relevant
    .filter((h) => !h.isComplete)
    .map((h) => h.holeNumber);

  if (incompleteHoles.length > 0) {
    return { ok: false, incompleteHoles };
  }

  await roundRepository.complete(user.id, input.roundId, relevant.length);
  revalidatePath("/dashboard");
  redirect(`/rounds/${input.roundId}/summary`);
};
