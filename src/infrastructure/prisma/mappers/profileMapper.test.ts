import { Prisma, type Profile as PrismaProfile } from "@prisma/client";
import { toProfile } from "./profileMapper";

const row = (overrides: Partial<PrismaProfile> = {}): PrismaProfile => ({
  userId: "00000000-0000-0000-0000-000000000001",
  handicap: new Prisma.Decimal("12.4"),
  defaultScoringZoneYards: 100,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
  ...overrides,
});

describe("toProfile", () => {
  it("converts a Decimal handicap to a plain number", () => {
    expect(toProfile(row()).handicap).toBe(12.4);
  });

  it("keeps a null handicap null", () => {
    expect(toProfile(row({ handicap: null })).handicap).toBeNull();
  });

  it("passes through the fixed scoring zone", () => {
    expect(toProfile(row()).defaultScoringZoneYards).toBe(100);
  });
});
