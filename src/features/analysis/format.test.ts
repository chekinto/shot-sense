import { resultBreakdown, toParLabel } from "./format";
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
