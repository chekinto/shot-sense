-- CreateTable
CREATE TABLE "round_hole_approaches" (
    "id" UUID NOT NULL,
    "round_hole_id" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "distance_band" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "miss_direction" TEXT,

    CONSTRAINT "round_hole_approaches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "round_hole_approaches_round_hole_id_sequence_key" ON "round_hole_approaches"("round_hole_id", "sequence");

-- AddForeignKey
ALTER TABLE "round_hole_approaches" ADD CONSTRAINT "round_hole_approaches_round_hole_id_fkey" FOREIGN KEY ("round_hole_id") REFERENCES "round_holes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security backstop. Scoped through the owning round.
ALTER TABLE "round_hole_approaches" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their round hole approaches"
    ON "round_hole_approaches" FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM "round_holes" h
        JOIN "rounds" r ON r.id = h.round_id
        WHERE h.id = round_hole_id AND r.user_id = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "round_holes" h
        JOIN "rounds" r ON r.id = h.round_id
        WHERE h.id = round_hole_id AND r.user_id = (SELECT auth.uid())
    ));
