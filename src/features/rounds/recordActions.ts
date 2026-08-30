"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { validateCompletedHole } from "@/domain/scoring";
import {
  roundRepository,
  RoundNotEditableError,
  StaleHoleError,
} from "@/infrastructure/prisma/repositories/roundRepository";
import type { HolePatch, PlayHole } from "./types";

export type SaveHoleResult =
  | { ok: true; hole: PlayHole }
  | { ok: false; reason: "stale" | "locked" };

/**
 * Autosave a partial hole edit (§22). Called imperatively from the play screen
 * after a debounce. In the offline slice this call is replaced by a Dexie write
 * + sync-queue entry; the play screen's contract stays the same.
 */
export const saveHole = async (input: {
  roundId: string;
  holeNumber: number;
  patch: HolePatch;
  /** Optional stale-write guard; unused for online single-device play. */
  version?: number;
}): Promise<SaveHoleResult> => {
  const user = await requireUser();
  try {
    const hole = await roundRepository.saveHolePatch(
      user.id,
      input.roundId,
      input.holeNumber,
      input.patch,
      input.version,
    );
    return { ok: true, hole };
  } catch (error) {
    if (error instanceof StaleHoleError) return { ok: false, reason: "stale" };
    if (error instanceof RoundNotEditableError)
      return { ok: false, reason: "locked" };
    throw error;
  }
};

export type CompleteHoleResult =
  | { ok: true; completedHoleCount: number }
  | { ok: false; errors: { field: string; message: string }[] };

/**
 * Marks a hole complete (§24). Re-validates the required scoring fields
 * server-side (the play screen validates first for instant feedback).
 */
export const completeHole = async (input: {
  roundId: string;
  holeNumber: number;
  par: number;
  score: number | null;
  shotsToZone: number | null;
  putts: number | null;
  firstPuttDistance: PlayHole["firstPuttDistance"];
  penaltyStrokes: number;
}): Promise<CompleteHoleResult> => {
  const user = await requireUser();

  const validation = validateCompletedHole({
    holeNumber: input.holeNumber,
    par: input.par,
    score: input.score ?? undefined,
    shotsToZone: input.shotsToZone ?? undefined,
    putts: input.putts ?? undefined,
    firstPuttDistance: input.firstPuttDistance ?? undefined,
    penaltyStrokes: input.penaltyStrokes,
  });
  if (!validation.ok) {
    return { ok: false, errors: validation.errors };
  }

  await roundRepository.saveHolePatch(user.id, input.roundId, input.holeNumber, {
    score: input.score,
    shotsToZone: input.shotsToZone,
    putts: input.putts,
    firstPuttDistance: input.firstPuttDistance,
    penaltyStrokes: input.penaltyStrokes,
  });
  const { completedHoleCount } = await roundRepository.setHoleComplete(
    user.id,
    input.roundId,
    input.holeNumber,
    true,
  );

  revalidatePath(`/rounds/${input.roundId}/play`);
  revalidatePath("/dashboard");
  return { ok: true, completedHoleCount };
};

export type FinishRoundResult = { ok: false; incompleteHoles: number[] };

/**
 * Finish the round. With `holeCount` omitted every planned hole must be
 * complete; with `holeCount` set the golfer is explicitly finishing early (§20).
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
