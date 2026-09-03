import "server-only";
import { notFound } from "next/navigation";
import {
  analyseRound,
  calculatePersonalBaseline,
  calculateRecommendations,
  BASELINE_WINDOW,
  RECOMMENDATION_FIRM_ROUNDS,
} from "@/domain/scoring";
import { requireUser } from "@/features/auth/session";
import { roundRepository } from "@/infrastructure/prisma/repositories/roundRepository";
import { toDomainRoundStatus } from "@/infrastructure/prisma/mappers/roundMapper";
import { toScoringRound } from "@/infrastructure/prisma/mappers/scoringRoundMapper";
import type { PostRoundView } from "./types";

/** Same methodology major version — trends only compare like with like (#6). */
const sameMajor = (a: string, b: string): boolean =>
  a.split(".")[0] === b.split(".")[0];

export const getPostRoundAnalysis = async (
  roundId: string,
): Promise<PostRoundView> => {
  const user = await requireUser();

  const row = await roundRepository.findCompletedRow(user.id, roundId);
  if (!row) notFound();

  const scoringRound = toScoringRound(row);
  const analysis = analyseRound(scoringRound);

  const priorRows = await roundRepository.recentCompletedRows(
    user.id,
    row.completedAt,
    BASELINE_WINDOW,
  );
  const history = priorRows
    .map(toScoringRound)
    .filter((r) => sameMajor(r.methodologyVersion, scoringRound.methodologyVersion));
  const baseline = calculatePersonalBaseline(history);

  // Recommendations look at the recent window *including* this round.
  const recommendations = calculateRecommendations(
    [scoringRound, ...history].slice(0, RECOMMENDATION_FIRM_ROUNDS),
  );

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
      dataCompleteness: scoringRound.dataCompleteness ?? "full",
    },
    analysis,
    baseline,
    recommendations,
    completedRoundCount,
  };
};
