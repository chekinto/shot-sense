/** Domain round status (framework-independent; mapped from the Prisma enum). */
export const ROUND_STATUSES = [
  "draft",
  "in-progress",
  "paused",
  "completed",
  "abandoned",
] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const isResumable = (status: RoundStatus): boolean =>
  status === "in-progress" || status === "paused";

/** Dashboard "resume" card data (§112). */
export interface ActiveRound {
  id: string;
  courseName: string;
  teeName: string | null;
  plannedHoleCount: number;
  completedHoleCount: number;
  /** First not-yet-complete hole, or `plannedHoleCount` when all are done. */
  resumeHoleNumber: number;
  playedOn: Date;
  status: RoundStatus;
}

export interface RoundHoleSnapshot {
  holeNumber: number;
  par: number;
  yardage: number | null;
  isComplete: boolean;
}

/** Everything the play screen needs about a round (Epic 5 will add recording). */
export interface PlayableRound {
  id: string;
  courseName: string;
  teeName: string | null;
  plannedHoleCount: number;
  scoringZoneYards: number;
  handicapAtStart: number | null;
  status: RoundStatus;
  holes: RoundHoleSnapshot[];
}
