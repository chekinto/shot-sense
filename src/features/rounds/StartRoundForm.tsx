"use client";

import { useActionState, useState } from "react";
import { Button, Field, InlineNotice } from "@/components/ui";
import { startRound, type StartRoundFormState } from "./actions";
import type { StartRoundCourse } from "./service";
import styles from "./StartRoundForm.module.css";

const initialState: StartRoundFormState = {};
const NO_TEE = "";

interface StartRoundFormProps {
  courses: StartRoundCourse[];
  defaultHandicap: number | null;
}

export const StartRoundForm = ({
  courses,
  defaultHandicap,
}: StartRoundFormProps) => {
  const [courseId, setCourseId] = useState<string>("");
  const [teeSetId, setTeeSetId] = useState<string>(NO_TEE);
  const [state, formAction, pending] = useActionState(startRound, initialState);

  const selectedCourse = courses.find((c) => c.id === courseId) ?? null;

  const selectCourse = (id: string) => {
    setCourseId(id);
    setTeeSetId(NO_TEE);
  };

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="teeSetId" value={teeSetId} />

      {state.error ? <InlineNotice tone="error">{state.error}</InlineNotice> : null}

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Course</legend>
        {state.fieldErrors?.courseId ? (
          <p className={styles.error} role="alert">
            {state.fieldErrors.courseId}
          </p>
        ) : null}
        <ul className={styles.list}>
          {courses.map((course) => (
            <li key={course.id}>
              <label
                className={`${styles.option} ${
                  course.id === courseId ? styles.optionSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="course"
                  value={course.id}
                  checked={course.id === courseId}
                  onChange={() => selectCourse(course.id)}
                  className={styles.radio}
                />
                <span className={styles.optionName}>{course.name}</span>
                <span className={styles.optionMeta}>{course.holeCount} holes</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {selectedCourse && selectedCourse.teeSets.length > 0 ? (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Tee</legend>
          <ul className={styles.list}>
            <li>
              <label
                className={`${styles.option} ${
                  teeSetId === NO_TEE ? styles.optionSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="tee"
                  checked={teeSetId === NO_TEE}
                  onChange={() => setTeeSetId(NO_TEE)}
                  className={styles.radio}
                />
                <span className={styles.optionName}>No tee</span>
              </label>
            </li>
            {selectedCourse.teeSets.map((tee) => (
              <li key={tee.id}>
                <label
                  className={`${styles.option} ${
                    tee.id === teeSetId ? styles.optionSelected : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="tee"
                    value={tee.id}
                    checked={tee.id === teeSetId}
                    onChange={() => setTeeSetId(tee.id)}
                    className={styles.radio}
                  />
                  <span className={styles.optionName}>{tee.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <Field
        label="Handicap for this round"
        name="handicap"
        type="number"
        inputMode="decimal"
        step="0.1"
        defaultValue={defaultHandicap ?? ""}
        placeholder="e.g. 14.2"
        hint="Leave blank if you don't have one."
        error={state.fieldErrors?.handicapAtStart}
      />

      <Button type="submit" fullWidth disabled={pending || courseId === ""}>
        {pending ? "Starting…" : "Start round"}
      </Button>
    </form>
  );
};
