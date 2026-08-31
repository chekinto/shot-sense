import {
  MISS_DIRECTIONS,
  MISTAKE_CATEGORIES,
  type ApproachBandBreakdown,
  type CategoryPriority,
  type FaultSummary,
  type HoleResult,
  type ScoringCategory,
  type SectionSummary,
  type TeeContext,
} from "@/domain/scoring";

export const toParLabel = (toPar: number): string =>
  toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : `${toPar}`;

const RESULT_LABELS: Record<HoleResult, [singular: string, plural: string]> = {
  "eagle-or-better": ["eagle+", "eagles+"],
  birdie: ["birdie", "birdies"],
  par: ["par", "pars"],
  bogey: ["bogey", "bogeys"],
  "double-bogey": ["double", "doubles"],
  "triple-bogey-plus": ["triple+", "triples+"],
};

const RESULT_ORDER: HoleResult[] = [
  "eagle-or-better",
  "birdie",
  "par",
  "bogey",
  "double-bogey",
  "triple-bogey-plus",
];

/** "1 birdie · 6 par · 2 bogey" — non-zero buckets only. */
export const resultBreakdown = (results: SectionSummary["results"]): string =>
  RESULT_ORDER.filter((key) => results[key] > 0)
    .map((key) => {
      const count = results[key];
      const [singular, plural] = RESULT_LABELS[key];
      return `${count} ${count === 1 ? singular : plural}`;
    })
    .join(" · ");

const TEE_OUTCOME_ORDER: [keyof TeeContext["outcomes"], string][] = [
  ["clear", "clear"],
  ["compromised", "compromised"],
  ["recovery-required", "needed a recovery"],
  ["penalty", "penalty"],
];

/** "9 clear · 2 compromised · 1 penalty" — non-zero outcomes only. */
export const teeOutcomeBreakdown = (tee: TeeContext): string =>
  TEE_OUTCOME_ORDER.filter(([key]) => tee.outcomes[key] > 0)
    .map(([key, label]) => `${tee.outcomes[key]} ${label}`)
    .join(" · ");

/** "2 right · 1 short" — miss directions, non-zero only, in a fixed order. */
export const missBreakdown = (misses: ApproachBandBreakdown["misses"]): string =>
  MISS_DIRECTIONS.filter((direction) => misses[direction] > 0)
    .map((direction) => `${misses[direction]} ${direction}`)
    .join(" · ");

const MISTAKE_WORDS: Record<string, string> = {
  tee: "tee",
  approach: "approach",
  "short-game": "short game",
  putting: "putting",
  strategy: "strategy",
  recovery: "recovery",
  other: "other",
};

/** "2 strategy · 1 approach" — flagged mistake categories, most-frequent first. */
export const mistakeBreakdown = (
  counts: FaultSummary["mistakeCounts"],
): string =>
  MISTAKE_CATEGORIES.filter((category) => counts[category] > 0)
    .sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
    .map((category) => `${counts[category]} ${MISTAKE_WORDS[category] ?? category}`)
    .join(" · ");

const CATEGORY_LABELS: Record<ScoringCategory, string> = {
  tee: "tee game",
  approach: "approach play",
  "short-game": "short game",
  putting: "putting",
  strategy: "course strategy",
  recovery: "recovery play",
  other: "other",
};

export const categoryLabel = (category: ScoringCategory): string =>
  CATEGORY_LABELS[category];

/** "your short game leaked the most — about 4 shots across 5 holes" */
export const biggestLeakLine = (top: CategoryPriority): string => {
  const shots = `${top.severity} shot${top.severity === 1 ? "" : "s"}`;
  const holes = `${top.frequency} hole${top.frequency === 1 ? "" : "s"}`;
  return `your ${categoryLabel(top.category)} leaked the most — about ${shots} across ${holes}`;
};
