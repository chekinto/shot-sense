"use client";

import { MISTAKE_CATEGORIES, type MistakeCategory } from "@/domain/scoring";
import styles from "./MistakeTags.module.css";

const LABELS: Record<MistakeCategory, string> = {
  tee: "Tee",
  approach: "Approach",
  "short-game": "Short game",
  putting: "Putting",
  strategy: "Strategy",
  recovery: "Recovery",
  other: "Other",
};

interface MistakeTagsProps {
  value: MistakeCategory[];
  onChange: (value: MistakeCategory[]) => void;
}

/**
 * §40 — broad mistake categories, multi-select. Detailed reasons are a future
 * feature (§41); this is deliberately just the seven buckets.
 */
export const MistakeTags = ({ value, onChange }: MistakeTagsProps) => {
  const toggle = (category: MistakeCategory) => {
    onChange(
      value.includes(category)
        ? value.filter((c) => c !== category)
        : [...value, category],
    );
  };

  return (
    <div role="group" aria-label="Mistakes" className={styles.chips}>
      {MISTAKE_CATEGORIES.map((category) => {
        const selected = value.includes(category);
        return (
          <button
            key={category}
            type="button"
            aria-pressed={selected}
            className={`${styles.chip} ${selected ? styles.selected : ""}`}
            onClick={() => toggle(category)}
          >
            {LABELS[category]}
          </button>
        );
      })}
    </div>
  );
};
