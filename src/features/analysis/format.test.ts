import { biggestLeakLine, resultBreakdown, toParLabel } from "./format";
import { emptyHoleResultTally } from "@/domain/scoring";

describe("toParLabel", () => {
  it.each([
    [0, "E"],
    [3, "+3"],
    [-2, "-2"],
  ])("%i => %s", (value, expected) => {
    expect(toParLabel(value)).toBe(expected);
  });
});

describe("resultBreakdown", () => {
  it("lists non-zero buckets in order, pluralised", () => {
    const results = emptyHoleResultTally();
    results.birdie = 1;
    results.par = 6;
    results.bogey = 2;
    results["double-bogey"] = 1;
    expect(resultBreakdown(results)).toBe("1 birdie · 6 pars · 2 bogeys · 1 double");
  });

  it("is empty when nothing was scored", () => {
    expect(resultBreakdown(emptyHoleResultTally())).toBe("");
  });
});

describe("biggestLeakLine", () => {
  it("names the category with a rounded shot estimate and hole count", () => {
    expect(
      biggestLeakLine({
        category: "short-game",
        severity: 4,
        frequency: 5,
        holes: [2, 4, 7, 11, 15],
        flagged: 0,
      }),
    ).toBe("your short game leaked the most — about 4 shots across 5 holes");
  });

  it("singularises one shot on one hole", () => {
    expect(
      biggestLeakLine({
        category: "putting",
        severity: 1,
        frequency: 1,
        holes: [3],
        flagged: 0,
      }),
    ).toBe("your putting leaked the most — about 1 shot across 1 hole");
  });
});
