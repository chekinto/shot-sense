import { calculateRecommendations } from "./recommendations";
import {
  completedHole,
  completedRound,
  eighteenPars,
} from "@test/scoring/factories";
import type { CompletedRound } from "../models/round";

/** A round that leaks ~2 shots to putting (two 3-putts) and nothing else. */
const puttingLeak = (id: string): CompletedRound =>
  completedRound(
    eighteenPars().map((h, i) =>
      i < 2
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

/** A round that leaks to a compromised tee shot. */
const teeLeak = (id: string): CompletedRound =>
  completedRound(
    eighteenPars().map((h, i) =>
      i < 2
        ? completedHole({
            holeNumber: i + 1,
            par: 4,
            score: 6,
            shotsToZone: 4,
            putts: 2,
            teeOutcome: "compromised",
          })
        : h,
    ),
    { id },
  );

describe("calculateRecommendations", () => {
  it("returns null below the minimum rounds", () => {
    expect(calculateRecommendations([puttingLeak("a"), puttingLeak("b")])).toBeNull();
  });

  it("returns null for a genuinely clean stretch", () => {
    const clean = ["a", "b", "c", "d", "e"].map((id) =>
      completedRound(eighteenPars(), { id }),
    );
    expect(calculateRecommendations(clean)).toBeNull();
  });

  it("gives a caveated Primary only at 3–4 rounds", () => {
    const result = calculateRecommendations([
      puttingLeak("a"),
      puttingLeak("b"),
      puttingLeak("c"),
    ]);
    expect(result?.confidence).toBe("early");
    expect(result?.primary.category).toBe("putting");
    expect(result?.secondary).toBeNull();
    expect(result?.keepDoing).toBeNull();
  });

  it("fills Primary, Secondary and Keep Doing at 5 rounds", () => {
    const result = calculateRecommendations([
      puttingLeak("a"),
      puttingLeak("b"),
      puttingLeak("c"),
      teeLeak("d"),
      teeLeak("e"),
    ]);
    expect(result?.confidence).toBe("firm");
    expect(result?.primary.category).toBe("putting");
    expect(result?.secondary?.category).toBe("tee");
    // No penalty strokes anywhere in the window → the Keep Doing win.
    expect(result?.keepDoing).toEqual({ id: "no-penalties", category: null });
  });

  it("suppresses a marginal runner-up", () => {
    const rounds = [
      puttingLeak("a"),
      puttingLeak("b"),
      puttingLeak("c"),
      puttingLeak("d"),
      // one round with a single tiny strategy flag
      completedRound(
        eighteenPars().map((h, i) =>
          i === 0 ? completedHole({ holeNumber: 1, mistakes: ["strategy"] }) : h,
        ),
        { id: "e" },
      ),
    ];
    const result = calculateRecommendations(rounds);
    expect(result?.primary.category).toBe("putting");
    expect(result?.secondary).toBeNull();
  });

  it("only looks at the most recent five rounds", () => {
    const window = [
      teeLeak("1"),
      teeLeak("2"),
      teeLeak("3"),
      teeLeak("4"),
      teeLeak("5"),
      puttingLeak("stale"),
      puttingLeak("stale2"),
    ];
    expect(calculateRecommendations(window)?.primary.category).toBe("tee");
  });
});
