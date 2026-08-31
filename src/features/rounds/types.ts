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

import type {
  ApproachDistanceBand,
  ApproachResult,
  FirstPuttDistanceBand,
  MissDirection,
  TeeLie,
  TeeOutcome,
} from "@/domain/scoring";

/** One approach attempt as the play screen holds it (miss direction optional). */
export interface PlayApproach {
  sequence: number;
  distanceBand: ApproachDistanceBand;
  result: ApproachResult;
  missDirection: MissDirection | null;
}

/** One hole on the play screen: par/yardage snapshot + whatever's been recorded. */
export interface PlayHole {
  holeNumber: number;
  par: number;
  yardage: number | null;
  isComplete: boolean;
  version: number;
  score: number | null;
  shotsToZone: number | null;
  putts: number | null;
  firstPuttDistance: FirstPuttDistanceBand | null;
  teeOutcome: TeeOutcome | null;
  teeLie: TeeLie | null;
  approaches: PlayApproach[];
  penaltyStrokes: number;
}

/** The mutable per-hole fields the play screen writes. */
export interface HolePatch {
  score?: number | null;
  shotsToZone?: number | null;
  putts?: number | null;
  firstPuttDistance?: FirstPuttDistanceBand | null;
  teeOutcome?: TeeOutcome | null;
  teeLie?: TeeLie | null;
  /** Full replacement of the hole's approach list. */
  approaches?: PlayApproach[];
  penaltyStrokes?: number;
}

/** The full set of scoring values captured when a hole is marked complete. */
export interface CompleteHoleValues {
  score: number | null;
  shotsToZone: number | null;
  putts: number | null;
  firstPuttDistance: FirstPuttDistanceBand | null;
  teeOutcome: TeeOutcome | null;
  teeLie: TeeLie | null;
  approaches: PlayApproach[];
  penaltyStrokes: number;
}

/** Everything the play screen needs about a round. */
export interface PlayableRound {
  id: string;
  courseName: string;
  teeName: string | null;
  plannedHoleCount: number;
  completedHoleCount: number;
  scoringZoneYards: number;
  handicapAtStart: number | null;
  status: RoundStatus;
  holes: PlayHole[];
}
