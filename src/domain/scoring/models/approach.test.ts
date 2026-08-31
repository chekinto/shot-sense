import { toApproachAttempt } from "./approach";

describe("toApproachAttempt", () => {
  it("narrows a green result and drops any stray miss direction", () => {
    expect(
      toApproachAttempt({
        sequence: 2,
        distanceBand: "150-174",
        result: "green",
        missDirection: "left",
      }),
    ).toEqual({ sequence: 2, distanceBand: "150-174", result: "green" });
  });

  it("keeps the direction on a missed-zone result", () => {
    expect(
      toApproachAttempt({
        sequence: 1,
        distanceBand: "125-149",
        result: "missed-zone",
        missDirection: "right",
      }),
    ).toEqual({
      sequence: 1,
      distanceBand: "125-149",
      result: "missed-zone",
      missDirection: "right",
    });
  });

  it("returns null for a missed-zone result with no direction", () => {
    expect(
      toApproachAttempt({
        sequence: 1,
        distanceBand: "125-149",
        result: "missed-zone",
        missDirection: null,
      }),
    ).toBeNull();
  });
});
