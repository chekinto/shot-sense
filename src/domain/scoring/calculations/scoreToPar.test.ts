import {
  calculateScoreToPar,
  classifyHoleResult,
  emptyHoleResultTally,
} from "./scoreToPar";

describe("calculateScoreToPar", () => {
  it.each([
    [3, 4, -1],
    [4, 4, 0],
    [6, 4, 2],
    [2, 5, -3],
  ])("score %i on par %i => %i", (score, par, expected) => {
    expect(calculateScoreToPar({ score, par })).toBe(expected);
  });
});

describe("classifyHoleResult", () => {
  it.each([
    [-3, "eagle-or-better"],
    [-2, "eagle-or-better"],
    [-1, "birdie"],
    [0, "par"],
    [1, "bogey"],
    [2, "double-bogey"],
    [3, "triple-bogey-plus"],
    [7, "triple-bogey-plus"],
  ] as const)("score-to-par %i => %s", (toPar, expected) => {
    expect(classifyHoleResult(toPar)).toBe(expected);
  });
});

describe("emptyHoleResultTally", () => {
  it("has every bucket at zero", () => {
    expect(emptyHoleResultTally()).toEqual({
      "eagle-or-better": 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      "double-bogey": 0,
      "triple-bogey-plus": 0,
    });
  });
});
