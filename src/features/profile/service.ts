import "server-only";
import { cache } from "react";
import { requireUser } from "@/features/auth/session";
import { profileRepository } from "@/infrastructure/prisma/repositories/profileRepository";
import type { Profile } from "./types";

/**
 * The current user's profile, created on first access. Call from Server
 * Components behind protected routes. Memoised per request so the protected
 * layout and its pages share one lookup.
 */
export const getOrCreateProfile = cache(async (): Promise<Profile> => {
  const user = await requireUser();
  return profileRepository.ensure(user.id);
});
