"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Field, InlineNotice, SegmentedControl } from "@/components/ui";
import {
  createBackfillRound,
  updateBackfillRound,
  type BackfillFormState,
} from "./backfillActions";
import styles from "./BackfillForm.module.css";

interface CoarseHole {
  holeNumber: number;
  par: number;
  score: number;
  shotsToZone: number;
  putts: number;
  penaltyStrokes: number;
}

const blankHole = (holeNumber: number): CoarseHole => ({
  holeNumber,
  par: 4,
  score: 4,
  shotsToZone: 2,
  putts: 2,
  penaltyStrokes: 0,
});

const resize = (holes: CoarseHole[], count: number): CoarseHole[] =>
  Array.from({ length: count }, (_, i) => holes[i] ?? blankHole(i + 1));

const initialState: BackfillFormState = {};

const FIELDS = [
  ["par", "Par"],
  ["score", "Score"],
  ["shotsToZone", "→ Zone"],
  ["putts", "Putts"],
  ["penaltyStrokes", "Pen"],
] as const;

interface BackfillFormProps {
  mode: "create" | "edit";
  roundId?: string;
  initialCourseName?: string;
  initialPlayedOn?: string;
  initialHandicap?: number | null;
  initialHoles?: CoarseHole[];
}

export const BackfillForm = ({
  mode,
  roundId,
  initialCourseName = "",
  initialPlayedOn = new Date().toISOString().slice(0, 10),
  initialHandicap = null,
  initialHoles,
}: BackfillFormProps) => {
  const [holes, setHoles] = useState<CoarseHole[]>(
    resize(initialHoles ?? [], initialHoles?.length === 9 ? 9 : 18),
  );
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createBackfillRound : updateBackfillRound,
    initialState,
  );

  const totals = useMemo(
    () => ({
      par: holes.reduce((s, h) => s + h.par, 0),
      score: holes.reduce((s, h) => s + h.score, 0),
    }),
    [holes],
  );

  const setField = (index: number, field: keyof CoarseHole, value: number) => {
    setHoles((current) =>
      current.map((h, i) => (i === index ? { ...h, [field]: value } : h)),
    );
  };

  const holeError = (index: number): string | undefined => {
    const prefix = `holes.${index}.`;
    const key = Object.keys(state.fieldErrors ?? {}).find(
      (k) => k === `holes.${index}` || k.startsWith(prefix),
    );
    return key ? state.fieldErrors?.[key] : undefined;
  };

  return (
    <form action={formAction} className={styles.form} noValidate>
      {mode === "edit" ? (
        <input type="hidden" name="roundId" value={roundId} />
      ) : null}
      <input type="hidden" name="holes" value={JSON.stringify(holes)} />

      {state.error ? (
        <InlineNotice tone="error">{state.error}</InlineNotice>
      ) : null}

      <Field
        label="Course"
        name="courseName"
        defaultValue={initialCourseName}
        required
        error={state.fieldErrors?.courseName}
      />
      <Field
        label="Date played"
        name="playedOn"
        type="date"
        defaultValue={initialPlayedOn}
        required
        error={state.fieldErrors?.playedOn}
      />
      <Field
        label="Handicap then (optional)"
        name="handicap"
        type="number"
        step="0.1"
        defaultValue={initialHandicap ?? ""}
        error={state.fieldErrors?.handicapAtStart}
      />

      <SegmentedControl<number>
        label="Holes"
        options={[
          { label: "9", value: 9 },
          { label: "18", value: 18 },
        ]}
        value={holes.length}
        onChange={(count) => setHoles((c) => resize(c, count))}
      />

      {state.fieldErrors?.holes ? (
        <p className={styles.error} role="alert">
          {state.fieldErrors.holes}
        </p>
      ) : null}

      <div className={styles.gridWrap}>
        <table className={styles.grid}>
          <thead>
            <tr>
              <th scope="col">Hole</th>
              {FIELDS.map(([key, label]) => (
                <th key={key} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holes.map((hole, index) => (
              <tr
                key={hole.holeNumber}
                className={holeError(index) ? styles.rowError : undefined}
              >
                <th scope="row">{hole.holeNumber}</th>
                {FIELDS.map(([key]) => (
                  <td key={key}>
                    <input
                      type="number"
                      inputMode="numeric"
                      aria-label={`Hole ${hole.holeNumber} ${key}`}
                      className={styles.cell}
                      value={hole[key]}
                      min={0}
                      onChange={(e) =>
                        setField(index, key, Number(e.target.value) || 0)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td>{totals.par}</td>
              <td>{totals.score}</td>
              <td colSpan={3} className={styles.toPar}>
                {totals.score - totals.par >= 0 ? "+" : ""}
                {totals.score - totals.par} to par
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <Button type="submit" fullWidth disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Save round"
            : "Save changes"}
      </Button>
    </form>
  );
};
