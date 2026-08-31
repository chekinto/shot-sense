import "server-only";
import { z } from "zod";
import {
  APPROACH_DISTANCE_BANDS,
  APPROACH_RESULTS,
  FIRST_PUTT_DISTANCE_BANDS,
  MISS_DIRECTIONS,
  MISTAKE_CATEGORIES,
  TEE_LIES,
  TEE_OUTCOMES,
  toApproachAttempt,
  validateCompletedHole,
  type ApproachAttempt,
} from "@/domain/scoring";
import {
  roundRepository,
  RoundNotEditableError,
} from "@/infrastructure/prisma/repositories/roundRepository";

const approachSchema = z.object({
  sequence: z.number().int().min(1),
  distanceBand: z.enum(APPROACH_DISTANCE_BANDS),
  result: z.enum(APPROACH_RESULTS),
  missDirection: z.enum(MISS_DIRECTIONS).nullable(),
});

type IncomingApproach = z.infer<typeof approachSchema>;

/** Shape the approach list for the domain validator (drops direction-less misses). */
const toDomainAttempts = (approaches: IncomingApproach[]): ApproachAttempt[] =>
  approaches.flatMap((approach, index) => {
    const attempt = toApproachAttempt({ ...approach, sequence: index + 1 });
    return attempt ? [attempt] : [];
  });

const holeStateSchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  score: z.number().int().nullable(),
  shotsToZone: z.number().int().nullable(),
  putts: z.number().int().nullable(),
  firstPuttDistance: z.enum(FIRST_PUTT_DISTANCE_BANDS).nullable(),
  teeOutcome: z.enum(TEE_OUTCOMES).nullable(),
  teeLie: z.enum(TEE_LIES).nullable(),
  approaches: z.array(approachSchema).max(10),
  bunkerShots: z.number().int().min(0),
  bunkersVisited: z.number().int().min(0),
  mistakes: z.array(z.enum(MISTAKE_CATEGORIES)).max(20),
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
      const approaches = op.approaches.map((a) => ({
        sequence: a.sequence,
        distanceBand: a.distanceBand,
        result: a.result,
        missDirection: a.missDirection,
      }));

      if (op.isComplete) {
        const check = validateCompletedHole({
          holeNumber: op.holeNumber,
          par: op.par,
          score: op.score ?? undefined,
          shotsToZone: op.shotsToZone ?? undefined,
          putts: op.putts ?? undefined,
          firstPuttDistance: op.firstPuttDistance ?? undefined,
          penaltyStrokes: op.penaltyStrokes,
          bunkerShots: op.bunkerShots,
          bunkersVisited: op.bunkersVisited,
          approachAttempts: toDomainAttempts(approaches),
        });
        if (!check.ok) return { ok: false, reason: "invalid" };
      }

      await roundRepository.saveHolePatch(userId, roundId, op.holeNumber, {
        score: op.score,
        shotsToZone: op.shotsToZone,
        putts: op.putts,
        firstPuttDistance: op.firstPuttDistance,
        teeOutcome: op.teeOutcome,
        teeLie: op.teeLie,
        approaches,
        bunkerShots: op.bunkerShots,
        bunkersVisited: op.bunkersVisited,
        mistakes: op.mistakes,
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
