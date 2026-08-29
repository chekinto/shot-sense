"use client";

import { useActionState, useMemo, useState } from "react";
import {
  Button,
  Field,
  InlineNotice,
  SegmentedControl,
} from "@/components/ui";
import {
  createCourse,
  updateCourseDetails,
  type CourseFormState,
} from "./actions";
import { HOLE_COUNTS, PAR_CHOICES, type HoleCount } from "./schema";
import styles from "./CourseForm.module.css";

const DEFAULT_PAR = 4;
const initialState: CourseFormState = {};

const resizePars = (pars: number[], count: number): number[] =>
  Array.from({ length: count }, (_, i) => pars[i] ?? DEFAULT_PAR);

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  initialName?: string;
  initialHoleCount?: HoleCount;
  initialPars?: number[];
}

export const CourseForm = ({
  mode,
  courseId,
  initialName = "",
  initialHoleCount = 18,
  initialPars,
}: CourseFormProps) => {
  const [holeCount, setHoleCount] = useState<HoleCount>(initialHoleCount);
  const [pars, setPars] = useState<number[]>(
    resizePars(initialPars ?? [], initialHoleCount),
  );
  const [state, formAction, pending] = useActionState(
    mode === "create" ? createCourse : updateCourseDetails,
    initialState,
  );

  const total = useMemo(() => pars.reduce((a, b) => a + b, 0), [pars]);

  const changeHoleCount = (next: HoleCount) => {
    setHoleCount(next);
    setPars((current) => resizePars(current, next));
  };

  const setPar = (index: number, value: number) => {
    setPars((current) => current.map((p, i) => (i === index ? value : p)));
  };

  return (
    <form action={formAction} className={styles.form} noValidate>
      {courseId ? <input type="hidden" name="courseId" value={courseId} /> : null}
      <input type="hidden" name="holeCount" value={holeCount} />
      <input type="hidden" name="pars" value={JSON.stringify(pars)} />

      {state.error ? <InlineNotice tone="error">{state.error}</InlineNotice> : null}
      {state.savedAt ? <InlineNotice tone="info">Saved.</InlineNotice> : null}

      <Field
        label="Course name"
        name="name"
        defaultValue={initialName}
        required
        maxLength={120}
        error={state.fieldErrors?.name}
      />

      <SegmentedControl
        label="Holes"
        options={HOLE_COUNTS.map((n) => ({ label: String(n), value: n }))}
        value={holeCount}
        onChange={changeHoleCount}
        disabled={mode === "edit"}
      />
      {mode === "edit" ? (
        <p className={styles.note}>
          Hole count can&rsquo;t change after creation — create a new course instead.
        </p>
      ) : null}

      <fieldset className={styles.holes}>
        <legend className={styles.legend}>
          Par <span className={styles.total}>Total {total}</span>
        </legend>
        {state.fieldErrors?.pars ? (
          <p className={styles.parsError} role="alert">
            {state.fieldErrors.pars}
          </p>
        ) : null}
        <ol className={styles.holeList}>
          {pars.map((par, index) => (
            <li key={index} className={styles.holeRow}>
              <span className={styles.holeNo}>{index + 1}</span>
              <SegmentedControl
                label={`Par for hole ${index + 1}`}
                hideLabel
                size="sm"
                options={PAR_CHOICES.map((p) => ({ label: String(p), value: p }))}
                value={par}
                onChange={(value) => setPar(index, value)}
              />
            </li>
          ))}
        </ol>
      </fieldset>

      <Button type="submit" fullWidth disabled={pending}>
        {pending
          ? "Saving…"
          : mode === "create"
            ? "Create course"
            : "Save changes"}
      </Button>
    </form>
  );
};
