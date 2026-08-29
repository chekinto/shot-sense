import { calculateShotsFromZone } from "./shotsFromZone";

describe("calculateShotsFromZone", () => {
  it("is score minus shots to zone (§9)", () => {
    expect(calculateShotsFromZone({ score: 4, shotsToZone: 2 })).toBe(2);
  });

  it("putting green counts as inside the zone (§10): par 4, drive+approach on, 2 putts", () => {
    // shots to zone = 2 (drive, approach to green), score 4 => from zone = 2
    expect(calculateShotsFromZone({ score: 4, shotsToZone: 2 })).toBe(2);
  });

  it("hole starting inside the zone has shotsToZone 0 (§11): 70-yd par 3, tee + 2 putts", () => {
    expect(calculateShotsFromZone({ score: 3, shotsToZone: 0 })).toBe(3);
  });

  it("holds with penalty strokes counted before the zone (§2 correction)", () => {
    // par 4: drive OB (1 + 1 penalty), re-tee to fairway (1), approach to 40yd (1),
    // pitch on (1), 1 putt = score 6, shotsToZone 4 (drive, penalty, re-tee, approach)
    expect(calculateShotsFromZone({ score: 6, shotsToZone: 4 })).toBe(2);
  });

  it("holds with a penalty inside the zone", () => {
    // par 4: drive + approach into greenside hazard from 30yd (shotsToZone 2),
    // penalty drop, pitch on, 2 putts => score 6, from zone = 4
    expect(calculateShotsFromZone({ score: 6, shotsToZone: 2 })).toBe(4);
  });

  it("throws when shots to zone exceeds score", () => {
    expect(() => calculateShotsFromZone({ score: 3, shotsToZone: 4 })).toThrow(
      RangeError,
    );
  });

  it("throws on negative shots to zone", () => {
    expect(() => calculateShotsFromZone({ score: 4, shotsToZone: -1 })).toThrow(
      RangeError,
    );
  });
});
