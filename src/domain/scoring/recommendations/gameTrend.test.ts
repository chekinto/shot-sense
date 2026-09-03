import { calculateGameTrend } from "./gameTrend";
import {
  approach,
  completedHole,
  completedRound,
  eighteenPars,
  missedApproach,
} from "@test/scoring/factories";
import type { CompletedRound } from "../models/round";

const parRound = (id: string): CompletedRound =>
  completedRound(eighteenPars(), { id });

/** A round that scores `over` shots over par, spread across the front. */
const roughRound = (id: string, over: number): CompletedRound =>
  completedRound(
    eighteenPars().map((h, i) =>
      i < over
        ? completedHole({
            holeNumber: i + 1,
            score: 6,
            shotsToZone: 2,
            putts: 4,
            firstPuttDistance: "5-15ft",
          })
        : h,
    ),
    { id },
  );

describe("calculateGameTrend", () => {
  it("returns null below the minimum rounds", () => {
    expect(calculateGameTrend([parRound("a"), parRound("b")])).toBeNull();
  });

  it("reports direction from the first half vs the second half", () => {
    // Getting worse: 0 over, 0 over, 4 over, 4 over.
    const worsening = calculateGameTrend([
      parRound("1"),
      parRound("2"),
      roughRound("3", 4),
      roughRound("4", 4),
    ]);
    expect(worsening?.scoreToPar.direction).toBe("declining");

    // Improving: 4 over, 4 over, 0 over, 0 over.
    const improving = calculateGameTrend([
      roughRound("1", 4),
      roughRound("2", 4),
      parRound("3"),
      parRound("4"),
    ]);
    expect(improving?.scoreToPar.direction).toBe("improving");
  });

  it("aligns roundIds with every series", () => {
    const trend = calculateGameTrend([parRound("a"), parRound("b"), parRound("c")]);
    expect(trend?.roundIds).toEqual(["a", "b", "c"]);
    expect(trend?.enteredInRegulation.values).toHaveLength(3);
  });

  it("keeps band-level approach history locked until the sample clears", () => {
    // 3 rounds, one approach each — well short of 12.
    const light = calculateGameTrend([
      completedRound(
        eighteenPars().map((h, i) =>
          i === 0
            ? completedHole({ holeNumber: 1, approachAttempts: [approach()] })
            : h,
        ),
        { id: "a" },
      ),
      parRound("b"),
      parRound("c"),
    ]);
    expect(light?.approachBandsUnlocked).toBe(false);
    expect(light?.approachBands).toEqual([]);
    expect(light?.approachAttempts).toBe(1);
  });

  it("surfaces a band once it clears the sample", () => {
    const heavyHole = (n: number) =>
      completedHole({
        holeNumber: n,
        approachAttempts: [
          n % 2 === 0
            ? approach({ distanceBand: "150-174", result: "green" })
            : missedApproach({ distanceBand: "150-174" }),
        ],
      });
    const round = (id: string) =>
      completedRound(
        eighteenPars().map((h, i) => (i < 6 ? heavyHole(i + 1) : h)),
        { id },
      );
    const trend = calculateGameTrend([round("a"), round("b"), round("c")]);
    expect(trend?.approachBandsUnlocked).toBe(true);
    expect(trend?.approachBands[0]).toMatchObject({
      band: "150-174",
      attempts: 18,
    });
  });

  it("flags a leak that recurs in at least half the rounds", () => {
    const trend = calculateGameTrend([
      roughRound("1", 2),
      roughRound("2", 2),
      parRound("3"),
    ]);
    expect(trend?.recurringLeaks.map((l) => l.category)).toContain("putting");
  });
});
