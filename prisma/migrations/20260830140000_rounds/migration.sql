-- CreateEnum
CREATE TYPE "round_status" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "rounds" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID,
    "tee_set_id" UUID,
    "played_on" DATE NOT NULL,
    "planned_hole_count" INTEGER NOT NULL,
    "completed_hole_count" INTEGER NOT NULL DEFAULT 0,
    "handicap_at_start" DECIMAL(4,1),
    "scoring_zone_yards" INTEGER NOT NULL,
    "status" "round_status" NOT NULL DEFAULT 'IN_PROGRESS',
    "methodology_version" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_course_snapshots" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "course_name" TEXT NOT NULL,
    "tee_name" TEXT,

    CONSTRAINT "round_course_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "round_holes" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "hole_number" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "yardage" INTEGER,
    "score" INTEGER,
    "shots_to_zone" INTEGER,
    "putts" INTEGER,
    "first_putt_distance" TEXT,
    "tee_outcome" TEXT,
    "tee_lie" TEXT,
    "bunker_shots" INTEGER NOT NULL DEFAULT 0,
    "bunkers_visited" INTEGER NOT NULL DEFAULT 0,
    "penalty_strokes" INTEGER NOT NULL DEFAULT 0,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "round_holes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rounds_user_id_status_idx" ON "rounds"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "round_course_snapshots_round_id_key" ON "round_course_snapshots"("round_id");

-- CreateIndex
CREATE UNIQUE INDEX "round_holes_round_id_hole_number_key" ON "round_holes"("round_id", "hole_number");

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "golf_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_tee_set_id_fkey" FOREIGN KEY ("tee_set_id") REFERENCES "tee_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_course_snapshots" ADD CONSTRAINT "round_course_snapshots_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "round_holes" ADD CONSTRAINT "round_holes_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security backstop. Child tables scoped through the owning round.
ALTER TABLE "rounds" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "round_course_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "round_holes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their rounds"
    ON "rounds" FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Owners manage their round snapshots"
    ON "round_course_snapshots" FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM "rounds" r
        WHERE r.id = round_id AND r.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "rounds" r
        WHERE r.id = round_id AND r.user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Owners manage their round holes"
    ON "round_holes" FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM "rounds" r
        WHERE r.id = round_id AND r.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "rounds" r
        WHERE r.id = round_id AND r.user_id = (SELECT auth.uid())
    ));
