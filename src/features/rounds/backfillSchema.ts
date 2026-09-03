import { z } from "zod";
import { handicapSchema } from "@/features/auth/schema";
import { validateCompletedHole } from "@/domain/scoring";

const coarseHoleSchema = z
  .object({
    holeNumber: z.number().int().min(1).max(18),
    par: z.number().int().min(3).max(6),
    score: z.number().int().min(1).max(15),
    shotsToZone: z.number().int().min(0).max(15),
    putts: z.number().int().min(0).max(8),
    penaltyStrokes: z.number().int().min(0).max(6),
  })
  .refine((h) => h.shotsToZone <= h.score, {
    message: "Shots to the zone can't exceed the score",
    path: ["shotsToZone"],
  })
  .refine((h) => h.putts <= h.score - h.shotsToZone, {
    message: "Putts can't exceed the shots from the zone",
    path: ["putts"],
  })
  .refine(
    (h) =>
      validateCompletedHole({
        holeNumber: h.holeNumber,
        par: h.par,
        score: h.score,
        shotsToZone: h.shotsToZone,
        putts: h.putts,
        firstPuttDistance: h.putts > 0 ? "5-15ft" : undefined,
        penaltyStrokes: h.penaltyStrokes,
      }).ok,
    { message: "Those numbers don't add up for a hole" },
  );

/** A stripped historical round — score / shots-to-zone / putts / penalties only (#9). */
export const backfillRoundSchema = z.object({
  courseName: z.string().trim().min(1, "Name the course").max(120),
  playedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
    .refine((s) => !Number.isNaN(Date.parse(s)), "Pick a valid date")
    .refine((s) => new Date(s) <= new Date(), "That date is in the future"),
  handicapAtStart: handicapSchema.nullable(),
  holes: z
    .array(coarseHoleSchema)
    .refine((h) => h.length === 9 || h.length === 18, "Enter 9 or 18 holes"),
});

export type BackfillRoundInput = z.infer<typeof backfillRoundSchema>;
