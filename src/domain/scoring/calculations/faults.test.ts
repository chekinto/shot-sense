import { calculateFaults } from "./faults";
import { completedHole, completedRound } from "@test/scoring/factories";

describe("calculateFaults", () => {
  it("counts mistake tags (with duplicates) and the holes they were on", () => {
    const faults = calculateFaults(
      completedRound([
        completedHole({ holeNumber: 1, mistakes: ["strategy"] }),
        completedHole({ holeNumber: 2, mistakes: ["putting", "putting"] }),
        completedHole({ holeNumber: 3 }),
      ]),
    );
    expect(faults.totalMistakes).toBe(3);
    expect(faults.mistakeHoles).toEqual([1, 2]);
    expect(faults.mistakeCounts).toMatchObject({ strategy: 1, putting: 2, tee: 0 });
  });

  it("separates being in a bunker from being stuck in one (correction #3)", () => {
    const faults = calculateFaults(
      completedRound([
        completedHole({
          holeNumber: 1,
          score: 5,
          shotsToZone: 2,
          putts: 2,
          bunkerShots: 1,
          bunkersVisited: 1,
        }),
        completedHole({
          holeNumber: 2,
          score: 6,
          shotsToZone: 2,
          putts: 2,
          bunkerShots: 3,
          bunkersVisited: 1,
        }),
        completedHole({
          holeNumber: 3,
          score: 6,
          shotsToZone: 2,
          putts: 2,
          bunkerShots: 2,
          bunkersVisited: 2,
        }),
      ]),
    );
    expect(faults.bunkerHoles).toEqual([1, 2, 3]);
    expect(faults.bunkerStuckHoles).toEqual([2]); // two clean escapes on hole 3 = not stuck
  });

  it("is all-zero for a clean round", () => {
    const faults = calculateFaults(
      completedRound([completedHole({ holeNumber: 1 })]),
    );
    expect(faults).toMatchObject({
      totalMistakes: 0,
      mistakeHoles: [],
      bunkerHoles: [],
      bunkerStuckHoles: [],
    });
  });
});
