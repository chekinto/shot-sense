import { z } from "zod";

export const HOLE_COUNTS = [9, 18] as const;
export type HoleCount = (typeof HOLE_COUNTS)[number];

export const PAR_MIN = 3;
export const PAR_MAX = 6;
/** Quick-select par values offered in the UI (§114). */
export const PAR_CHOICES = [3, 4, 5, 6] as const;

export const YARDAGE_MIN = 30;
export const YARDAGE_MAX = 700;

const parSchema = z
  .number({ error: "Pick a par" })
  .int()
  .min(PAR_MIN, `Par must be ${PAR_MIN}–${PAR_MAX}`)
  .max(PAR_MAX, `Par must be ${PAR_MIN}–${PAR_MAX}`);

const holeCountSchema = z.union([z.literal(9), z.literal(18)], {
  error: "Choose 9 or 18 holes",
});

/** Create/update payload for a course's identity + pars. */
export const courseInputSchema = z
  .object({
    name: z.string().trim().min(1, "Name your course").max(120, "Name is too long"),
    holeCount: holeCountSchema,
    pars: z.array(parSchema),
  })
  .refine((value) => value.pars.length === value.holeCount, {
    error: "Enter a par for every hole",
    path: ["pars"],
  });

export type CourseInput = z.infer<typeof courseInputSchema>;

/** One hole's yardage in a tee set. `null` = not recorded. */
const yardageEntrySchema = z.object({
  holeNumber: z.number().int().min(1).max(18),
  yardage: z
    .number()
    .int()
    .min(YARDAGE_MIN, `Yardage must be ${YARDAGE_MIN}–${YARDAGE_MAX}`)
    .max(YARDAGE_MAX, `Yardage must be ${YARDAGE_MIN}–${YARDAGE_MAX}`)
    .nullable(),
});

export const teeSetInputSchema = z.object({
  name: z.string().trim().min(1, "Name this tee").max(40, "Name is too long"),
  yardages: z.array(yardageEntrySchema),
});

export type TeeSetInput = z.infer<typeof teeSetInputSchema>;
