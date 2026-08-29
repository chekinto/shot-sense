import { METHODOLOGY_VERSION, SCORING_ZONE_YARDS } from "./methodology";

describe("methodology constants", () => {
  it("starts at 1.0.0", () => {
    expect(METHODOLOGY_VERSION).toBe("1.0.0");
  });

  it("fixes the V1 Scoring Zone at 100 yards", () => {
    expect(SCORING_ZONE_YARDS).toBe(100);
  });
});
