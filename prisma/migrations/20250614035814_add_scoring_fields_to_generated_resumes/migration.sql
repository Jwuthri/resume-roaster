-- AlterTable
ALTER TABLE "generated_resumes" ADD COLUMN     "keyword_match_percentage" INTEGER,
ADD COLUMN     "original_ats_score" INTEGER,
ADD COLUMN     "overall_score" INTEGER,
ADD COLUMN     "score_label" TEXT,
ADD COLUMN     "scoring_breakdown" JSONB;

-- CreateIndex
CREATE INDEX "generated_resumes_overall_score_idx" ON "generated_resumes"("overall_score");
