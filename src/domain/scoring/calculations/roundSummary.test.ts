import { calculateRoundSummary } from "./roundSummary";
import {
  completedHole,
  completedRound,
  eighteenPars,
} from "@test/scoring/factories";

describe("calculateRoundSummary", () => {
  it("totals an 18-hole round with front, back and overall (§65)", () => {
    const holes = eighteenPars().map((h, i) => {
      if (i === 3) {
        // hole 4: birdie
        return completedHole({
          holeNumber: 4,
          score: 3,
          shotsToZone: 2,
          putts: 1,
          firstPuttDistance: "under-5ft",
        });
      }
      if (i === 12) {
        // hole 13: double bogey
        return completedHole({
          holeNumber: 13,
          score: 6,
          shotsToZone: 2,
          putts: 3,
          firstPuttDistance: "15-30ft",
        });
      }
      return h;
    });
    const summary = calculateRoundSummary(completedRound(holes));

    expect(summary.isComplete).toBe(true);
    expect(summary.overall).toMatchObject({
      holesPlayed: 18,
      par: 72,
      score: 73,
    });
    expect(summary.overall.toPar).toBe(1);
    expect(summary.front).toMatchObject({ score: 35, par: 36, toPar: -1 });
    expect(summary.front?.results).toMatchObject({ birdie: 1, par: 8 });
    expect(summary.back).toMatchObject({ score: 38, par: 36, toPar: 2 });
    expect(summary.back?.results).toMatchObject({ "double-bogey": 1, par: 8 });
  });

  it("handles a 9-hole round played as the front nine (§65)", () => {
    const holes = Array.from({ length: 9 }, (_, i) =>
      completedHole({ holeNumber: i + 1 }),
    );
    const summary = calculateRoundSummary(
      completedRound(holes, { plannedHoleCount: 9 }),
    );

    expect(summary.isComplete).toBe(true);
    expect(summary.overall.holesPlayed).toBe(9);
    expect(summary.front?.holesPlayed).toBe(9);
    expect(summary.back).toBeNull();
  });

  it("does not assume a 9-hole round is holes 1–9 (§20)", () => {
    const holes = Array.from({ length: 9 }, (_, i) =>
      completedHole({ holeNumber: i + 10 }),
    );
    const summary = calculateRoundSummary(
      completedRound(holes, { plannedHoleCount: 9 }),
    );

    expect(summary.front).toBeNull();
    expect(summary.back?.holesPlayed).toBe(9);
    expect(summary.overall.holesPlayed).toBe(9);
  });

  it("reports incomplete when fewer holes than planned are present", () => {
    const holes = Array.from({ length: 7 }, (_, i) =>
      completedHole({ holeNumber: i + 1 }),
    );
    const summary = calculateRoundSummary(
      completedRound(holes, { plannedHoleCount: 18 }),
    );
    expect(summary.isComplete).toBe(false);
    expect(summary.overall.holesPlayed).toBe(7);
  });

  it("classifies a mixed scoring line correctly (§66)", () => {
    const holes = [
      completedHole({
        holeNumber: 1,
        par: 5,
        score: 3,
        shotsToZone: 2,
        putts: 1,
        firstPuttDistance: "under-5ft",
      }), // eagle
      completedHole({
        holeNumber: 2,
        par: 4,
        score: 3,
        shotsToZone: 2,
        putts: 1,
        firstPuttDistance: "under-5ft",
      }), // birdie
      completedHole({ holeNumber: 3, par: 4, score: 4 }), // par
      completedHole({
        holeNumber: 4,
        par: 4,
        score: 5,
        shotsToZone: 2,
        putts: 3,
        firstPuttDistance: "15-30ft",
      }), // bogey
      completedHole({
        holeNumber: 5,
        par: 3,
        score: 5,
        shotsToZone: 1,
        putts: 3,
        firstPuttDistance: "15-30ft",
      }), // double
      completedHole({
        holeNumber: 6,
        par: 4,
        score: 8,
        shotsToZone: 4,
        putts: 3,
        firstPuttDistance: "15-30ft",
      }), // triple+
    ];
    const summary = calculateRoundSummary(
      completedRound(holes, { plannedHoleCount: 18 }),
    );
    expect(summary.overall.results).toEqual({
      "eagle-or-better": 1,
      birdie: 1,
      par: 1,
      bogey: 1,
      "double-bogey": 1,
      "triple-bogey-plus": 1,
    });
  });
});
