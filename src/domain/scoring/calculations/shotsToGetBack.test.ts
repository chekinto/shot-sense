import {
  calculateBunkerShotsToGetBack,
  calculateHoleShotsToGetBack,
  calculatePenaltyShotsToGetBack,
  calculatePuttingShotsToGetBack,
} from "./shotsToGetBack";

describe("calculatePuttingShotsToGetBack (§43)", () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 1],
    [4, 2],
    [5, 3],
  ])("%i putts => %i", (putts, expected) => {
    expect(calculatePuttingShotsToGetBack(putts)).toBe(expected);
  });
});

describe("calculatePenaltyShotsToGetBack (§44)", () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
  ])("%i penalty strokes => %i", (penalties, expected) => {
    expect(calculatePenaltyShotsToGetBack(penalties)).toBe(expected);
  });
});

describe("calculateBunkerShotsToGetBack (§45 + correction #3)", () => {
  it.each([
    [0, 0, 0],
    [1, 1, 0],
    [2, 1, 1],
    [3, 1, 2],
  ])("%i shots in one bunker (visited %i) => %i", (bunkerShots, bunkersVisited, expected) => {
    expect(calculateBunkerShotsToGetBack({ bunkerShots, bunkersVisited })).toBe(
      expected,
    );
  });

  it("two clean escapes from two bunkers is 0, not 1", () => {
    expect(
      calculateBunkerShotsToGetBack({ bunkerShots: 2, bunkersVisited: 2 }),
    ).toBe(0);
  });

  it("assumes one bunker when bunkersVisited is missing", () => {
    expect(
      calculateBunkerShotsToGetBack({ bunkerShots: 3, bunkersVisited: 0 }),
    ).toBe(2);
  });
});

describe("calculateHoleShotsToGetBack (§42)", () => {
  it("sums penalty + putting + bunker", () => {
    expect(
      calculateHoleShotsToGetBack({
        putts: 3,
        penaltyStrokes: 1,
        bunkerShots: 2,
        bunkersVisited: 1,
      }),
    ).toEqual({ putting: 1, penalty: 1, bunker: 1, total: 3 });
  });

  it("is zero for a clean hole", () => {
    expect(
      calculateHoleShotsToGetBack({
        putts: 2,
        penaltyStrokes: 0,
        bunkerShots: 0,
        bunkersVisited: 0,
      }),
    ).toEqual({ putting: 0, penalty: 0, bunker: 0, total: 0 });
  });
});
