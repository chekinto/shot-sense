import type { ApproachAttempt } from "../models/approach";
import { calculateApproachSuccess } from "./approachSuccess";

const a = (
  result: ApproachAttempt["result"],
  sequence: number,
): ApproachAttempt =>
  result === "missed-zone"
    ? { sequence, distanceBand: "150-174", result, missDirection: "short" }
    : { sequence, distanceBand: "150-174", result };

describe("calculateApproachSuccess", () => {
  it("green and scoring-zone are successes; missed-zone is a failure (§34)", () => {
    const result = calculateApproachSuccess([
      a("green", 1),
      a("scoring-zone", 2),
      a("missed-zone", 3),
    ]);
    expect(result).toMatchObject({ successes: 2, failures: 1, layups: 0 });
    expect(result.successRate).toBeCloseTo(2 / 3);
  });

  it("excludes intentional lay-ups from numerator and denominator (§36)", () => {
    const result = calculateApproachSuccess([
      ...Array.from({ length: 5 }, (_, i) => a("green", i + 1)),
      ...Array.from({ length: 3 }, (_, i) => a("missed-zone", i + 6)),
      a("intentional-layup", 9),
      a("intentional-layup", 10),
    ]);
    expect(result).toMatchObject({
      successes: 5,
      failures: 3,
      layups: 2,
      ratedAttempts: 8,
    });
    expect(result.successRate).toBeCloseTo(5 / 8);
  });

  it("returns a null rate when there are no rated attempts", () => {
    expect(calculateApproachSuccess([]).successRate).toBeNull();
    expect(
      calculateApproachSuccess([a("intentional-layup", 1)]).successRate,
    ).toBeNull();
  });
});
