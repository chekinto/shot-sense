"use client";

import type { PlayHole } from "../types";
import styles from "./Scorecard.module.css";

interface ScorecardProps {
  holes: PlayHole[];
  currentHole: number;
  onJump: (holeNumber: number) => void;
}

export const Scorecard = ({ holes, currentHole, onJump }: ScorecardProps) => (
  <nav className={styles.strip} aria-label="Holes">
    {holes.map((hole) => {
      const state = hole.isComplete
        ? "done"
        : hole.holeNumber === currentHole
          ? "current"
          : "todo";
      return (
        <button
          key={hole.holeNumber}
          type="button"
          className={`${styles.chip} ${styles[state]}`}
          aria-current={hole.holeNumber === currentHole ? "true" : undefined}
          onClick={() => onJump(hole.holeNumber)}
        >
          <span className={styles.no}>{hole.holeNumber}</span>
          <span className={styles.val}>
            {hole.isComplete && hole.score !== null ? hole.score : hole.par}
          </span>
        </button>
      );
    })}
  </nav>
);
