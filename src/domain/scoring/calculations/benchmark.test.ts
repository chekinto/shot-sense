import {
  calculateBenchmarkScorecard,
  calculateHoleBenchmark,
  enteredZoneInRegulation,
  gotDownInThree,
  regulationShotsToZone,
} from "./benchmark";
import { completedHole, completedRound } from "@test/scoring/factories";

describe("regulationShotsToZone", () => {
  it.each([
    [3, 1],
    [4, 2],
    [5, 3],
  ])("par %i allows %i shots to the zone", (par, expected) => {
    expect(regulationShotsToZone(par)).toBe(expected);
  });
});

describe("enteredZoneInRegulation", () => {
  it("par 4 reached in 2 is in regulation", () => {
    expect(enteredZoneInRegulation({ par: 4, shotsToZone: 2 })).toBe(true);
  });
  it("par 4 reached in 3 is not", () => {
    expect(enteredZoneInRegulation({ par: 4, shotsToZone: 3 })).toBe(false);
  });
  it("a hole starting inside the zone (shotsToZone 0) is trivially in regulation (§11)", () => {
    expect(enteredZoneInRegulation({ par: 3, shotsToZone: 0 })).toBe(true);
  });
});

describe("gotDownInThree", () => {
  it.each([
    [2, true],
    [3, true],
    [4, false],
  ])("shotsFromZone %i => %s", (shotsFromZone, expected) => {
    expect(gotDownInThree({ shotsFromZone })).toBe(expected);
  });
});

describe("calculateHoleBenchmark", () => {
  it("splits the leak into to-zone and from-zone", () => {
    // par 4, score 7, shotsToZone 4 (2 over regulation), shotsFromZone 3 (down in 3)
    expect(
      calculateHoleBenchmark({
        holeNumber: 5,
        par: 4,
        score: 7,
        shotsToZone: 4,
      }),
    ).toEqual({
      holeNumber: 5,
      enteredInRegulation: false,
      downInThree: true,
      toZoneLeak: 2,
      fromZoneLeak: 0,
    });
  });

  it("counts a from-zone leak when finishing takes more than three", () => {
    // par 4, score 7, shotsToZone 2 (regulation), shotsFromZone 5 (2 over)
    expect(
      calculateHoleBenchmark({
        holeNumber: 6,
        par: 4,
        score: 7,
        shotsToZone: 2,
      }),
    ).toMatchObject({
      toZoneLeak: 0,
      fromZoneLeak: 2,
      enteredInRegulation: true,
    });
  });
});

describe("calculateBenchmarkScorecard", () => {
  it("counts entered / down-in-3 across the round and ranks leak holes", () => {
    const round = completedRound([
      completedHole({
        holeNumber: 1,
        par: 4,
        score: 4,
        shotsToZone: 2,
        putts: 2,
      }),
      // to-zone leak of 2
      completedHole({
        holeNumber: 2,
        par: 4,
        score: 6,
        shotsToZone: 4,
        putts: 2,
      }),
      // from-zone leak of 1
      completedHole({
        holeNumber: 3,
        par: 3,
        score: 5,
        shotsToZone: 1,
        putts: 3,
        firstPuttDistance: "5-15ft",
      }),
    ]);

    const card = calculateBenchmarkScorecard(round);

    expect(card.enteredInRegulation).toEqual({ count: 2, of: 3 });
    expect(card.downInThree).toEqual({ count: 2, of: 3 });
    expect(card.totalToZoneLeak).toBe(2);
    expect(card.totalFromZoneLeak).toBe(1);
    expect(card.leakHoles.map((h) => h.holeNumber)).toEqual([2, 3]);
  });
});
