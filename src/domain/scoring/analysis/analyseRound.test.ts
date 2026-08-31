import { analyseRound } from "./analyseRound";
import {
  approach,
  completedHole,
  completedRound,
  eighteenPars,
} from "@test/scoring/factories";

describe("analyseRound", () => {
  it("composes summary, STGB and benchmark for a clean level-par round", () => {
    const analysis = analyseRound(completedRound(eighteenPars()));

    expect(analysis.summary.overall.toPar).toBe(0);
    expect(analysis.shotsToGetBack.total).toBe(0);
    expect(analysis.benchmark.enteredInRegulation).toEqual({
      count: 18,
      of: 18,
    });
    expect(analysis.benchmark.downInThree).toEqual({ count: 18, of: 18 });
    expect(analysis.benchmark.leakHoles).toEqual([]);
  });

  it("breaks approaches out by band (counts only)", () => {
    const analysis = analyseRound(
      completedRound([
        completedHole({
          holeNumber: 1,
          approachAttempts: [approach({ distanceBand: "150-174", result: "green" })],
        }),
        completedHole({
          holeNumber: 2,
          approachAttempts: [
            {
              sequence: 1,
              distanceBand: "150-174",
              result: "missed-zone",
              missDirection: "long",
            },
          ],
        }),
      ]),
    );
    const band = analysis.approachBands.rows.find((r) => r.band === "150-174");
    expect(band).toMatchObject({ attempts: 2, successes: 1, failures: 1 });
    expect(analysis.approachBands.misses.long).toBe(1);
  });

  it("includes the tee-shot context", () => {
    const holes = eighteenPars().map((h, i) =>
      i === 0
        ? completedHole({ holeNumber: 1, teeOutcome: "recovery-required" })
        : completedHole({ holeNumber: i + 1, teeOutcome: "clear" }),
    );
    const analysis = analyseRound(completedRound(holes));
    expect(analysis.tee.recorded).toBe(18);
    expect(analysis.tee.outcomes.clear).toBe(17);
    expect(analysis.tee.costlyHoles).toEqual([1]);
  });

  it("echoes the round id and methodology version", () => {
    const analysis = analyseRound(
      completedRound(eighteenPars(), {
        id: "abc",
        methodologyVersion: "1.0.0",
      }),
    );
    expect(analysis).toMatchObject({
      roundId: "abc",
      methodologyVersion: "1.0.0",
    });
  });

  it("excludes picked-up holes from approach success but keeps them in score/STGB (§9)", () => {
    const holes = [
      completedHole({
        holeNumber: 1,
        approachAttempts: [approach({ result: "green" })],
      }),
      completedHole({
        holeNumber: 2,
        pickedUp: true,
        score: 9,
        shotsToZone: 5,
        putts: 2,
        penaltyStrokes: 1,
        approachAttempts: [
          {
            sequence: 1,
            distanceBand: "150-174",
            result: "missed-zone",
            missDirection: "left",
          },
        ],
      }),
    ];
    const analysis = analyseRound(
      completedRound(holes, { plannedHoleCount: 18 }),
    );

    // approach stats ignore the picked-up hole's missed approach
    expect(analysis.approach).toMatchObject({ successes: 1, failures: 0 });
    // but its penalty stroke still counts toward STGB and its score toward the total
    expect(analysis.shotsToGetBack.penalty).toBe(1);
    expect(analysis.summary.overall.score).toBe(4 + 9);
  });
});
