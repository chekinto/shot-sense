import "server-only";
import { prisma } from "../client";
import { toProfile } from "../mappers/profileMapper";
import type { Profile } from "@/features/profile/types";

/**
 * §100 — the profile repository. Every method takes the authenticated user id
 * (resolved from the session in the feature layer, never from client input) and
 * scopes to it. This is the auth-enforcement boundary; RLS is a backstop.
 */
export const profileRepository = {
  async getByUserId(userId: string): Promise<Profile | null> {
    const row = await prisma.profile.findUnique({ where: { userId } });
    return row ? toProfile(row) : null;
  },

  /** Returns the profile, creating an empty one on first call for a new user. */
  async ensure(userId: string): Promise<Profile> {
    const row = await prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return toProfile(row);
  },

  async updateHandicap(
    userId: string,
    handicap: number | null,
  ): Promise<Profile> {
    const row = await prisma.profile.update({
      where: { userId },
      data: { handicap },
    });
    return toProfile(row);
  },
};

export type ProfileRepository = typeof profileRepository;
