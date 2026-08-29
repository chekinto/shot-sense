import { courseInputSchema, teeSetInputSchema } from "./schema";

const par18 = Array.from({ length: 18 }, () => 4);

describe("courseInputSchema", () => {
  it("accepts a well-formed 18-hole course", () => {
    const result = courseInputSchema.safeParse({
      name: "  East Herts  ",
      holeCount: 18,
      pars: par18,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("East Herts");
  });

  it("requires a par for every hole", () => {
    const result = courseInputSchema.safeParse({
      name: "Short",
      holeCount: 18,
      pars: par18.slice(0, 17),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "pars")).toBe(true);
    }
  });

  it.each([2, 7])("rejects an out-of-range par (%i)", (bad) => {
    const pars = [...par18];
    pars[5] = bad;
    expect(courseInputSchema.safeParse({ name: "X", holeCount: 18, pars }).success).toBe(
      false,
    );
  });

  it("rejects a hole count that isn't 9 or 18", () => {
    expect(
      courseInputSchema.safeParse({ name: "X", holeCount: 12, pars: par18 }).success,
    ).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(
      courseInputSchema.safeParse({ name: "  ", holeCount: 9, pars: par18.slice(0, 9) })
        .success,
    ).toBe(false);
  });
});

describe("teeSetInputSchema", () => {
  it("accepts a named tee with sparse yardages", () => {
    const result = teeSetInputSchema.safeParse({
      name: "White",
      yardages: [
        { holeNumber: 1, yardage: 380 },
        { holeNumber: 2, yardage: null },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range yardage", () => {
    expect(
      teeSetInputSchema.safeParse({
        name: "White",
        yardages: [{ holeNumber: 1, yardage: 5 }],
      }).success,
    ).toBe(false);
  });

  it("requires a tee name", () => {
    expect(teeSetInputSchema.safeParse({ name: "", yardages: [] }).success).toBe(false);
  });
});
