import { startRoundInputSchema } from "./schema";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("startRoundInputSchema", () => {
  it("accepts a course with no tee and no handicap", () => {
    const result = startRoundInputSchema.safeParse({
      courseId: uuid,
      teeSetId: null,
      handicapAtStart: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a tee and a handicap", () => {
    const result = startRoundInputSchema.safeParse({
      courseId: uuid,
      teeSetId: "22222222-2222-4222-8222-222222222222",
      handicapAtStart: 12.4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing / non-uuid course", () => {
    expect(
      startRoundInputSchema.safeParse({
        courseId: "not-a-uuid",
        teeSetId: null,
        handicapAtStart: null,
      }).success,
    ).toBe(false);
  });

  it("rejects an out-of-range handicap", () => {
    expect(
      startRoundInputSchema.safeParse({
        courseId: uuid,
        teeSetId: null,
        handicapAtStart: 80,
      }).success,
    ).toBe(false);
  });
});
