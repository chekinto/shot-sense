import "server-only";
import { notFound } from "next/navigation";
import { analyseRound, calculateBenchmarkScorecard } from "@/domain/scoring";
import { requireUser } from "@/features/auth/session";
import { roundRepository } from "@/infrastructure/prisma/repositories/roundRepository";
import { toDomainRoundStatus } from "@/infrastructure/prisma/mappers/roundMapper";
import { toScoringRound } from "@/infrastructure/prisma/mappers/scoringRoundMapper";
import type { PostRoundView } from "./types";

export const getPostRoundAnalysis = async (
  roundId: string,
): Promise<PostRoundView> => {
  const user = await requireUser();

  const row = await roundRepository.findCompletedRow(user.id, roundId);
  if (!row) notFound();

  const scoringRound = toScoringRound(row);
  const analysis = analyseRound(scoringRound);

  const previous = await roundRepository.findPreviousCompletedRow(
    user.id,
    row.completedAt,
  );
  const comparison = previous
    ? (() => {
        const card = calculateBenchmarkScorecard(toScoringRound(previous));
        return {
          enteredInRegulation: card.enteredInRegulation,
          downInThree: card.downInThree,
        };
      })()
    : null;

  const completedRoundCount = await roundRepository.countCompleted(user.id);

  return {
    round: {
      id: row.id,
      courseName: row.snapshot?.courseName ?? "Round",
      teeName: row.snapshot?.teeName ?? null,
      playedOn: row.playedOn,
      plannedHoleCount: row.plannedHoleCount,
      holesPlayed: scoringRound.holes.length,
      handicapAtStart: row.handicapAtStart?.toNumber() ?? null,
      status: toDomainRoundStatus(row.status),
    },
    analysis,
    comparison,
    completedRoundCount,
  };
};
