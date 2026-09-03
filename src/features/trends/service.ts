import "server-only";
import {
  calculateGameTrend,
  GAME_TREND_WINDOW,
  type GameTrend,
} from "@/domain/scoring";
import { requireUser } from "@/features/auth/session";
import { roundRepository } from "@/infrastructure/prisma/repositories/roundRepository";
import { toScoringRound } from "@/infrastructure/prisma/mappers/scoringRoundMapper";

const sameMajor = (a: string, b: string): boolean =>
  a.split(".")[0] === b.split(".")[0];

export interface GameTrendView {
  trend: GameTrend | null;
  /** Aligned with `trend.roundIds`, oldest-first — ISO date strings. */
  roundDates: string[];
  completedRoundCount: number;
}

export const getGameTrend = async (): Promise<GameTrendView> => {
  const user = await requireUser();
  const [rows, completedRoundCount] = await Promise.all([
    roundRepository.recentCompletedRows(user.id, null, GAME_TREND_WINDOW),
    roundRepository.countCompleted(user.id),
  ]);

  // Newest-first from the repo; the trend engine wants oldest-first.
  const major = rows[0]?.methodologyVersion ?? "1.0.0";
  const scoped = [...rows]
    .reverse()
    .filter((r) => sameMajor(r.methodologyVersion, major));

  return {
    trend: calculateGameTrend(scoped.map(toScoringRound)),
    roundDates: scoped.map((r) => r.playedOn.toISOString().slice(0, 10)),
    completedRoundCount,
  };
};
