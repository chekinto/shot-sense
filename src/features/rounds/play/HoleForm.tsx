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
  TEE_LIES,
  TEE_OUTCOMES,
  calculateShotsFromZone,
  toApproachAttempt,
  validateCompletedHole,
  type FirstPuttDistanceBand,
  type TeeLie,
  type TeeOutcome,
} from "@/domain/scoring";
import type { CompleteHoleValues, HolePatch, PlayApproach, PlayHole } from "../types";
import { ApproachInput } from "./ApproachInput";
import styles from "./HoleForm.module.css";

const toAttempts = (approaches: PlayApproach[]) =>
  approaches.flatMap((approach) => {
    const attempt = toApproachAttempt(approach);
    return attempt ? [attempt] : [];
  });

const FIRST_PUTT_LABELS: Record<FirstPuttDistanceBand, string> = {
  "under-5ft": "< 5 ft",
  "5-15ft": "5–15 ft",
  "15-30ft": "15–30 ft",
  "30-50ft": "30–50 ft",
  "50ft-plus": "50+ ft",
};

const TEE_OUTCOME_LABELS: Record<TeeOutcome, string> = {
  clear: "Clear",
  compromised: "Compromised",
  "recovery-required": "Recovery",
  penalty: "Penalty",
};

const TEE_LIE_LABELS: Record<TeeLie, string> = {
  fairway: "Fairway",
  rough: "Rough",
  bunker: "Bunker",
  "trees-other": "Trees / other",
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
  const [penaltyRevealed, setPenaltyRevealed] = useState(
    hole.penaltyStrokes > 0,
  );
  const [approachRevealed, setApproachRevealed] = useState(
    hole.approaches.length > 0,
  );
  const [pending, startTransition] = useTransition();

  const showApproaches = approachRevealed || hole.approaches.length > 0;
  const incompleteApproach = hole.approaches.some(
    (a) => a.result === "missed-zone" && !a.missDirection,
  );

  // A penalty off the tee always means penalty strokes on the hole, so reveal
  // the stepper (correction #2 — the golfer still assigns them).
  const showPenalty =
    penaltyRevealed ||
    hole.penaltyStrokes > 0 ||
    hole.teeOutcome === "penalty";
  const teePenaltyMismatch =
    hole.teeOutcome === "penalty" && hole.penaltyStrokes === 0;

  const setTeeOutcome = (teeOutcome: TeeOutcome) => {
    if (teeOutcome === "penalty" && hole.penaltyStrokes === 0) {
      onPatch({ teeOutcome, penaltyStrokes: 1 });
    } else {
      onPatch({ teeOutcome });
    }
  };

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
    if (incompleteApproach) {
      setErrors(["Pick a miss direction for each missed approach."]);
      return;
    }
    const check = validateCompletedHole({
      holeNumber: hole.holeNumber,
      par: hole.par,
      score: hole.score ?? undefined,
      shotsToZone: hole.shotsToZone ?? undefined,
      putts: hole.putts ?? undefined,
      firstPuttDistance: hole.firstPuttDistance ?? undefined,
      penaltyStrokes: hole.penaltyStrokes,
      approachAttempts: toAttempts(hole.approaches),
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
          teeOutcome: hole.teeOutcome,
          teeLie: hole.teeLie,
          approaches: hole.approaches,
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

      <SegmentedControl<TeeOutcome>
        label="Off the tee"
        options={TEE_OUTCOMES.map((outcome) => ({
          label: TEE_OUTCOME_LABELS[outcome],
          value: outcome,
        }))}
        value={hole.teeOutcome}
        onChange={setTeeOutcome}
        size="sm"
      />

      <SegmentedControl<TeeLie>
        label="Tee shot ended up"
        options={TEE_LIES.map((lie) => ({
          label: TEE_LIE_LABELS[lie],
          value: lie,
        }))}
        value={hole.teeLie}
        onChange={(teeLie) => onPatch({ teeLie })}
        size="sm"
      />

      {teePenaltyMismatch ? (
        <InlineNotice tone="info">
          Tee shot marked as a penalty but the hole has no penalty strokes yet —
          add them below.
        </InlineNotice>
      ) : null}

      {showApproaches ? (
        <div>
          <span className={styles.approachLabel}>Approach play</span>
          <ApproachInput
            approaches={hole.approaches}
            onChange={(approaches) => onPatch({ approaches })}
          />
        </div>
      ) : (
        <button
          type="button"
          className={styles.addEvent}
          onClick={() => {
            setApproachRevealed(true);
            onPatch({
              approaches: [
                {
                  sequence: 1,
                  distanceBand: "150-174",
                  result: "green",
                  missDirection: null,
                },
              ],
            });
          }}
        >
          + Approach
        </button>
      )}

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
          onClick={() => setPenaltyRevealed(true)}
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
