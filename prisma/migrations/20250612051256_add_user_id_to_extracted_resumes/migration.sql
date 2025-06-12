-- AlterTable
ALTER TABLE "extracted_resumes" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "extracted_resumes_resume_id_idx" ON "extracted_resumes"("resume_id");

-- CreateIndex
CREATE INDEX "extracted_resumes_user_id_idx" ON "extracted_resumes"("user_id");

-- AddForeignKey
ALTER TABLE "extracted_resumes" ADD CONSTRAINT "extracted_resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
