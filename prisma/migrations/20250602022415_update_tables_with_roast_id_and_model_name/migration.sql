/*
  Warnings:

  - You are about to drop the column `resume_id` on the `generated_resumes` table. All the data in the column will be lost.
  - You are about to drop the column `interview_prep_id` on the `llm_calls` table. All the data in the column will be lost.
  - You are about to drop the `interview_prep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "generated_resumes" DROP CONSTRAINT "generated_resumes_resume_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_evaluations" DROP CONSTRAINT "interview_evaluations_interview_prep_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_prep" DROP CONSTRAINT "interview_prep_extracted_job_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_prep" DROP CONSTRAINT "interview_prep_extracted_resume_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_prep" DROP CONSTRAINT "interview_prep_resume_id_fkey";

-- DropForeignKey
ALTER TABLE "interview_prep" DROP CONSTRAINT "interview_prep_user_id_fkey";

-- DropForeignKey
ALTER TABLE "llm_calls" DROP CONSTRAINT "llm_calls_interview_prep_id_fkey";

-- AlterTable
ALTER TABLE "generated_cover_letters" ADD COLUMN     "model_name" TEXT,
ADD COLUMN     "roast_id" TEXT;

-- AlterTable
ALTER TABLE "generated_resumes" DROP COLUMN "resume_id",
ADD COLUMN     "roast_id" TEXT;

-- AlterTable
ALTER TABLE "llm_calls" DROP COLUMN "interview_prep_id",
ADD COLUMN     "generated_interview_prep_id" TEXT;

-- DropTable
DROP TABLE "interview_prep";

-- CreateTable
CREATE TABLE "generated_interview_prep" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "analysis_id" TEXT NOT NULL,
    "roast_id" TEXT,
    "extracted_resume_id" TEXT,
    "extracted_job_id" TEXT,
    "content_hash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'general',
    "model_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_interview_prep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_interview_prep_content_hash_key" ON "generated_interview_prep"("content_hash");

-- CreateIndex
CREATE INDEX "generated_interview_prep_user_id_idx" ON "generated_interview_prep"("user_id");

-- CreateIndex
CREATE INDEX "generated_interview_prep_analysis_id_idx" ON "generated_interview_prep"("analysis_id");

-- CreateIndex
CREATE INDEX "generated_interview_prep_roast_id_idx" ON "generated_interview_prep"("roast_id");

-- CreateIndex
CREATE INDEX "generated_interview_prep_content_hash_idx" ON "generated_interview_prep"("content_hash");

-- CreateIndex
CREATE INDEX "generated_interview_prep_difficulty_idx" ON "generated_interview_prep"("difficulty");

-- CreateIndex
CREATE INDEX "generated_interview_prep_category_idx" ON "generated_interview_prep"("category");

-- CreateIndex
CREATE INDEX "generated_cover_letters_roast_id_idx" ON "generated_cover_letters"("roast_id");

-- CreateIndex
CREATE INDEX "generated_resumes_roast_id_idx" ON "generated_resumes"("roast_id");

-- AddForeignKey
ALTER TABLE "llm_calls" ADD CONSTRAINT "llm_calls_generated_interview_prep_id_fkey" FOREIGN KEY ("generated_interview_prep_id") REFERENCES "generated_interview_prep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_cover_letters" ADD CONSTRAINT "generated_cover_letters_roast_id_fkey" FOREIGN KEY ("roast_id") REFERENCES "generated_roasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_resumes" ADD CONSTRAINT "generated_resumes_roast_id_fkey" FOREIGN KEY ("roast_id") REFERENCES "generated_roasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_interview_prep" ADD CONSTRAINT "generated_interview_prep_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_interview_prep" ADD CONSTRAINT "generated_interview_prep_roast_id_fkey" FOREIGN KEY ("roast_id") REFERENCES "generated_roasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_interview_prep" ADD CONSTRAINT "generated_interview_prep_extracted_resume_id_fkey" FOREIGN KEY ("extracted_resume_id") REFERENCES "extracted_resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_interview_prep" ADD CONSTRAINT "generated_interview_prep_extracted_job_id_fkey" FOREIGN KEY ("extracted_job_id") REFERENCES "extracted_job_descriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_evaluations" ADD CONSTRAINT "interview_evaluations_interview_prep_id_fkey" FOREIGN KEY ("interview_prep_id") REFERENCES "generated_interview_prep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
