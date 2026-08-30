import { db, offlineSupported, type HoleSyncOp } from "./db";

export type FlushOutcome = "synced" | "nothing" | "offline" | "locked" | "error";

/** Give up on an op the server keeps rejecting rather than retry forever. */
const MAX_ATTEMPTS = 8;

const opToBody = (op: HoleSyncOp) => ({
  holeNumber: op.holeNumber,
  par: op.par,
  score: op.score,
  shotsToZone: op.shotsToZone,
  putts: op.putts,
  firstPuttDistance: op.firstPuttDistance,
  penaltyStrokes: op.penaltyStrokes,
  isComplete: op.isComplete,
});

/**
 * Serialise flushes per round: two concurrent POSTs to the same round's sync
 * endpoint contend on the single pooled DB connection and can stall. Each call
 * waits for the previous flush, then re-reads the (possibly now-empty) queue.
 */
const inFlight = new Map<string, Promise<FlushOutcome>>();

export const flushRound = (roundId: string): Promise<FlushOutcome> => {
  const prev = inFlight.get(roundId) ?? Promise.resolve<FlushOutcome>("nothing");
  const run = prev
    .catch(() => undefined)
    .then(() => doFlushRound(roundId))
    .finally(() => {
      if (inFlight.get(roundId) === run) inFlight.delete(roundId);
    });
  inFlight.set(roundId, run);
  return run;
};

const doFlushRound = async (roundId: string): Promise<FlushOutcome> => {
  if (!offlineSupported()) return "nothing";
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";

  const ops = (
    await db().syncQueue.where("roundId").equals(roundId).sortBy("seq")
  ).filter((op) => op.attempts < MAX_ATTEMPTS);
  if (ops.length === 0) return "nothing";

  let response: Response;
  try {
    response = await fetch(`/api/rounds/${roundId}/sync`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operations: ops.map(opToBody) }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // Network down, or the request stalled — retry on the next flush.
    return "offline";
  }

  if (response.status === 409) {
    // The round is finished/abandoned server-side — stop mirroring it entirely.
    await db().transaction("rw", db().activeRounds, db().syncQueue, async () => {
      await db().syncQueue.where("roundId").equals(roundId).delete();
      await db().activeRounds.delete(roundId);
    });
    return "locked";
  }
  if (!response.ok) {
    const seqs = ops.map((o) => o.seq).filter((s): s is number => s !== undefined);
    await db().syncQueue.where("seq").anyOf(seqs).modify((op) => {
      op.attempts += 1;
      op.lastError = String(response.status);
    });
    return "error";
  }

  // Only delete ops that haven't been re-touched since we read them.
  const readAt = ops.reduce((max, o) => Math.max(max, o.updatedAt), 0);
  await db()
    .syncQueue.where("roundId")
    .equals(roundId)
    .and((op) => op.updatedAt <= readAt)
    .delete();

  return "synced";
};

/** Push queued edits for every locally mirrored round. */
export const flushAll = async (): Promise<void> => {
  if (!offlineSupported()) return;
  const roundIds = [...new Set((await db().syncQueue.toArray()).map((o) => o.roundId))];
  for (const id of roundIds) await flushRound(id);
};

/**
 * Wire up background sync: flush now, again whenever the network returns, and on
 * a slow interval as a backstop. Returns a cleanup function.
 */
export const startBackgroundSync = (intervalMs = 15_000): (() => void) => {
  if (!offlineSupported()) return () => {};

  void flushAll();
  const onOnline = () => void flushAll();
  window.addEventListener("online", onOnline);
  const timer = window.setInterval(() => {
    if (navigator.onLine) void flushAll();
  }, intervalMs);

  return () => {
    window.removeEventListener("online", onOnline);
    window.clearInterval(timer);
  };
};
