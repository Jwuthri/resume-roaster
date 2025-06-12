-- AlterTable
ALTER TABLE "extracted_job_descriptions" ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "extracted_job_descriptions_user_id_idx" ON "extracted_job_descriptions"("user_id");

-- AddForeignKey
ALTER TABLE "extracted_job_descriptions" ADD CONSTRAINT "extracted_job_descriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
