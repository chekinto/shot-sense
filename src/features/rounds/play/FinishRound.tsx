"use client";

import { useState, useTransition } from "react";
import { Button, InlineNotice } from "@/components/ui";
import { finishRound } from "../recordActions";
import styles from "./FinishRound.module.css";

interface FinishRoundProps {
  roundId: string;
  plannedHoleCount: number;
  completedHoleCount: number;
  online: boolean;
  pendingSync: number;
  onNeedsHole: (holeNumber: number) => void;
}

export const FinishRound = ({
  roundId,
  plannedHoleCount,
  completedHoleCount,
  online,
  pendingSync,
  onNeedsHole,
}: FinishRoundProps) => {
  const [incomplete, setIncomplete] = useState<number[]>([]);
  const [pending, startTransition] = useTransition();

  const allDone = completedHoleCount >= plannedHoleCount;
  const canFinishNine =
    !allDone && plannedHoleCount === 18 && completedHoleCount >= 9;
  // Finishing needs the server. When the round is complete, also wait for the
  // sync queue so the server has every hole; an incomplete round just comes
  // back with the missing-holes list, so don't gate that on sync.
  const blocked = !online || (allDone && pendingSync > 0);

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

      {blocked ? (
        <InlineNotice tone="info">
          {online
            ? "Syncing your last few changes — hold on."
            : "You're offline. Reconnect to finish the round and see your analysis; nothing is lost until then."}
        </InlineNotice>
      ) : null}

      <Button fullWidth disabled={pending || blocked} onClick={() => finish()}>
        {pending ? "Finishing…" : `Finish ${plannedHoleCount}-hole round`}
      </Button>

      {canFinishNine ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={pending || blocked}
          onClick={() => finish(9)}
        >
          Finish as 9-hole round
        </Button>
      ) : null}
    </div>
  );
};
