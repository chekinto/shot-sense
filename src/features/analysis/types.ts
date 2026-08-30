import type { RoundAnalysis } from "@/domain/scoring";
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
  };
  analysis: RoundAnalysis;
  /** Benchmark counts from the user's previous completed round, if any. */
  comparison: {
    enteredInRegulation: { count: number; of: number };
    downInThree: { count: number; of: number };
  } | null;
  /** Completed rounds the user has, for the "Your game unlocks at ~5" copy. */
  completedRoundCount: number;
}
