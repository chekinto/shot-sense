import { calculateTeeContext } from "./teeContext";
import { completedHole, completedRound } from "@test/scoring/factories";

describe("calculateTeeContext", () => {
  it("counts only holes that have a tee outcome recorded", () => {
    const tee = calculateTeeContext(
      completedRound([
        completedHole({ holeNumber: 1, teeOutcome: "clear", teeLie: "fairway" }),
        completedHole({ holeNumber: 2, teeOutcome: "compromised", teeLie: "rough" }),
        completedHole({ holeNumber: 3 }), // nothing recorded
      ]),
    );

    expect(tee.recorded).toBe(2);
    expect(tee.outcomes).toMatchObject({ clear: 1, compromised: 1, penalty: 0 });
    expect(tee.lies).toMatchObject({ fairway: 1, rough: 1 });
  });

  it("treats recovery-required and penalty as costly, compromised as trouble only", () => {
    const tee = calculateTeeContext(
      completedRound([
        completedHole({ holeNumber: 4, teeOutcome: "compromised" }),
        completedHole({ holeNumber: 7, teeOutcome: "recovery-required" }),
        completedHole({
          holeNumber: 11,
          teeOutcome: "penalty",
          score: 6,
          shotsToZone: 3,
          putts: 2,
          penaltyStrokes: 1,
        }),
      ]),
    );

    expect(tee.troubleOffTee).toBe(3);
    expect(tee.costlyOffTee).toBe(2);
    expect(tee.costlyHoles).toEqual([7, 11]);
    expect(tee.penaltyOffTee).toBe(1);
  });

  it("counts a tee lie even when no outcome was recorded", () => {
    const tee = calculateTeeContext(
      completedRound([completedHole({ holeNumber: 1, teeLie: "bunker" })]),
    );
    expect(tee.recorded).toBe(0);
    expect(tee.lies.bunker).toBe(1);
  });

  it("is empty for a round with no tee data", () => {
    const tee = calculateTeeContext(
      completedRound([completedHole({ holeNumber: 1 })]),
    );
    expect(tee).toMatchObject({
      recorded: 0,
      troubleOffTee: 0,
      costlyOffTee: 0,
      costlyHoles: [],
      penaltyOffTee: 0,
    });
  });
});
