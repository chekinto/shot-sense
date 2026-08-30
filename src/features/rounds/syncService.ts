import "server-only";
import { z } from "zod";
import { FIRST_PUTT_DISTANCE_BANDS, validateCompletedHole } from "@/domain/scoring";
import {
  roundRepository,
  RoundNotEditableError,
} from "@/infrastructure/prisma/repositories/roundRepository";

const holeStateSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  score: z.number().int().nullable(),
  shotsToZone: z.number().int().nullable(),
  putts: z.number().int().nullable(),
  firstPuttDistance: z.enum(FIRST_PUTT_DISTANCE_BANDS).nullable(),
  penaltyStrokes: z.number().int().min(0),
  isComplete: z.boolean(),
});

export const syncOperationsSchema = z.object({
  operations: z.array(holeStateSchema).max(100),
});

export type SyncOperationsInput = z.infer<typeof syncOperationsSchema>;

export type SyncResult =
  | { ok: true; completedHoleCount: number }
  | { ok: false; reason: "locked" | "invalid" };

/**
 * Applies a batch of offline hole states to a round. Each op is the hole's full
 * local state; local is authoritative while the round is played (§23), so there
 * is no version check. A completed/abandoned round rejects the whole batch as
 * `locked`.
 */
export const applySyncOperations = async (
  userId: string,
  roundId: string,
  input: SyncOperationsInput,
): Promise<SyncResult> => {
  try {
    for (const op of input.operations) {
      if (op.isComplete) {
        const check = validateCompletedHole({
          holeNumber: op.holeNumber,
          par: op.par,
          score: op.score ?? undefined,
          shotsToZone: op.shotsToZone ?? undefined,
          putts: op.putts ?? undefined,
          firstPuttDistance: op.firstPuttDistance ?? undefined,
          penaltyStrokes: op.penaltyStrokes,
        });
        if (!check.ok) return { ok: false, reason: "invalid" };
      }

      await roundRepository.saveHolePatch(userId, roundId, op.holeNumber, {
        score: op.score,
        shotsToZone: op.shotsToZone,
        putts: op.putts,
        firstPuttDistance: op.firstPuttDistance,
        penaltyStrokes: op.penaltyStrokes,
      });
      await roundRepository.setHoleComplete(
        userId,
        roundId,
        op.holeNumber,
        op.isComplete,
      );
    }
  } catch (error) {
    if (error instanceof RoundNotEditableError) {
      return { ok: false, reason: "locked" };
    }
    throw error;
  }

  const round = await roundRepository.findByIdForUser(userId, roundId);
  return { ok: true, completedHoleCount: round?.completedHoleCount ?? 0 };
};
