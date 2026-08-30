"use client";

import { useMemo } from "react";
import { InlineNotice } from "@/components/ui";
import type { PlayableRound } from "../types";
import { usePlayRound } from "./usePlayRound";
import { HoleForm } from "./HoleForm";
import { Scorecard } from "./Scorecard";
import { FinishRound } from "./FinishRound";
import styles from "./PlayRound.module.css";

interface PlayRoundProps {
  round: PlayableRound;
  startHole: number;
}

export const PlayRound = ({ round, startHole }: PlayRoundProps) => {
  const ctrl = usePlayRound(round, startHole);
  const holeList = useMemo(
    () => [...ctrl.holes.values()].sort((a, b) => a.holeNumber - b.holeNumber),
    [ctrl.holes],
  );
  const hole = ctrl.holes.get(ctrl.currentHole);

  const runningScore = holeList
    .filter((h) => h.isComplete && h.score !== null)
    .reduce((sum, h) => sum + (h.score ?? 0), 0);
  const runningPar = holeList
    .filter((h) => h.isComplete)
    .reduce((sum, h) => sum + h.par, 0);
  const completedHoleCount = holeList.filter((h) => h.isComplete).length;

  if (!hole) return null;

  const toPar = runningScore - runningPar;
  const isLast = ctrl.currentHole >= round.plannedHoleCount;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.course}>
            {round.courseName}
            {round.teeName ? ` · ${round.teeName}` : ""}
          </p>
          <h1 className={styles.title}>
            Hole {hole.holeNumber}
            <span className={styles.of}> of {round.plannedHoleCount}</span>
          </h1>
          <p className={styles.holeMeta}>
            Par {hole.par}
            {hole.yardage !== null ? ` · ${hole.yardage} yd` : ""}
          </p>
        </div>
        <div className={styles.score}>
          <span className={styles.scoreNum}>{runningScore || "—"}</span>
          {completedHoleCount > 0 ? (
            <span className={styles.scoreToPar}>
              {toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : toPar} thru{" "}
              {completedHoleCount}
            </span>
          ) : null}
        </div>
      </header>

      <Scorecard
        holes={holeList}
        currentHole={ctrl.currentHole}
        onJump={ctrl.goToHole}
      />

      {!ctrl.online ? (
        <InlineNotice tone="info">
          Offline — your round is saved on this device and will sync when you
          reconnect.
        </InlineNotice>
      ) : ctrl.pendingSync > 0 ? (
        <p className={styles.syncNote} aria-live="polite">
          Syncing {ctrl.pendingSync} change{ctrl.pendingSync === 1 ? "" : "s"}…
        </p>
      ) : null}

      <HoleForm
        key={hole.holeNumber}
        hole={hole}
        scoringZoneYards={round.scoringZoneYards}
        isLastPlannedHole={isLast}
        hasPrevious={ctrl.currentHole > 1}
        onPatch={ctrl.patchCurrentHole}
        onFlush={ctrl.flush}
        onComplete={ctrl.completeHole}
        onPrevious={() => ctrl.goToHole(ctrl.currentHole - 1)}
        onCompleted={(next) => {
          // `completeHole` has already written the hole; just advance.
          if (next !== null) ctrl.goToHole(next);
        }}
      />

      {isLast || completedHoleCount >= round.plannedHoleCount ? (
        <FinishRound
          roundId={round.id}
          plannedHoleCount={round.plannedHoleCount}
          completedHoleCount={completedHoleCount}
          online={ctrl.online}
          pendingSync={ctrl.pendingSync}
          onNeedsHole={ctrl.goToHole}
        />
      ) : null}
    </div>
  );
};
