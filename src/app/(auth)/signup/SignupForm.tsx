"use client";

import { useActionState } from "react";
import { Button, Field, InlineNotice } from "@/components/ui";
import { signUp, type AuthFormState } from "@/features/auth/actions";
import styles from "../auth.module.css";

const initialState: AuthFormState = {};

export const SignupForm = () => {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {state.error ? <InlineNotice tone="error">{state.error}</InlineNotice> : null}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="At least 8 characters."
        error={state.fieldErrors?.password}
      />

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
};
