import { activeRoundStore } from "./activeRoundStore";
import { db } from "./db";
import type { PlayableRound, PlayHole } from "@/features/rounds/types";

const hole = (holeNumber: number, overrides: Partial<PlayHole> = {}): PlayHole => ({
  holeNumber,
  par: 4,
  yardage: null,
  isComplete: false,
  version: 1,
  score: null,
  shotsToZone: null,
  putts: null,
  firstPuttDistance: null,
  penaltyStrokes: 0,
  ...overrides,
});

const round = (overrides: Partial<PlayableRound> = {}): PlayableRound => ({
  id: "r1",
  courseName: "East Herts",
  teeName: "White",
  plannedHoleCount: 2,
  completedHoleCount: 0,
  scoringZoneYards: 100,
  handicapAtStart: 14,
  status: "in-progress",
  holes: [hole(1), hole(2)],
  ...overrides,
});

describe("activeRoundStore", () => {
  afterEach(() => jest.restoreAllMocks());

  it("hydrates once and keeps local edits on subsequent hydrate calls", async () => {
    await activeRoundStore.hydrate(round());
    await activeRoundStore.patchHole("r1", 1, { score: 5 });

    const rehydrated = await activeRoundStore.hydrate(round());
    expect(rehydrated.holes.find((h) => h.holeNumber === 1)?.score).toBe(5);
  });

  it("writes edits to IndexedDB and queues one coalesced op per hole", async () => {
    await activeRoundStore.hydrate(round());
    await activeRoundStore.patchHole("r1", 1, { score: 5 });
    await activeRoundStore.patchHole("r1", 1, { shotsToZone: 2 });
    await activeRoundStore.patchHole("r1", 2, { score: 4 });

    const stored = await activeRoundStore.get("r1");
    expect(stored?.holes.find((h) => h.holeNumber === 1)).toMatchObject({
      score: 5,
      shotsToZone: 2,
    });

    const ops = await db().syncQueue.where("roundId").equals("r1").toArray();
    expect(ops).toHaveLength(2); // one per hole
    expect(ops.find((o) => o.holeNumber === 1)).toMatchObject({ score: 5, shotsToZone: 2 });
  });

  it("marks a hole complete and tracks the completed count", async () => {
    await activeRoundStore.hydrate(round());
    await activeRoundStore.patchHole("r1", 1, { score: 4, shotsToZone: 2, putts: 2, firstPuttDistance: "5-15ft" });
    const { completedHoleCount } = await activeRoundStore.completeHole("r1", 1);

    expect(completedHoleCount).toBe(1);
    const stored = await activeRoundStore.get("r1");
    expect(stored?.holes.find((h) => h.holeNumber === 1)?.isComplete).toBe(true);
    expect(stored?.completedHoleCount).toBe(1);
  });

  it("downgrades a completed hole whose edit makes it invalid (mirrors the server)", async () => {
    await activeRoundStore.hydrate(round());
    await activeRoundStore.patchHole("r1", 1, { score: 4, shotsToZone: 2, putts: 2, firstPuttDistance: "5-15ft" });
    await activeRoundStore.completeHole("r1", 1);

    // Now make putts exceed shots-from-zone.
    await activeRoundStore.patchHole("r1", 1, { score: 3, shotsToZone: 3 });

    const stored = await activeRoundStore.get("r1");
    expect(stored?.holes.find((h) => h.holeNumber === 1)?.isComplete).toBe(false);
    expect(stored?.completedHoleCount).toBe(0);
  });

  it("lists resumable rounds newest first and forgets a round with its queue", async () => {
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => (now += 10));

    await activeRoundStore.hydrate(round({ id: "a" }));
    await activeRoundStore.hydrate(round({ id: "b" }));
    await activeRoundStore.patchHole("b", 1, { score: 5 });

    const resumable = await activeRoundStore.listResumable();
    expect(resumable[0]?.id).toBe("b");

    await activeRoundStore.forget("b");
    expect(await activeRoundStore.get("b")).toBeNull();
    expect(await activeRoundStore.pendingCount("b")).toBe(0);
  });
});
