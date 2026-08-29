"use client";

import { useActionState } from "react";
import { Button, Field, InlineNotice } from "@/components/ui";
import { signIn, type AuthFormState } from "@/features/auth/actions";
import styles from "../auth.module.css";

const initialState: AuthFormState = {};

export const LoginForm = ({ next }: { next?: string }) => {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />

      <Button type="submit" fullWidth disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
};
