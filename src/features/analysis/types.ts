import type { PersonalBaseline, RoundAnalysis } from "@/domain/scoring";
import type { RoundStatus } from "@/features/rounds/types";

/** Everything the post-round screen renders. */
export interface PostRoundView {
  round: {
    id: string;
    courseName: string;
    teeName: string | null;
    playedOn: Date;
    plannedHoleCount: number;
    holesPlayed: number;
    handicapAtStart: number | null;
    status: RoundStatus;
    dataCompleteness: "full" | "coarse";
  };
  analysis: RoundAnalysis;
  /** The golfer's recent form (last few rounds), or null below 3 rounds (#10). */
  baseline: PersonalBaseline | null;
  /** Completed rounds the user has, for the "Your game unlocks at ~5" copy. */
  completedRoundCount: number;
}
