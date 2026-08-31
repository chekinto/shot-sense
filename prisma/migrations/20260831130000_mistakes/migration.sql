-- AddColumn
ALTER TABLE "round_holes" ADD COLUMN "mistakes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
