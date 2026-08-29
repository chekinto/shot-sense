/**
 * Application profile — plain shape used by feature and UI code. Framework- and
 * Prisma-independent; the Prisma row is converted at the mapper boundary.
 */
export interface Profile {
  userId: string;
  /** Playing handicap, e.g. 12.4. `null` until onboarding is complete. */
  handicap: number | null;
  /** Fixed at 100 in V1. */
  defaultScoringZoneYards: number;
  createdAt: Date;
  updatedAt: Date;
}

export const hasCompletedOnboarding = (profile: Profile): boolean =>
  profile.handicap !== null;
