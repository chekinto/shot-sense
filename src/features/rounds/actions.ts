"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { parseHandicap } from "@/features/auth/schema";
import { courseRepository } from "@/infrastructure/prisma/repositories/courseRepository";
import { roundRepository } from "@/infrastructure/prisma/repositories/roundRepository";
import { startRoundInputSchema } from "./schema";

export interface StartRoundFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const emptyToNull = (value: FormDataEntryValue | null): string | null => {
  const s = typeof value === "string" ? value.trim() : "";
  return s === "" ? null : s;
};

export const startRound = async (
  _prev: StartRoundFormState,
  formData: FormData,
): Promise<StartRoundFormState> => {
  const user = await requireUser();

  const parsed = startRoundInputSchema.safeParse({
    courseId: emptyToNull(formData.get("courseId")),
    teeSetId: emptyToNull(formData.get("teeSetId")),
    handicapAtStart: parseHandicap(formData.get("handicap")),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors };
  }

  const course = await courseRepository.findById(user.id, parsed.data.courseId);
  if (!course) return { fieldErrors: { courseId: "Choose a course" } };

  const tee =
    parsed.data.teeSetId === null
      ? null
      : (course.teeSets.find((t) => t.id === parsed.data.teeSetId) ?? null);
  if (parsed.data.teeSetId !== null && tee === null) {
    return { fieldErrors: { teeSetId: "That tee no longer exists" } };
  }

  const yardageByHole = new Map(
    (tee?.yardages ?? []).map((y) => [y.holeNumber, y.yardage]),
  );

  const roundId = await roundRepository.start({
    userId: user.id,
    courseId: course.id,
    teeSetId: tee?.id ?? null,
    handicapAtStart: parsed.data.handicapAtStart,
    playedOn: new Date(),
    plannedHoleCount: course.holeCount,
    snapshot: { courseName: course.name, teeName: tee?.name ?? null },
    holes: course.holes.map((hole) => ({
      holeNumber: hole.holeNumber,
      par: hole.par,
      yardage: yardageByHole.get(hole.holeNumber) ?? null,
    })),
  });

  revalidatePath("/dashboard");
  redirect(`/rounds/${roundId}/play`);
};
