"use client";

import { useState, useTransition } from "react";
import {
  Button,
  InlineNotice,
  SegmentedControl,
  Stepper,
} from "@/components/ui";
import {
  FIRST_PUTT_DISTANCE_BANDS,
  calculateShotsFromZone,
  validateCompletedHole,
  type FirstPuttDistanceBand,
} from "@/domain/scoring";
import { completeHole, reopenHole } from "../recordActions";
import type { HolePatch, PlayHole } from "../types";
import styles from "./HoleForm.module.css";

const FIRST_PUTT_LABELS: Record<FirstPuttDistanceBand, string> = {
  "under-5ft": "< 5 ft",
  "5-15ft": "5–15  ft",
  "15-30ft": "15–30  ft",
  "30-50ft": "30–50  ft",
  "50ft-plus": "50+ ft",
};

interface HoleFormProps {
  roundId: string;
  hole: PlayHole;
  scoringZoneYards: number;
  isLastPlannedHole: boolean;
  onPatch: (patch: HolePatch) => void;
  onFlush: () => Promise<void>;
  onCompleted: (nextHole: number | null) => void;
  onHoleUpdated: (hole: PlayHole) => void;
}

export const HoleForm = ({
  roundId,
  hole,
  scoringZoneYards,
  isLastPlannedHole,
  onPatch,
  onFlush,
  onCompleted,
  onHoleUpdated,
}: HoleFormProps) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [showPenalty, setShowPenalty] = useState(hole.penaltyStrokes > 0);
  const [pending, startTransition] = useTransition();

  const shotsFromZone =
    hole.score !== null &&
    hole.shotsToZone !== null &&
    hole.shotsToZone <= hole.score
      ? calculateShotsFromZone({
          score: hole.score,
          shotsToZone: hole.shotsToZone,
        })
      : null;

  const maybeStartsInZone =
    hole.yardage !== null && hole.yardage <= scoringZoneYards;

  const save = () => {
    setErrors([]);
    const check = validateCompletedHole({
      holeNumber: hole.holeNumber,
      par: hole.par,
      score: hole.score ?? undefined,
      shotsToZone: hole.shotsToZone ?? undefined,
      putts: hole.putts ?? undefined,
      firstPuttDistance: hole.firstPuttDistance ?? undefined,
      penaltyStrokes: hole.penaltyStrokes,
    });
    if (!check.ok) {
      setErrors(check.errors.map((e) => e.message));
      return;
    }

    startTransition(async () => {
      await onFlush();
      const result = await completeHole({
        roundId,
        holeNumber: hole.holeNumber,
        par: hole.par,
        score: hole.score,
        shotsToZone: hole.shotsToZone,
        putts: hole.putts,
        firstPuttDistance: hole.firstPuttDistance,
        penaltyStrokes: hole.penaltyStrokes,
      });
      if (!result.ok) {
        setErrors(result.errors.map((e) => e.message));
        return;
      }
      onCompleted(isLastPlannedHole ? null : hole.holeNumber + 1);
    });
  };

  if (hole.isComplete) {
    return (
      <div className={styles.done}>
        <p className={styles.doneSummary}>
          Score {hole.score} · to zone {hole.shotsToZone} · from zone{" "}
          {shotsFromZone} · {hole.putts} putt{hole.putts === 1 ? "" : "s"}
          {hole.penaltyStrokes > 0
            ? ` · ${hole.penaltyStrokes} penalty`
            : ""}
        </p>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await reopenHole({ roundId, holeNumber: hole.holeNumber });
              onHoleUpdated({ ...hole, isComplete: false });
            })
          }
        >
          Edit hole
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      {errors.length > 0 ? (
        <InlineNotice tone="error">{errors[0]}</InlineNotice>
      ) : null}

      <Stepper
        label="Score"
        value={hole.score}
        min={1}
        max={15}
        placeholder="Tap +"
        onChange={(score) => onPatch({ score })}
      />

      <Stepper
        label={`Shots to reach inside ${scoringZoneYards} yds`}
        value={hole.shotsToZone}
        min={0}
        max={hole.score ?? 10}
        placeholder="—"
        hint={
          maybeStartsInZone
            ? "The green always counts. This hole may start inside the zone — 0 is valid."
            : "The green always counts as inside the zone."
        }
        onChange={(shotsToZone) => onPatch({ shotsToZone })}
      />

      <p className={styles.derived}>
        Shots from zone:{" "}
        <strong>{shotsFromZone ?? "—"}</strong>
        <span className={styles.derivedNote}> (includes putts)</span>
      </p>

      <Stepper
        label="Putts"
        value={hole.putts}
        min={0}
        max={8}
        placeholder="—"
        onChange={(putts) =>
          onPatch(
            putts === 0
              ? { putts, firstPuttDistance: null }
              : { putts },
          )
        }
      />

      {hole.putts !== null && hole.putts > 0 ? (
        <SegmentedControl<FirstPuttDistanceBand>
          label="First putt distance"
          options={FIRST_PUTT_DISTANCE_BANDS.map((band) => ({
            label: FIRST_PUTT_LABELS[band],
            value: band,
          }))}
          value={hole.firstPuttDistance}
          onChange={(firstPuttDistance) => onPatch({ firstPuttDistance })}
          size="sm"
        />
      ) : null}

      {showPenalty ? (
        <Stepper
          label="Penalty strokes"
          value={hole.penaltyStrokes}
          min={0}
          max={6}
          onChange={(penaltyStrokes) => onPatch({ penaltyStrokes })}
        />
      ) : (
        <button
          type="button"
          className={styles.addEvent}
          onClick={() => setShowPenalty(true)}
        >
          + Penalty
        </button>
      )}

      <Button fullWidth disabled={pending} onClick={save}>
        {pending
          ? "Saving…"
          : isLastPlannedHole
            ? "Save hole"
            : "Save & next hole"}
      </Button>
    </div>
  );
};
