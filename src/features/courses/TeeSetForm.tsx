"use client";

import { useActionState, useState } from "react";
import { Button, Field, InlineNotice } from "@/components/ui";
import { deleteTeeSet, saveTeeSet, type CourseFormState } from "./actions";
import { YARDAGE_MAX, YARDAGE_MIN } from "./schema";
import type { TeeSet } from "./types";
import styles from "./TeeSetForm.module.css";

const initialState: CourseFormState = {};

interface TeeSetFormProps {
  courseId: string;
  holeNumbers: number[];
  teeSet?: TeeSet;
}

export const TeeSetForm = ({ courseId, holeNumbers, teeSet }: TeeSetFormProps) => {
  const isEdit = Boolean(teeSet);
  const [state, formAction, pending] = useActionState(saveTeeSet, initialState);

  const [yardages, setYardages] = useState<Record<number, string>>(() => {
    const seed: Record<number, string> = {};
    for (const y of teeSet?.yardages ?? []) seed[y.holeNumber] = String(y.yardage);
    return seed;
  });

  const serialised = JSON.stringify(
    holeNumbers.map((holeNumber) => {
      const raw = yardages[holeNumber]?.trim() ?? "";
      return { holeNumber, yardage: raw === "" ? null : Number(raw) };
    }),
  );

  return (
    <div className={styles.wrap}>
      <form action={formAction} className={styles.form} noValidate>
        <input type="hidden" name="courseId" value={courseId} />
        {teeSet ? <input type="hidden" name="teeSetId" value={teeSet.id} /> : null}
        <input type="hidden" name="yardages" value={serialised} />

        {state.error ? (
          <InlineNotice tone="error">{state.error}</InlineNotice>
        ) : null}
        {state.savedAt ? <InlineNotice tone="info">Saved.</InlineNotice> : null}

        <Field
          label="Tee name"
          name="teeName"
          defaultValue={teeSet?.name ?? ""}
          placeholder="White"
          required
          maxLength={40}
          error={state.fieldErrors?.name}
        />

        <fieldset className={styles.grid}>
          <legend className={styles.legend}>Yardage (optional)</legend>
          {holeNumbers.map((holeNumber) => (
            <label key={holeNumber} className={styles.cell}>
              <span className={styles.cellLabel}>{holeNumber}</span>
              <input
                type="number"
                inputMode="numeric"
                min={YARDAGE_MIN}
                max={YARDAGE_MAX}
                value={yardages[holeNumber] ?? ""}
                onChange={(e) =>
                  setYardages((current) => ({
                    ...current,
                    [holeNumber]: e.target.value,
                  }))
                }
                className={styles.cellInput}
                aria-label={`Yardage for hole ${holeNumber}`}
              />
            </label>
          ))}
        </fieldset>

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save tee" : "Add tee"}
        </Button>
      </form>

      {teeSet ? (
        <form action={deleteTeeSet}>
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="teeSetId" value={teeSet.id} />
          <Button type="submit" variant="ghost">
            Remove {teeSet.name}
          </Button>
        </form>
      ) : null}
    </div>
  );
};
