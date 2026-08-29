import "server-only";

/**
 * Server-side environment access. Values are read lazily and validated on first
 * use, so a missing variable fails loudly at runtime with a clear message
 * rather than silently producing a broken client — and a production build does
 * not require real secrets to be present.
 */
const required = (name: string): string => {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. See .env.example.`,
    );
  }
  return value;
};

export const serverEnv = {
  /** Pooled Postgres connection (PgBouncer) for runtime queries. */
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  /** Direct Postgres connection for migrations / introspection. */
  get directUrl() {
    return required("DIRECT_URL");
  },
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
};
