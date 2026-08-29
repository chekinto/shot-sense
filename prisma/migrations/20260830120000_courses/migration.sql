-- CreateTable
CREATE TABLE "golf_courses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hole_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golf_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_holes" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "hole_number" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,

    CONSTRAINT "course_holes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tee_sets" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tee_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tee_hole_yardages" (
    "id" UUID NOT NULL,
    "tee_set_id" UUID NOT NULL,
    "course_hole_id" UUID NOT NULL,
    "yardage" INTEGER NOT NULL,

    CONSTRAINT "tee_hole_yardages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "golf_courses_user_id_name_idx" ON "golf_courses"("user_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "course_holes_course_id_hole_number_key" ON "course_holes"("course_id", "hole_number");

-- CreateIndex
CREATE UNIQUE INDEX "tee_sets_course_id_name_key" ON "tee_sets"("course_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tee_hole_yardages_tee_set_id_course_hole_id_key" ON "tee_hole_yardages"("tee_set_id", "course_hole_id");

-- AddForeignKey
ALTER TABLE "course_holes" ADD CONSTRAINT "course_holes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "golf_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tee_sets" ADD CONSTRAINT "tee_sets_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "golf_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tee_hole_yardages" ADD CONSTRAINT "tee_hole_yardages_tee_set_id_fkey" FOREIGN KEY ("tee_set_id") REFERENCES "tee_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tee_hole_yardages" ADD CONSTRAINT "tee_hole_yardages_course_hole_id_fkey" FOREIGN KEY ("course_hole_id") REFERENCES "course_holes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security backstop (Prisma connects with a privileged role and is not
-- constrained by these; the repository layer is the real auth boundary). Child
-- tables are scoped through their owning golf_course.
ALTER TABLE "golf_courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "course_holes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tee_sets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tee_hole_yardages" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their courses"
    ON "golf_courses" FOR ALL
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Owners manage their course holes"
    ON "course_holes" FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM "golf_courses" c
        WHERE c.id = course_id AND c.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "golf_courses" c
        WHERE c.id = course_id AND c.user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Owners manage their tee sets"
    ON "tee_sets" FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM "golf_courses" c
        WHERE c.id = course_id AND c.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "golf_courses" c
        WHERE c.id = course_id AND c.user_id = (SELECT auth.uid())
    ));

CREATE POLICY "Owners manage their tee yardages"
    ON "tee_hole_yardages" FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM "tee_sets" t
        JOIN "golf_courses" c ON c.id = t.course_id
        WHERE t.id = tee_set_id AND c.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "tee_sets" t
        JOIN "golf_courses" c ON c.id = t.course_id
        WHERE t.id = tee_set_id AND c.user_id = (SELECT auth.uid())
    ));
