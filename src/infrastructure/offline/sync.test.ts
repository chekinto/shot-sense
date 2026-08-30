import { activeRoundStore } from "./activeRoundStore";
import { db } from "./db";
import { flushRound } from "./sync";
import type { PlayableRound } from "@/features/rounds/types";

const round: PlayableRound = {
  id: "r1",
  courseName: "East Herts",
  teeName: null,
  plannedHoleCount: 2,
  completedHoleCount: 0,
  scoringZoneYards: 100,
  handicapAtStart: null,
  status: "in-progress",
  holes: [
    { holeNumber: 1, par: 4, yardage: null, isComplete: false, version: 1, score: null, shotsToZone: null, putts: null, firstPuttDistance: null, penaltyStrokes: 0 },
    { holeNumber: 2, par: 4, yardage: null, isComplete: false, version: 1, score: null, shotsToZone: null, putts: null, firstPuttDistance: null, penaltyStrokes: 0 },
  ],
};

const mockFetch = (impl: () => Partial<Response>) => {
  global.fetch = jest.fn(async () => impl() as Response);
};

beforeEach(() => {
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});
afterEach(() => jest.restoreAllMocks());

describe("flushRound", () => {
  it("does nothing when there is no queue", async () => {
    global.fetch = jest.fn();
    expect(await flushRound("r1")).toBe("nothing");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns 'offline' without hitting the network when offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    await activeRoundStore.hydrate(round);
    await activeRoundStore.patchHole("r1", 1, { score: 5 });
    global.fetch = jest.fn();

    expect(await flushRound("r1")).toBe("offline");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("POSTs the queued ops and clears them on success", async () => {
    await activeRoundStore.hydrate(round);
    await activeRoundStore.patchHole("r1", 1, { score: 5 });
    await activeRoundStore.patchHole("r1", 2, { score: 4 });
    mockFetch(() => ({ ok: true, status: 200 }));

    expect(await flushRound("r1")).toBe("synced");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(init.body as string).operations).toHaveLength(2);
    expect(await activeRoundStore.pendingCount("r1")).toBe(0);
  });

  it("on 409 drops the queue and forgets the local round", async () => {
    await activeRoundStore.hydrate(round);
    await activeRoundStore.patchHole("r1", 1, { score: 5 });
    mockFetch(() => ({ ok: false, status: 409 }));

    expect(await flushRound("r1")).toBe("locked");
    expect(await activeRoundStore.pendingCount("r1")).toBe(0);
    expect(await activeRoundStore.get("r1")).toBeNull();
  });

  it("keeps ops on a server error but bumps their attempt count", async () => {
    await activeRoundStore.hydrate(round);
    await activeRoundStore.patchHole("r1", 1, { score: 5 });
    mockFetch(() => ({ ok: false, status: 500 }));

    expect(await flushRound("r1")).toBe("error");
    const op = await db().syncQueue.where("roundId").equals("r1").first();
    expect(op?.attempts).toBe(1);
  });

  it("gives up on an op after too many failed attempts", async () => {
    await activeRoundStore.hydrate(round);
    await activeRoundStore.patchHole("r1", 1, { score: 5 });
    await db().syncQueue.where("roundId").equals("r1").modify((op) => {
      op.attempts = 8;
    });
    mockFetch(() => ({ ok: true, status: 200 }));

    expect(await flushRound("r1")).toBe("nothing");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
