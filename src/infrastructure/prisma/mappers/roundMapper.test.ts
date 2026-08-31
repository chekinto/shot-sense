import { Prisma } from "@prisma/client";
import { toActiveRound, toDomainRoundStatus, toPlayableRound } from "./roundMapper";

const baseRound = {
  id: "round-1",
  userId: "user-1",
  courseId: "course-1",
  teeSetId: null,
  playedOn: new Date("2026-08-30"),
  plannedHoleCount: 18,
  completedHoleCount: 0,
  handicapAtStart: new Prisma.Decimal("14.2"),
  scoringZoneYards: 100,
  status: "IN_PROGRESS" as const,
  dataCompleteness: "FULL" as const,
  methodologyVersion: "1.0.0",
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
};

const hole = (
  holeNumber: number,
  isComplete: boolean,
  overrides: Partial<{
    score: number | null;
    shotsToZone: number | null;
    putts: number | null;
    firstPuttDistance: string | null;
    teeOutcome: string | null;
    teeLie: string | null;
    bunkerShots: number;
    bunkersVisited: number;
    mistakes: string[];
    penaltyStrokes: number;
    approaches: {
      id: string;
      roundHoleId: string;
      sequence: number;
      distanceBand: string;
      result: string;
      missDirection: string | null;
    }[];
  }> = {},
) => ({
  id: `h${holeNumber}`,
  roundId: "round-1",
  holeNumber,
  par: 4,
  yardage: holeNumber === 1 ? 410 : null,
  score: null,
  shotsToZone: null,
  putts: null,
  firstPuttDistance: null,
  teeOutcome: null,
  teeLie: null,
  approaches: [],
  bunkerShots: 0,
  bunkersVisited: 0,
  mistakes: [],
  penaltyStrokes: 0,
  isComplete,
  createdAt: new Date(),
  updatedAt: new Date(),
  version: 1,
  ...overrides,
});

describe("toDomainRoundStatus", () => {
  it("maps the Prisma enum to the domain union", () => {
    expect(toDomainRoundStatus("IN_PROGRESS")).toBe("in-progress");
    expect(toDomainRoundStatus("ABANDONED")).toBe("abandoned");
  });
});

describe("toActiveRound", () => {
  it("resumes at the first incomplete hole and counts completed holes", () => {
    const active = toActiveRound({
      ...baseRound,
      snapshot: {
        id: "s1",
        roundId: "round-1",
        courseName: "East Herts",
        teeName: "White",
      },
      holes: [hole(1, true), hole(2, true), hole(3, false), hole(4, false)],
    });

    expect(active).toMatchObject({
      courseName: "East Herts",
      teeName: "White",
      completedHoleCount: 2,
      resumeHoleNumber: 3,
    });
  });

  it("falls back to plannedHoleCount when every hole is done", () => {
    const active = toActiveRound({
      ...baseRound,
      plannedHoleCount: 2,
      snapshot: null,
      holes: [hole(1, true), hole(2, true)],
    });
    expect(active.resumeHoleNumber).toBe(2);
    expect(active.courseName).toBe("Round");
  });
});

describe("toPlayableRound", () => {
  it("sorts holes, keeps yardage snapshots and converts the handicap", () => {
    const playable = toPlayableRound({
      ...baseRound,
      snapshot: {
        id: "s1",
        roundId: "round-1",
        courseName: "East Herts",
        teeName: null,
      },
      holes: [hole(2, false), hole(1, false)],
    });

    expect(playable.handicapAtStart).toBe(14.2);
    expect(playable.holes.map((h) => h.holeNumber)).toEqual([1, 2]);
    expect(playable.holes[0]?.yardage).toBe(410);
    expect(playable.teeName).toBeNull();
  });

  it("carries recorded hole values and completedHoleCount", () => {
    const playable = toPlayableRound({
      ...baseRound,
      snapshot: null,
      holes: [
        hole(1, true, {
          score: 5,
          shotsToZone: 2,
          putts: 2,
          firstPuttDistance: "15-30ft",
          penaltyStrokes: 1,
        }),
        hole(2, false),
      ],
    });

    expect(playable.completedHoleCount).toBe(1);
    expect(playable.holes[0]).toMatchObject({
      score: 5,
      shotsToZone: 2,
      putts: 2,
      firstPuttDistance: "15-30ft",
      penaltyStrokes: 1,
    });
  });

  it("drops an unrecognised first-putt band", () => {
    const playable = toPlayableRound({
      ...baseRound,
      snapshot: null,
      holes: [hole(1, true, { putts: 1, firstPuttDistance: "garbage" })],
    });
    expect(playable.holes[0]?.firstPuttDistance).toBeNull();
  });

  it("maps approach rows in sequence order and re-numbers them", () => {
    const playable = toPlayableRound({
      ...baseRound,
      snapshot: null,
      holes: [
        hole(1, true, {
          approaches: [
            {
              id: "a2",
              roundHoleId: "h1",
              sequence: 2,
              distanceBand: "125-149",
              result: "missed-zone",
              missDirection: "left",
            },
            {
              id: "a1",
              roundHoleId: "h1",
              sequence: 1,
              distanceBand: "175-199",
              result: "green",
              missDirection: null,
            },
          ],
        }),
      ],
    });
    expect(playable.holes[0]?.approaches).toEqual([
      {
        sequence: 1,
        distanceBand: "175-199",
        result: "green",
        missDirection: null,
      },
      {
        sequence: 2,
        distanceBand: "125-149",
        result: "missed-zone",
        missDirection: "left",
      },
    ]);
  });

  it("carries bunker counts and filters unrecognised mistake tags", () => {
    const playable = toPlayableRound({
      ...baseRound,
      snapshot: null,
      holes: [
        hole(1, true, {
          bunkerShots: 3,
          bunkersVisited: 1,
          mistakes: ["strategy", "not-real", "putting"],
        }),
      ],
    });
    expect(playable.holes[0]).toMatchObject({
      bunkerShots: 3,
      bunkersVisited: 1,
      mistakes: ["strategy", "putting"],
    });
  });

  it("carries tee outcome and lie, and nulls unrecognised values", () => {
    const playable = toPlayableRound({
      ...baseRound,
      snapshot: null,
      holes: [
        hole(1, true, { teeOutcome: "recovery-required", teeLie: "rough" }),
        hole(2, false, { teeOutcome: "garbage", teeLie: null }),
      ],
    });
    expect(playable.holes[0]).toMatchObject({
      teeOutcome: "recovery-required",
      teeLie: "rough",
    });
    expect(playable.holes[1]).toMatchObject({ teeOutcome: null, teeLie: null });
  });
});
