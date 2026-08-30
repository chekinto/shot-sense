"use client";

import { useState, useTransition } from "react";
import { Button, InlineNotice } from "@/components/ui";
import { finishRound } from "../recordActions";
import styles from "./FinishRound.module.css";

interface FinishRoundProps {
  roundId: string;
  plannedHoleCount: number;
  completedHoleCount: number;
  onNeedsHole: (holeNumber: number) => void;
}

export const FinishRound = ({
  roundId,
  plannedHoleCount,
  completedHoleCount,
  onNeedsHole,
}: FinishRoundProps) => {
  const [incomplete, setIncomplete] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  const allDone = completedHoleCount >= plannedHoleCount;
  const canFinishNine =
    !allDone && plannedHoleCount === 18 && completedHoleCount >= 9;

  const finish = (holeCount?: number) => {
    setIncomplete([]);
    startTransition(async () => {
      const result = await finishRound({ roundId, holeCount });
      // A successful finish redirects server-side; we only get here on failure.
      if (!result.ok) setIncomplete(result.incompleteHoles);
    });
  };

  return (
    <div className={styles.wrap}>
      {incomplete.length > 0 ? (
        <InlineNotice tone="error">
          {incomplete.length} hole{incomplete.length === 1 ? "" : "s"} still need
          recording:{" "}
          {incomplete.map((n, i) => (
            <button
              key={n}
              type="button"
              className={styles.jump}
              onClick={() => onNeedsHole(n)}
            >
              {n}
              {i < incomplete.length - 1 ? ", " : ""}
            </button>
          ))}
        </InlineNotice>
      ) : null}

      <Button fullWidth disabled={pending} onClick={() => finish()}>
        {pending ? "Finishing…" : `Finish ${plannedHoleCount}-hole round`}
      </Button>

      {canFinishNine ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={pending}
          onClick={() => finish(9)}
        >
          Finish as 9-hole round
        </Button>
      ) : null}
    </div>
  );
};
