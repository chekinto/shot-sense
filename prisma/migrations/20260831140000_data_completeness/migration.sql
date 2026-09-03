-- CreateEnum
CREATE TYPE "round_data_completeness" AS ENUM ('FULL', 'COARSE');

-- AlterTable
ALTER TABLE "rounds" ADD COLUMN "data_completeness" "round_data_completeness" NOT NULL DEFAULT 'FULL';
