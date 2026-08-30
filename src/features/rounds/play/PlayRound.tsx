"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui";
import type { PlayableRound } from "../types";
import { usePlayRound, type SaveState } from "./usePlayRound";
import { HoleForm } from "./HoleForm";
import { Scorecard } from "./Scorecard";
import { FinishRound } from "./FinishRound";
import styles from "./PlayRound.module.css";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed — retrying on next change",
};

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

      <div className={styles.saveState} aria-live="polite">
        {SAVE_LABEL[ctrl.saveState]}
      </div>

      <HoleForm
        key={hole.holeNumber}
        roundId={round.id}
        hole={hole}
        scoringZoneYards={round.scoringZoneYards}
        isLastPlannedHole={isLast}
        onPatch={ctrl.patchCurrentHole}
        onFlush={ctrl.flush}
        onHoleUpdated={ctrl.setHoleLocally}
        onCompleted={(next) => {
          ctrl.setHoleLocally({ ...hole, isComplete: true });
          if (next !== null) ctrl.goToHole(next);
        }}
      />

      <div className={styles.nav}>
        <Button
          variant="secondary"
          disabled={ctrl.currentHole <= 1}
          onClick={() => ctrl.goToHole(ctrl.currentHole - 1)}
        >
          ← Previous
        </Button>
        <Button
          variant="secondary"
          disabled={isLast}
          onClick={() => ctrl.goToHole(ctrl.currentHole + 1)}
        >
          Next →
        </Button>
      </div>

      {isLast || completedHoleCount >= round.plannedHoleCount ? (
        <FinishRound
          roundId={round.id}
          plannedHoleCount={round.plannedHoleCount}
          completedHoleCount={completedHoleCount}
          onNeedsHole={ctrl.goToHole}
        />
      ) : null}
    </div>
  );
};
