import { calculatePersonalBaseline } from "./personalBaseline";
import {
  completedHole,
  completedRound,
  eighteenPars,
} from "@test/scoring/factories";
import type { CompletedRound } from "../models/round";

const round = (id: string, overrides: Partial<CompletedRound> = {}) =>
  completedRound(eighteenPars(), { id, ...overrides });

describe("calculatePersonalBaseline", () => {
  it("returns null below the minimum number of rounds", () => {
    expect(calculatePersonalBaseline([round("a")])).toBeNull();
  });

  it("is an 'early' read at 2–4 rounds and 'established' at 5+", () => {
    expect(
      calculatePersonalBaseline([round("a"), round("b")])?.confidence,
    ).toBe("early");
    expect(
      calculatePersonalBaseline([
        round("a"),
        round("b"),
        round("c"),
        round("d"),
        round("e"),
      ])?.confidence,
    ).toBe("established");
  });

  it("averages per-hole rates so 9- and 18-hole rounds mix cleanly", () => {
    const nine = completedRound(
      Array.from({ length: 9 }, (_, i) => completedHole({ holeNumber: i + 1 })),
      { id: "nine", plannedHoleCount: 9 },
    );
    const baseline = calculatePersonalBaseline([round("a"), round("b"), nine]);
    // Every hole is a clean par: entered in regulation and down in three.
    expect(baseline?.enteredInRegulationRate).toBe(1);
    expect(baseline?.downInThreeRate).toBe(1);
    expect(baseline?.scoreToParPerHole).toBe(0);
  });

  it("only uses the most recent window", () => {
    const history = [
      round("newest"),
      round("2"),
      round("3"),
      round("4"),
      round("5"),
      round("stale", {
        holes: eighteenPars().map((h) =>
          completedHole({ ...h, score: 8, shotsToZone: 4, putts: 3 }),
        ),
      }),
    ];
    const baseline = calculatePersonalBaseline(history);
    expect(baseline?.roundsUsed).toBe(5);
    expect(baseline?.scoreToParPerHole).toBe(0); // the stale blow-up round is dropped
  });

  it("names a common leak only when 2+ full rounds agree, ignoring coarse rounds", () => {
    const leaky = (id: string) =>
      completedRound(
        eighteenPars().map((h, i) =>
          i === 0
            ? completedHole({ holeNumber: 1, score: 7, shotsToZone: 2, putts: 4, firstPuttDistance: "5-15ft" })
            : h,
        ),
        { id },
      );
    const coarseLeaky = { ...leaky("coarse"), dataCompleteness: "coarse" as const };

    expect(
      calculatePersonalBaseline([leaky("a"), round("b"), round("c")])?.commonLeak,
    ).toBeNull(); // only one round has the leak
    expect(
      calculatePersonalBaseline([leaky("a"), leaky("b"), round("c")])?.commonLeak,
    ).toBe("putting");
    expect(
      calculatePersonalBaseline([leaky("a"), coarseLeaky, round("c")])?.commonLeak,
    ).toBeNull(); // coarse round doesn't count toward the leak
  });
});
