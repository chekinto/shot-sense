-- CreateTable
CREATE TABLE "profiles" (
    "user_id" UUID NOT NULL,
    "handicap" DECIMAL(4,1),
    "default_scoring_zone_yards" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id")
);

-- Link profiles to Supabase Auth users; remove the profile when the user is deleted (§91).
ALTER TABLE "profiles"
    ADD CONSTRAINT "profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users" ("id") ON DELETE CASCADE;

-- Row Level Security backstop. The app's auth boundary is the repository layer
-- (Prisma connects with a privileged role and is not constrained by these
-- policies); RLS protects against direct access via the anon/authenticated
-- roles (supabase-js, Realtime, edge functions, the dashboard).
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by their owner"
    ON "profiles" FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Profiles are insertable by their owner"
    ON "profiles" FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Profiles are updatable by their owner"
    ON "profiles" FOR UPDATE
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
