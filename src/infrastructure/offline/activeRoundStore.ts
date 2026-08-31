import { validateCompletedHole } from "@/domain/scoring";
import type { HolePatch, PlayHole, PlayableRound } from "@/features/rounds/types";
import {
  db,
  offlineSupported,
  type HoleSyncOp,
  type StoredActiveRound,
} from "./db";

const RESUMABLE = new Set(["in-progress", "paused"]);

const toStored = (round: PlayableRound): StoredActiveRound => ({
  id: round.id,
  courseName: round.courseName,
  teeName: round.teeName,
  plannedHoleCount: round.plannedHoleCount,
  completedHoleCount: round.completedHoleCount,
  scoringZoneYards: round.scoringZoneYards,
  handicapAtStart: round.handicapAtStart,
  status: round.status,
  holes: [...round.holes].sort((a, b) => a.holeNumber - b.holeNumber),
  updatedAt: Date.now(),
});

const holeValidates = (hole: PlayHole): boolean =>
  validateCompletedHole({
    holeNumber: hole.holeNumber,
    par: hole.par,
    score: hole.score ?? undefined,
    shotsToZone: hole.shotsToZone ?? undefined,
    putts: hole.putts ?? undefined,
    firstPuttDistance: hole.firstPuttDistance ?? undefined,
    penaltyStrokes: hole.penaltyStrokes,
    bunkerShots: hole.bunkerShots,
    bunkersVisited: hole.bunkersVisited,
  }).ok;

const upsertSyncOp = async (
  roundId: string,
  hole: PlayHole,
): Promise<void> => {
  const op: Omit<HoleSyncOp, "seq"> = {
    roundId,
    holeNumber: hole.holeNumber,
    par: hole.par,
    score: hole.score,
    shotsToZone: hole.shotsToZone,
    putts: hole.putts,
    firstPuttDistance: hole.firstPuttDistance,
    teeOutcome: hole.teeOutcome,
    teeLie: hole.teeLie,
    approaches: hole.approaches,
    bunkerShots: hole.bunkerShots,
    bunkersVisited: hole.bunkersVisited,
    mistakes: hole.mistakes,
    penaltyStrokes: hole.penaltyStrokes,
    isComplete: hole.isComplete,
    updatedAt: Date.now(),
    attempts: 0,
  };
  const existing = await db()
    .syncQueue.where("[roundId+holeNumber]")
    .equals([roundId, hole.holeNumber])
    .first();
  if (existing?.seq !== undefined) {
    await db().syncQueue.update(existing.seq, op);
  } else {
    await db().syncQueue.add(op);
  }
};

/**
 * The active round's local mirror. Every edit lands in IndexedDB immediately
 * (§22) and a coalesced full-state sync op is queued for the server (§23).
 * Reads prefer the local copy — it holds edits not yet synced.
 */
export const activeRoundStore = {
  supported: offlineSupported,

  /** Seed the local mirror from the server on first load; keep local edits after. */
  async hydrate(round: PlayableRound): Promise<StoredActiveRound> {
    if (!offlineSupported()) return toStored(round);
    const existing = await db().activeRounds.get(round.id);
    if (existing) return existing;
    const stored = toStored(round);
    await db().activeRounds.put(stored);
    return stored;
  },

  async get(roundId: string): Promise<StoredActiveRound | null> {
    if (!offlineSupported()) return null;
    return (await db().activeRounds.get(roundId)) ?? null;
  },

  async listResumable(): Promise<StoredActiveRound[]> {
    if (!offlineSupported()) return [];
    const all = await db().activeRounds.toArray();
    return all
      .filter((r) => RESUMABLE.has(r.status))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  /** Apply a partial edit, mirroring the server's "invalid → not complete" rule. */
  async patchHole(
    roundId: string,
    holeNumber: number,
    patch: HolePatch,
  ): Promise<PlayHole> {
    if (!offlineSupported()) {
      throw new Error("offline store unavailable");
    }
    return db().transaction("rw", db().activeRounds, db().syncQueue, async () => {
      const round = await db().activeRounds.get(roundId);
      if (!round) throw new Error(`Local round ${roundId} not found`);

      const holes = round.holes.map((h) => {
        if (h.holeNumber !== holeNumber) return h;
        const merged: PlayHole = { ...h, ...patch, version: h.version + 1 };
        if (merged.isComplete && !holeValidates(merged)) merged.isComplete = false;
        return merged;
      });
      const updated = holes.find((h) => h.holeNumber === holeNumber)!;

      await db().activeRounds.update(roundId, {
        holes,
        completedHoleCount: holes.filter((h) => h.isComplete).length,
        updatedAt: Date.now(),
      });
      await upsertSyncOp(roundId, updated);
      return updated;
    });
  },

  /** Mark a hole complete locally (the caller has already validated it). */
  async completeHole(
    roundId: string,
    holeNumber: number,
  ): Promise<{ completedHoleCount: number; hole: PlayHole }> {
    if (!offlineSupported()) {
      throw new Error("offline store unavailable");
    }
    return db().transaction("rw", db().activeRounds, db().syncQueue, async () => {
      const round = await db().activeRounds.get(roundId);
      if (!round) throw new Error(`Local round ${roundId} not found`);

      const holes = round.holes.map((h) =>
        h.holeNumber === holeNumber
          ? { ...h, isComplete: true, version: h.version + 1 }
          : h,
      );
      const updated = holes.find((h) => h.holeNumber === holeNumber)!;
      const completedHoleCount = holes.filter((h) => h.isComplete).length;

      await db().activeRounds.update(roundId, {
        holes,
        completedHoleCount,
        updatedAt: Date.now(),
      });
      await upsertSyncOp(roundId, updated);
      return { completedHoleCount, hole: updated };
    });
  },

  async pendingCount(roundId: string): Promise<number> {
    if (!offlineSupported()) return 0;
    return db().syncQueue.where("roundId").equals(roundId).count();
  },

  /** Drop the local mirror once the round is finished and fully synced. */
  async forget(roundId: string): Promise<void> {
    if (!offlineSupported()) return;
    await db().transaction("rw", db().activeRounds, db().syncQueue, async () => {
      await db().activeRounds.delete(roundId);
      await db().syncQueue.where("roundId").equals(roundId).delete();
    });
  },
};
