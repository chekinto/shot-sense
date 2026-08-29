import { z } from "zod";

/** Shared credential rules — reused by the sign-in and sign-up forms/actions. */
export const credentialsSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Handicap index. World Handicap System runs roughly -10.0 to 54.0; we accept a
 * little slack and one decimal place. Empty is allowed at the schema level so
 * the same rule can back an optional Settings field — onboarding enforces
 * presence itself.
 */
export const handicapSchema = z
  .number({ error: "Enter your handicap as a number" })
  .min(-10, "Handicap seems too low")
  .max(54, "Handicap seems too high")
  .multipleOf(0.1, "Use at most one decimal place");

export const parseHandicap = (raw: FormDataEntryValue | null): number | null => {
  if (raw === null || String(raw).trim() === "") return null;
  const value = Number(String(raw).trim());
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : NaN;
};
