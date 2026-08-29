"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import { credentialsSchema } from "./schema";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
}

/** Only allow same-origin, absolute-path redirects. */
const safeNext = (value: FormDataEntryValue | null): string => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
};

const parseCredentials = (formData: FormData) =>
  credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

const toFieldErrors = (
  issues: { path: PropertyKey[]; message: string }[],
): AuthFormState["fieldErrors"] => {
  const fieldErrors: AuthFormState["fieldErrors"] = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "email" || key === "password") fieldErrors[key] = issue.message;
  }
  return fieldErrors;
};

export const signIn = async (
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "That email and password don't match." };
  }

  redirect(safeNext(formData.get("next")));
};

export const signUp = async (
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> => {
  const parsed = parseCredentials(formData);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    return { error: error.message };
  }

  // Email confirmation on: no session yet — send them to a holding page.
  if (!data.session) {
    redirect("/check-email");
  }

  redirect("/onboarding");
};

export const signOut = async (): Promise<never> => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
};
