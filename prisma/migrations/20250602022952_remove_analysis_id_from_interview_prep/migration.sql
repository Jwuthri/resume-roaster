/*
  Warnings:

  - You are about to drop the column `analysis_id` on the `generated_interview_prep` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "generated_interview_prep_analysis_id_idx";

-- AlterTable
ALTER TABLE "generated_interview_prep" DROP COLUMN "analysis_id";
