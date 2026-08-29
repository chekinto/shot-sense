/**
 * Public entry point for the deterministic scoring engine.
 *
 * This package is framework-free: it must not import from `react`, `next`,
 * `@prisma/client`, `@supabase/*`, `dexie`, or any other `src/` layer, and must
 * not touch `window` / `document` / Node built-ins. Time is always passed in.
 * See src/ARCHITECTURE.md.
 */
export {
  METHODOLOGY_VERSION,
  SCORING_ZONE_YARDS,
  type MethodologyVersion,
  type ScoringZoneYards,
} from "./models/methodology";
