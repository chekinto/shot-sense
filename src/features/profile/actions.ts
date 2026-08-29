"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import { handicapSchema, parseHandicap } from "@/features/auth/schema";
import { profileRepository } from "@/infrastructure/prisma/repositories/profileRepository";

export interface HandicapFormState {
  error?: string;
}

export const saveHandicap = async (
  _prev: HandicapFormState,
  formData: FormData,
): Promise<HandicapFormState> => {
  const user = await requireUser();

  const value = parseHandicap(formData.get("handicap"));
  if (value === null) {
    return { error: "Enter your handicap, or skip for now." };
  }

  const parsed = handicapSchema.safeParse(value);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid handicap" };
  }

  await profileRepository.updateHandicap(user.id, parsed.data);
  redirect("/dashboard");
};
