import Dexie, { type EntityTable } from "dexie";
import type { PlayHole } from "@/features/rounds/types";

/** A round mirrored to this device so it survives going offline (§21, §22). */
export interface StoredActiveRound {
  id: string;
  courseName: string;
  teeName: string | null;
  plannedHoleCount: number;
  completedHoleCount: number;
  scoringZoneYards: number;
  handicapAtStart: number | null;
  status: string;
  holes: PlayHole[];
  /** Epoch ms of the last local edit. */
  updatedAt: number;
}

/**
 * One pending upload per (round, hole): the hole's full current local state.
 * Full-state (not deltas) so coalescing is a plain upsert and applying it is
 * idempotent — local is authoritative while the round is played (§23).
 */
export interface HoleSyncOp {
  seq?: number;
  roundId: string;
  holeNumber: number;
  par: number;
  score: number | null;
  shotsToZone: number | null;
  putts: number | null;
  firstPuttDistance: PlayHole["firstPuttDistance"];
  penaltyStrokes: number;
  isComplete: boolean;
  updatedAt: number;
  attempts: number;
  lastError?: string;
}

class ShotSenseDB extends Dexie {
  activeRounds!: EntityTable<StoredActiveRound, "id">;
  syncQueue!: EntityTable<HoleSyncOp, "seq">;

  constructor() {
    super("shot-sense");
    this.version(1).stores({
      activeRounds: "id, updatedAt",
      syncQueue: "++seq, roundId, &[roundId+holeNumber], updatedAt",
    });
  }
}

let instance: ShotSenseDB | undefined;

/** Lazily created so importing this module never touches IndexedDB during SSR. */
export const db = (): ShotSenseDB => {
  if (!instance) instance = new ShotSenseDB();
  return instance;
};

/** Test-only: delete the database and drop the cached Dexie instance. */
export const __resetDbForTests = async (): Promise<void> => {
  if (instance) {
    await instance.delete().catch(() => {});
    instance = undefined;
  }
};

export const offlineSupported = (): boolean =>
  typeof window !== "undefined" && "indexedDB" in window;
