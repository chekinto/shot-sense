import type { RawHoleInput } from "../models/hole";
import { assertCompletedHole, validateCompletedHole } from "./completedHole";

const valid: RawHoleInput = {
  holeNumber: 1,
  par: 4,
  score: 4,
  shotsToZone: 2,
  putts: 2,
  firstPuttDistance: "15-30ft",
  penaltyStrokes: 0,
  bunkerShots: 0,
  bunkersVisited: 0,
};

const errorFields = (input: RawHoleInput): string[] => {
  const result = validateCompletedHole(input);
  return result.ok ? [] : result.errors.map((e) => e.field);
};

describe("validateCompletedHole (§99)", () => {
  it("accepts a well-formed hole and normalises defaults", () => {
    const result = validateCompletedHole(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hole.status).toBe("completed");
      expect(result.hole.approachAttempts).toEqual([]);
      expect(result.hole.mistakes).toEqual([]);
      expect(result.hole.pickedUp).toBe(false);
    }
  });

  it.each([
    ["score must be positive", { ...valid, score: 0 }, "score"],
    ["shotsToZone cannot exceed score", { ...valid, score: 3, shotsToZone: 4 }, "shotsToZone"],
    ["negative shotsToZone", { ...valid, shotsToZone: -1 }, "shotsToZone"],
    ["putts cannot exceed shots from zone", { ...valid, score: 4, shotsToZone: 3, putts: 2 }, "putts"],
    ["par out of range", { ...valid, par: 7 }, "par"],
    ["holeNumber out of range", { ...valid, holeNumber: 19 }, "holeNumber"],
    ["negative penalties", { ...valid, penaltyStrokes: -1 }, "penaltyStrokes"],
  ] as const)("rejects: %s", (_label, input, field) => {
    expect(errorFields(input)).toContain(field);
  });

  it("requires firstPuttDistance when putts > 0", () => {
    expect(errorFields({ ...valid, putts: 2, firstPuttDistance: undefined })).toContain(
      "firstPuttDistance",
    );
  });

  it("forbids firstPuttDistance when putts = 0", () => {
    expect(
      errorFields({ ...valid, score: 3, shotsToZone: 3, putts: 0, firstPuttDistance: "5-15ft" }),
    ).toContain("firstPuttDistance");
  });

  it("allows putts = 0 with no first-putt distance (§27)", () => {
    expect(
      validateCompletedHole({ ...valid, score: 3, shotsToZone: 3, putts: 0, firstPuttDistance: undefined }).ok,
    ).toBe(true);
  });

  it("requires a miss direction on a missed-zone approach (§35)", () => {
    const fields = errorFields({
      ...valid,
      approachAttempts: [
        { sequence: 1, distanceBand: "150-174", result: "missed-zone" } as never,
      ],
    });
    expect(fields).toContain("approachAttempts.0.missDirection");
  });

  it("requires bunkersVisited >= 1 when bunkerShots > 0 (correction #3)", () => {
    expect(
      errorFields({ ...valid, score: 6, shotsToZone: 2, putts: 2, bunkerShots: 2, bunkersVisited: 0 }),
    ).toContain("bunkersVisited");
  });

  it("never blocks completion on optional analytics fields (§99)", () => {
    const result = validateCompletedHole({
      ...valid,
      // no teeOutcome, no teeLie, no mistakes
    });
    expect(result.ok).toBe(true);
  });

  it("carries tee outcome and lie through without validating them (Epic 7)", () => {
    const result = validateCompletedHole({
      ...valid,
      teeOutcome: "recovery-required",
      teeLie: "trees-other",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hole.teeOutcome).toBe("recovery-required");
      expect(result.hole.teeLie).toBe("trees-other");
    }
  });

  it("accepts a picked-up hole (§9 correction)", () => {
    const result = validateCompletedHole({
      ...valid,
      pickedUp: true,
      score: 8,
      shotsToZone: 4,
      putts: 2,
      firstPuttDistance: "15-30ft",
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hole.pickedUp).toBe(true);
  });

  it("assertCompletedHole throws on invalid input", () => {
    expect(() => assertCompletedHole({ ...valid, score: 0 })).toThrow(/score/);
  });
});
