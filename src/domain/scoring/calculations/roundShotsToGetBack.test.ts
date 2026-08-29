import { calculateRoundShotsToGetBack } from "./roundShotsToGetBack";
import { completedHole, completedRound } from "@test/scoring/factories";

describe("calculateRoundShotsToGetBack", () => {
  it("sums STGB across holes and lists only contributing holes", () => {
    const round = completedRound([
      completedHole({ holeNumber: 1 }), // clean
      completedHole({
        holeNumber: 2,
        score: 6,
        shotsToZone: 2,
        putts: 4,
        firstPuttDistance: "15-30ft",
      }), // putting 2
      completedHole({
        holeNumber: 3,
        score: 6,
        shotsToZone: 3,
        putts: 2,
        penaltyStrokes: 1,
      }), // penalty 1
      completedHole({
        holeNumber: 4,
        score: 6,
        shotsToZone: 2,
        putts: 2,
        bunkerShots: 3,
        bunkersVisited: 1,
      }), // bunker 2
    ]);

    const stgb = calculateRoundShotsToGetBack(round);

    expect(stgb).toMatchObject({ putting: 2, penalty: 1, bunker: 2, total: 5 });
    expect(stgb.byHole.map((h) => h.holeNumber)).toEqual([2, 3, 4]);
  });

  it("is all zeros for a clean round", () => {
    const round = completedRound([
      completedHole({ holeNumber: 1 }),
      completedHole({ holeNumber: 2 }),
    ]);
    expect(calculateRoundShotsToGetBack(round)).toEqual({
      putting: 0,
      penalty: 0,
      bunker: 0,
      total: 0,
      byHole: [],
    });
  });
});
