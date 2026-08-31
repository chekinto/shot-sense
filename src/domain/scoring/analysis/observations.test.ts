import { generateRoundObservations, OBSERVATION_LIMIT } from "./observations";
import { completedHole, completedRound, eighteenPars } from "@test/scoring/factories";

describe("generateRoundObservations", () => {
  it("reports penalty strokes with the affected holes", () => {
    const round = completedRound([
      completedHole({ holeNumber: 1, score: 6, shotsToZone: 3, putts: 2, penaltyStrokes: 1 }),
      completedHole({ holeNumber: 2, score: 7, shotsToZone: 4, putts: 2, penaltyStrokes: 2 }),
      completedHole({ holeNumber: 3 }),
    ]);
    const [top] = generateRoundObservations(round);
    expect(top?.id).toBe("penalties");
    expect(top?.text).toMatch(/3 penalty strokes across 2 holes \(1, 2\)/);
  });

  it("flags 3-putts and notes when they were all long range", () => {
    const round = completedRound([
      completedHole({ holeNumber: 1, score: 6, shotsToZone: 2, putts: 4, firstPuttDistance: "50ft-plus" }),
      completedHole({ holeNumber: 2, score: 6, shotsToZone: 2, putts: 3, firstPuttDistance: "30-50ft" }),
      completedHole({ holeNumber: 3 }),
    ]);
    const obs = generateRoundObservations(round);
    const threePutts = obs.find((o) => o.id === "three-putts");
    expect(threePutts?.text).toMatch(/2 holes with 3 or more putts/);
    expect(threePutts?.text).toMatch(/all from long range/i);
  });

  it("calls out blow-up holes and clustering", () => {
    const holes = eighteenPars().map((h, i) =>
      i === 12 || i === 15
        ? completedHole({ holeNumber: i + 1, par: 4, score: 8, shotsToZone: 3, putts: 3, firstPuttDistance: "15-30ft" })
        : h,
    );
    const obs = generateRoundObservations(completedRound(holes));
    const blowUps = obs.find((o) => o.id === "blow-ups");
    expect(blowUps?.text).toMatch(/2 blow-up holes \(triple bogey or worse\): 13, 16/);
    expect(blowUps?.text).toMatch(/all on the back nine/i);
  });

  it("notes a nine-split when one half was clearly better (18-hole rounds)", () => {
    const holes = eighteenPars().map((h, i) =>
      i < 4
        ? completedHole({ holeNumber: i + 1, par: 4, score: 6, shotsToZone: 3, putts: 2 })
        : h,
    );
    const obs = generateRoundObservations(completedRound(holes));
    expect(obs.find((o) => o.id === "nine-split")?.text).toMatch(
      /back nine was 8 shots better/i,
    );
  });

  it("gives a positive note only for a genuinely tidy round", () => {
    const obs = generateRoundObservations(completedRound(eighteenPars()));
    expect(obs).toHaveLength(1);
    expect(obs[0]?.id).toBe("tidy");
  });

  it("surfaces at most the observation limit, ranked by weight", () => {
    const holes = eighteenPars().map((h, i) => {
      if (i === 0) return completedHole({ holeNumber: 1, score: 7, shotsToZone: 4, putts: 2, penaltyStrokes: 2 });
      if (i === 5) return completedHole({ holeNumber: 6, score: 8, shotsToZone: 3, putts: 4, firstPuttDistance: "5-15ft" });
      if (i === 12) return completedHole({ holeNumber: 13, par: 4, score: 8, shotsToZone: 3, putts: 3, firstPuttDistance: "15-30ft" });
      return h;
    });
    const obs = generateRoundObservations(completedRound(holes));
    expect(obs.length).toBeLessThanOrEqual(OBSERVATION_LIMIT);
    expect(obs[0]?.id).toBe("penalties");
  });

  it("calls out costly tee shots and notes the penalties among them", () => {
    const holes = eighteenPars().map((h, i) => {
      if (i === 3)
        return completedHole({
          holeNumber: 4,
          score: 6,
          shotsToZone: 3,
          putts: 2,
          penaltyStrokes: 1,
          teeOutcome: "penalty",
        });
      if (i === 6)
        return completedHole({
          holeNumber: 7,
          score: 5,
          shotsToZone: 3,
          putts: 2,
          teeOutcome: "recovery-required",
        });
      return h;
    });
    const tee = generateRoundObservations(completedRound(holes)).find(
      (o) => o.id === "tee-shots",
    );
    expect(tee?.text).toMatch(/2 tee shots put you out of position/i);
    expect(tee?.text).toMatch(/holes 4, 7/);
    expect(tee?.text).toMatch(/1 of them drew a penalty stroke/i);
  });

  it("flags approach misses and their dominant direction", () => {
    const holes = eighteenPars().map((h, i) => {
      if (i < 3)
        return completedHole({
          holeNumber: i + 1,
          approachAttempts: [
            {
              sequence: 1,
              distanceBand: "150-174",
              result: "missed-zone",
              missDirection: "right",
            },
          ],
        });
      return h;
    });
    const obs = generateRoundObservations(completedRound(holes)).find(
      (o) => o.id === "approach-misses",
    );
    expect(obs?.text).toMatch(/3 approach shots missed the zone/i);
    expect(obs?.text).toMatch(/holes 1, 2, 3/);
    expect(obs?.text).toMatch(/every one missed right/i);
  });

  it("does not flag approach misses below 3", () => {
    const holes = eighteenPars().map((h, i) =>
      i < 2
        ? completedHole({
            holeNumber: i + 1,
            approachAttempts: [
              {
                sequence: 1,
                distanceBand: "150-174",
                result: "missed-zone",
                missDirection: "left",
              },
            ],
          })
        : h,
    );
    expect(
      generateRoundObservations(completedRound(holes)).some(
        (o) => o.id === "approach-misses",
      ),
    ).toBe(false);
  });

  it("does not flag tee shots when only one was costly", () => {
    const holes = eighteenPars().map((h, i) =>
      i === 6
        ? completedHole({
            holeNumber: 7,
            score: 5,
            shotsToZone: 3,
            putts: 2,
            teeOutcome: "recovery-required",
          })
        : h,
    );
    expect(
      generateRoundObservations(completedRound(holes)).some(
        (o) => o.id === "tee-shots",
      ),
    ).toBe(false);
  });

  it("only produces event-count observations (no rate claims)", () => {
    const holes = eighteenPars().map((h, i) =>
      i === 0 ? completedHole({ holeNumber: 1, score: 6, shotsToZone: 3, putts: 2, penaltyStrokes: 1 }) : h,
    );
    for (const o of generateRoundObservations(completedRound(holes))) {
      expect(o.basis).toBe("event-count");
    }
  });
});
