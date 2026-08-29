import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

/** The current authenticated user, or `null`. */
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * The current user, or a redirect to `/login`. Use in Server Components and
 * Server Actions behind protected routes. Middleware already guards the route;
 * this is the in-handler guarantee that narrows the type.
 */
export const requireUser = async (): Promise<User> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
};
