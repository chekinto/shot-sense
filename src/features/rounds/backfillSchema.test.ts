import { backfillRoundSchema } from "./backfillSchema";

const hole = (holeNumber: number, over: Record<string, number> = {}) => ({
  holeNumber,
  par: 4,
  score: 4,
  shotsToZone: 2,
  putts: 2,
  penaltyStrokes: 0,
  ...over,
});

const base = {
  courseName: "Old Links",
  playedOn: "2025-06-01",
  handicapAtStart: 12,
  holes: Array.from({ length: 9 }, (_, i) => hole(i + 1)),
};

describe("backfillRoundSchema", () => {
  it("accepts a well-formed 9-hole round", () => {
    expect(backfillRoundSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a future date", () => {
    const result = backfillRoundSchema.safeParse({ ...base, playedOn: "2999-01-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a hole count that is neither 9 nor 18", () => {
    const result = backfillRoundSchema.safeParse({
      ...base,
      holes: Array.from({ length: 12 }, (_, i) => hole(i + 1)),
    });
    expect(result.success).toBe(false);
  });

  it("rejects shots-to-zone greater than the score", () => {
    const result = backfillRoundSchema.safeParse({
      ...base,
      holes: [hole(1, { score: 3, shotsToZone: 5 }), ...base.holes.slice(1)],
    });
    expect(result.success).toBe(false);
  });

  it("rejects putts that exceed the shots from the zone", () => {
    const result = backfillRoundSchema.safeParse({
      ...base,
      holes: [hole(1, { score: 4, shotsToZone: 3, putts: 3 }), ...base.holes.slice(1)],
    });
    expect(result.success).toBe(false);
  });
});
