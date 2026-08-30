import { z } from "zod";
import { handicapSchema } from "@/features/auth/schema";

/** Payload for starting a round (§115). */
export const startRoundInputSchema = z.object({
  courseId: z.string().uuid("Choose a course"),
  /** `null` = play without a tee (yardages unknown). */
  teeSetId: z.string().uuid().nullable(),
  /** Confirmed handicap for this round; `null` if the golfer has none. */
  handicapAtStart: handicapSchema.nullable(),
});

export type StartRoundInput = z.infer<typeof startRoundInputSchema>;
