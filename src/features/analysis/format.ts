import type { HoleResult, SectionSummary, TeeContext } from "@/domain/scoring";

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
