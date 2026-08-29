"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Field, InlineNotice } from "@/components/ui";
import { saveHandicap, type HandicapFormState } from "@/features/profile/actions";
import styles from "./page.module.css";

const initialState: HandicapFormState = {};

export const OnboardingForm = () => {
  const [state, formAction, pending] = useActionState(saveHandicap, initialState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.error ? <InlineNotice tone="error">{state.error}</InlineNotice> : null}

      <Field
        label="Handicap"
        name="handicap"
        type="number"
        inputMode="decimal"
        step="0.1"
        min={-10}
        max={54}
        placeholder="e.g. 14.2"
        hint="Your current handicap index. You can change this later in Settings."
      />

      <div className={styles.actions}>
        <Button type="submit" fullWidth disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </Button>
        <Link href="/dashboard" className={styles.skip}>
          Skip for now
        </Link>
      </div>
    </form>
  );
};
