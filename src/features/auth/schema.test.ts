import { credentialsSchema, handicapSchema, parseHandicap } from "./schema";

describe("credentialsSchema", () => {
  it("accepts a valid email and 8+ char password", () => {
    const result = credentialsSchema.safeParse({
      email: "  Player@example.com ",
      password: "hunter2!!",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("Player@example.com");
  });

  it.each([
    ["bad email", { email: "nope", password: "longenough" }, "email"],
    ["short password", { email: "a@b.com", password: "short" }, "password"],
    ["empty email", { email: "", password: "longenough" }, "email"],
  ])("rejects %s", (_label, input, field) => {
    const result = credentialsSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === field)).toBe(true);
    }
  });
});

describe("handicapSchema", () => {
  it.each([0, -4.2, 14.2, 54, -10])("accepts %p", (value) => {
    expect(handicapSchema.safeParse(value).success).toBe(true);
  });

  it.each([55, -11, 12.25])("rejects %p", (value) => {
    expect(handicapSchema.safeParse(value).success).toBe(false);
  });
});

describe("parseHandicap", () => {
  it("returns null for empty input", () => {
    expect(parseHandicap("")).toBeNull();
    expect(parseHandicap(null)).toBeNull();
    expect(parseHandicap("   ")).toBeNull();
  });

  it("rounds to one decimal place", () => {
    expect(parseHandicap("14.24")).toBe(14.2);
    expect(parseHandicap("14.26")).toBe(14.3);
  });

  it("returns NaN for non-numeric input", () => {
    expect(Number.isNaN(parseHandicap("abc") as number)).toBe(true);
  });
});
