import {
  Prisma,
  type Round,
  type RoundHole,
  type RoundHoleApproach,
} from "@prisma/client";
import { toScoringRound } from "./scoringRoundMapper";

type HoleWithApproaches = RoundHole & { approaches: RoundHoleApproach[] };

const approach = (
  overrides: Partial<RoundHoleApproach> = {},
): RoundHoleApproach => ({
  id: "a1",
  roundHoleId: "h1",
  sequence: 1,
  distanceBand: "150-174",
  result: "green",
  missDirection: null,
  ...overrides,
});

const round = (overrides: Partial<Round> = {}): Round => ({
  id: "round-1",
  userId: "user-1",
  courseId: "course-1",
  teeSetId: null,
  playedOn: new Date("2026-08-30"),
  plannedHoleCount: 18,
  completedHoleCount: 0,
  handicapAtStart: new Prisma.Decimal("12.4"),
  scoringZoneYards: 100,
  status: "COMPLETED",
  methodologyVersion: "1.0.0",
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: new Date(),
  ...overrides,
});

const hole = (overrides: Partial<HoleWithApproaches>): HoleWithApproaches => ({
  id: `h${overrides.holeNumber}`,
  roundId: "round-1",
  holeNumber: 1,
  par: 4,
  yardage: null,
  score: 4,
  shotsToZone: 2,
  putts: 2,
  firstPuttDistance: "5-15ft",
  teeOutcome: null,
  teeLie: null,
  approaches: [],
  bunkerShots: 0,
  bunkersVisited: 0,
  mistakes: [],
  penaltyStrokes: 0,
  isComplete: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1,
  ...overrides,
});

describe("toScoringRound", () => {
  it("includes only completed holes, sorted, validated", () => {
    const scoring = toScoringRound({
      ...round(),
      holes: [
        hole({ holeNumber: 3 }),
        hole({ holeNumber: 1 }),
        hole({ holeNumber: 2, isComplete: false }),
      ],
    });
    expect(scoring.holes.map((h) => h.holeNumber)).toEqual([1, 3]);
    expect(scoring.holes[0]?.status).toBe("completed");
  });

  it("carries handicap, methodology version and the fixed zone", () => {
    const scoring = toScoringRound({ ...round(), holes: [hole({ holeNumber: 1 })] });
    expect(scoring).toMatchObject({
      handicapAtStart: 12.4,
      methodologyVersion: "1.0.0",
      scoringZoneYards: 100,
    });
  });

  it("omits handicap when the round has none", () => {
    const scoring = toScoringRound({
      ...round({ handicapAtStart: null }),
      holes: [hole({ holeNumber: 1 })],
    });
    expect(scoring.handicapAtStart).toBeUndefined();
  });

  it("carries bunker counts and valid mistake tags (Epic 9)", () => {
    const scoring = toScoringRound({
      ...round(),
      holes: [
        hole({
          holeNumber: 1,
          score: 6,
          shotsToZone: 2,
          putts: 2,
          bunkerShots: 3,
          bunkersVisited: 1,
          mistakes: ["short-game", "short-game", "bogus"],
        }),
      ],
    });
    expect(scoring.holes[0]).toMatchObject({
      bunkerShots: 3,
      bunkersVisited: 1,
      mistakes: ["short-game", "short-game"],
    });
  });

  it("maps approach rows and drops direction-less misses (Epic 8)", () => {
    const scoring = toScoringRound({
      ...round(),
      holes: [
        hole({
          holeNumber: 1,
          approaches: [
            approach({ sequence: 1, distanceBand: "150-174", result: "green" }),
            approach({
              sequence: 2,
              distanceBand: "125-149",
              result: "missed-zone",
              missDirection: "right",
            }),
            approach({ sequence: 3, result: "missed-zone", missDirection: null }),
          ],
        }),
      ],
    });
    expect(scoring.holes[0]?.approachAttempts).toEqual([
      { sequence: 1, distanceBand: "150-174", result: "green" },
      {
        sequence: 2,
        distanceBand: "125-149",
        result: "missed-zone",
        missDirection: "right",
      },
    ]);
  });

  it("carries tee outcome and lie through to the scoring hole (Epic 7)", () => {
    const scoring = toScoringRound({
      ...round(),
      holes: [
        hole({ holeNumber: 1, teeOutcome: "compromised", teeLie: "rough" }),
        hole({ holeNumber: 2, teeOutcome: "not-a-real-value" }),
      ],
    });
    expect(scoring.holes[0]).toMatchObject({
      teeOutcome: "compromised",
      teeLie: "rough",
    });
    expect(scoring.holes[1]?.teeOutcome).toBeUndefined();
  });

  it("drops the first-putt band when there were no putts", () => {
    const scoring = toScoringRound({
      ...round(),
      holes: [
        hole({ holeNumber: 1, score: 3, shotsToZone: 3, putts: 0, firstPuttDistance: "5-15ft" }),
      ],
    });
    expect(scoring.holes[0]?.firstPuttDistance).toBeUndefined();
  });

  it("throws if a completed hole fails domain validation", () => {
    expect(() =>
      toScoringRound({
        ...round(),
        holes: [hole({ holeNumber: 1, score: 3, shotsToZone: 5 })],
      }),
    ).toThrow();
  });
});
