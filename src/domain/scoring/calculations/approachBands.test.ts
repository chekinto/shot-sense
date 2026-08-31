import { calculateApproachBands } from "./approachBands";
import type { ApproachAttempt } from "../models/approach";

const green = (band: ApproachAttempt["distanceBand"]): ApproachAttempt => ({
  sequence: 1,
  distanceBand: band,
  result: "green",
});

const missed = (
  band: ApproachAttempt["distanceBand"],
  missDirection: "short" | "long" | "left" | "right",
): ApproachAttempt => ({
  sequence: 1,
  distanceBand: band,
  result: "missed-zone",
  missDirection,
});

describe("calculateApproachBands", () => {
  it("groups attempts by band in distance order, counting outcomes", () => {
    const { rows } = calculateApproachBands([
      green("150-174"),
      missed("150-174", "left"),
      green("under-100"),
      { sequence: 1, distanceBand: "200-plus", result: "intentional-layup" },
    ]);

    expect(rows.map((r) => r.band)).toEqual([
      "under-100",
      "150-174",
      "200-plus",
    ]);
    const mid = rows.find((r) => r.band === "150-174");
    expect(mid).toMatchObject({ attempts: 2, successes: 1, failures: 1 });
    expect(mid?.misses.left).toBe(1);
    expect(rows.find((r) => r.band === "200-plus")?.layups).toBe(1);
  });

  it("totals miss directions across every band", () => {
    const breakdown = calculateApproachBands([
      missed("125-149", "right"),
      missed("175-199", "right"),
      missed("150-174", "short"),
      green("100-124"),
    ]);
    expect(breakdown.totalMisses).toBe(3);
    expect(breakdown.misses).toMatchObject({ right: 2, short: 1, long: 0, left: 0 });
  });

  it("is empty when there are no attempts", () => {
    const breakdown = calculateApproachBands([]);
    expect(breakdown.rows).toEqual([]);
    expect(breakdown.totalMisses).toBe(0);
  });
});
