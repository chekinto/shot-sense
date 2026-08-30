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
import type { CompleteHoleValues, HolePatch, PlayHole } from "../types";
import styles from "./HoleForm.module.css";

const FIRST_PUTT_LABELS: Record<FirstPuttDistanceBand, string> = {
  "under-5ft": "< 5 ft",
  "5-15ft": "5–15 ft",
  "15-30ft": "15–30 ft",
  "30-50ft": "30–50 ft",
  "50ft-plus": "50+ ft",
};

interface HoleFormProps {
  hole: PlayHole;
  scoringZoneYards: number;
  isLastPlannedHole: boolean;
  hasPrevious: boolean;
  onPatch: (patch: HolePatch) => void;
  onFlush: () => Promise<void>;
  onComplete: (holeNumber: number, values: CompleteHoleValues) => Promise<unknown>;
  onPrevious: () => void;
  onCompleted: (nextHole: number | null) => void;
}

export const HoleForm = ({
  hole,
  scoringZoneYards,
  isLastPlannedHole,
  hasPrevious,
  onPatch,
  onFlush,
  onComplete,
  onPrevious,
  onCompleted,
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
      try {
        await onComplete(hole.holeNumber, {
          score: hole.score,
          shotsToZone: hole.shotsToZone,
          putts: hole.putts,
          firstPuttDistance: hole.firstPuttDistance,
          penaltyStrokes: hole.penaltyStrokes,
        });
      } catch {
        setErrors(["Couldn't save that hole — try again."]);
        return;
      }
      onCompleted(isLastPlannedHole ? null : hole.holeNumber + 1);
    });
  };

  // "Next" carries the save: an unrecorded hole is validated + completed before
  // advancing; an already-recorded hole (autosave has it) just moves on.
  const goNext = () => {
    if (hole.isComplete) {
      void onFlush();
      onCompleted(isLastPlannedHole ? null : hole.holeNumber + 1);
      return;
    }
    save();
  };

  const nextLabel = pending
    ? "Saving…"
    : hole.isComplete
      ? "Next →"
      : isLastPlannedHole
        ? "Save hole"
        : "Save & next →";

  const hideNext = isLastPlannedHole && hole.isComplete;

  return (
    <div className={styles.form}>
      {hole.isComplete ? (
        <p className={styles.recorded}>✓ Recorded — edits save automatically</p>
      ) : null}

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
        Shots from zone: <strong>{shotsFromZone ?? "—"}</strong>
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
            putts === 0 ? { putts, firstPuttDistance: null } : { putts },
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

      <div className={styles.nav}>
        <Button
          variant="secondary"
          disabled={!hasPrevious || pending}
          onClick={onPrevious}
        >
          ← Previous
        </Button>
        {hideNext ? null : (
          <Button disabled={pending} onClick={goNext}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
