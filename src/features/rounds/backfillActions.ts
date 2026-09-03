"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/features/auth/session";
import { parseHandicap } from "@/features/auth/schema";
import {
  roundRepository,
  RoundNotEditableError,
} from "@/infrastructure/prisma/repositories/roundRepository";
import { backfillRoundSchema } from "./backfillSchema";

export interface BackfillFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const parseHoles = (raw: FormDataEntryValue | null): unknown => {
  if (typeof raw !== "string") return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const parse = (formData: FormData) =>
  backfillRoundSchema.safeParse({
    courseName: String(formData.get("courseName") ?? "").trim(),
    playedOn: String(formData.get("playedOn") ?? ""),
    handicapAtStart: parseHandicap(formData.get("handicap")),
    holes: parseHoles(formData.get("holes")),
  });

const collectErrors = (
  issues: readonly { path: PropertyKey[]; message: string }[],
): BackfillFormState => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key =
      issue.path.length > 0 ? issue.path.map(String).join(".") : "form";
    fieldErrors[key] ??= issue.message;
  }
  return { fieldErrors };
};

export const createBackfillRound = async (
  _prev: BackfillFormState,
  formData: FormData,
): Promise<BackfillFormState> => {
  const user = await requireUser();
  const parsed = parse(formData);
  if (!parsed.success) return collectErrors(parsed.error.issues);

  const roundId = await roundRepository.createCoarse({
    userId: user.id,
    courseName: parsed.data.courseName,
    playedOn: new Date(parsed.data.playedOn),
    handicapAtStart: parsed.data.handicapAtStart,
    holes: parsed.data.holes,
  });

  revalidatePath("/rounds");
  revalidatePath("/dashboard");
  redirect(`/rounds/${roundId}/summary`);
};

export const updateBackfillRound = async (
  _prev: BackfillFormState,
  formData: FormData,
): Promise<BackfillFormState> => {
  const user = await requireUser();
  const roundId = String(formData.get("roundId") ?? "");
  const parsed = parse(formData);
  if (!parsed.success) return collectErrors(parsed.error.issues);

  try {
    await roundRepository.updateCoarse(user.id, roundId, {
      courseName: parsed.data.courseName,
      playedOn: new Date(parsed.data.playedOn),
      handicapAtStart: parsed.data.handicapAtStart,
      holes: parsed.data.holes,
    });
  } catch (error) {
    if (error instanceof RoundNotEditableError) {
      return { error: "That round can no longer be edited." };
    }
    throw error;
  }

  revalidatePath("/rounds");
  revalidatePath(`/rounds/${roundId}/summary`);
  redirect(`/rounds/${roundId}/summary`);
};

export const deleteCompletedRound = async (formData: FormData): Promise<void> => {
  const user = await requireUser();
  const roundId = String(formData.get("roundId") ?? "");
  await roundRepository.deleteById(user.id, roundId).catch(() => {
    // Already gone, or not the user's — nothing to do.
  });
  revalidatePath("/rounds");
  revalidatePath("/dashboard");
  redirect("/rounds");
};
