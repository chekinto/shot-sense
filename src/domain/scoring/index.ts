/**
 * Public entry point for the deterministic scoring engine.
 *
 * This package is framework-free: it must not import from `react`, `next`,
 * `@prisma/client`, `@supabase/*`, `dexie`, or any other `src/` layer, and must
 * not touch `window` / `document` / Node built-ins. Time is always passed in.
 * See src/ARCHITECTURE.md.
 */

// ---- Models ----
export {
  METHODOLOGY_VERSION,
  SCORING_ZONE_YARDS,
  APPROACH_BAND_MIN_SAMPLE,
  type MethodologyVersion,
  type ScoringZoneYards,
} from "./models/methodology";
export * from "./models/enums";
export {
  type ApproachAttempt,
  type RawApproachInput,
  isSuccessfulApproach,
  isFailedApproach,
  isIntentionalLayup,
  toApproachAttempt,
} from "./models/approach";
export {
  type ScoringHoleIdentity,
  type PickUpState,
  type IncompleteScoringHole,
  type CompletedScoringHole,
  type ScoringHole,
  type RawHoleInput,
  isCompletedHole,
} from "./models/hole";
export {
  type CompletedRound,
  FRONT_NINE_HOLES,
  BACK_NINE_HOLES,
  isFrontNine,
  isBackNine,
} from "./models/round";

// ---- Calculations ----
export {
  calculateScoreToPar,
  classifyHoleResult,
  emptyHoleResultTally,
} from "./calculations/scoreToPar";
export { calculateShotsFromZone } from "./calculations/shotsFromZone";
export {
  calculatePuttingShotsToGetBack,
  calculatePenaltyShotsToGetBack,
  calculateBunkerShotsToGetBack,
  calculateHoleShotsToGetBack,
  type HoleShotsToGetBack,
} from "./calculations/shotsToGetBack";
export {
  calculateRoundShotsToGetBack,
  type RoundShotsToGetBack,
} from "./calculations/roundShotsToGetBack";
export {
  regulationShotsToZone,
  enteredZoneInRegulation,
  gotDownInThree,
  calculateHoleBenchmark,
  calculateBenchmarkScorecard,
  type HoleBenchmark,
  type BenchmarkScorecard,
} from "./calculations/benchmark";
export {
  calculateApproachSuccess,
  type ApproachSuccess,
} from "./calculations/approachSuccess";
export {
  calculateApproachBands,
  type ApproachBandBreakdown,
  type ApproachBandRow,
} from "./calculations/approachBands";
export { calculateFaults, type FaultSummary } from "./calculations/faults";
export {
  calculateTeeContext,
  type TeeContext,
} from "./calculations/teeContext";
export {
  calculateRoundSummary,
  type RoundSummary,
  type SectionSummary,
} from "./calculations/roundSummary";

// ---- Validation ----
export {
  validateCompletedHole,
  assertCompletedHole,
  type HoleValidationError,
  type HoleValidationResult,
} from "./validation/completedHole";

// ---- Recommendations ----
export {
  calculateCategoryPriority,
  type ScoringCategory,
  type CategoryPriority,
  type CategoryPriorityAnalysis,
} from "./recommendations/categoryPriority";

// ---- Analysis ----
export { analyseRound, type RoundAnalysis } from "./analysis/analyseRound";
export {
  generateRoundObservations,
  OBSERVATION_LIMIT,
  type RoundObservation,
} from "./analysis/observations";
