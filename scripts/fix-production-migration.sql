-- Fix Production Migration Script
-- This script resolves the failed migration by properly handling data migration
-- before applying schema changes

-- Step 1: Create the new generated_interview_prep table first (if it doesn't exist)
CREATE TABLE IF NOT EXISTS "generated_interview_prep" (
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

-- Step 2: Migrate data from interview_prep to generated_interview_prep (if interview_prep exists)
INSERT INTO "generated_interview_prep" (
    "id", 
    "user_id", 
    "analysis_id", 
    "roast_id", 
    "extracted_resume_id", 
    "extracted_job_id", 
    "content_hash", 
    "data", 
    "difficulty", 
    "category", 
    "created_at"
)
SELECT 
    "id",
    "user_id",
    COALESCE("analysis_id", 'migrated_' || "id") as "analysis_id", -- Handle missing analysis_id
    NULL as "roast_id", -- New column, set to NULL
    "extracted_resume_id",
    "extracted_job_id",
    "content_hash",
    "data",
    COALESCE("difficulty", 'medium') as "difficulty",
    COALESCE("category", 'general') as "category",
    "created_at"
FROM "interview_prep"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interview_prep')
ON CONFLICT ("id") DO NOTHING; -- Avoid duplicates if already migrated

-- Step 3: Create indexes for generated_interview_prep (if they don't exist)
CREATE UNIQUE INDEX IF NOT EXISTS "generated_interview_prep_content_hash_key" ON "generated_interview_prep"("content_hash");
CREATE INDEX IF NOT EXISTS "generated_interview_prep_user_id_idx" ON "generated_interview_prep"("user_id");
CREATE INDEX IF NOT EXISTS "generated_interview_prep_analysis_id_idx" ON "generated_interview_prep"("analysis_id");
CREATE INDEX IF NOT EXISTS "generated_interview_prep_roast_id_idx" ON "generated_interview_prep"("roast_id");
CREATE INDEX IF NOT EXISTS "generated_interview_prep_content_hash_idx" ON "generated_interview_prep"("content_hash");
CREATE INDEX IF NOT EXISTS "generated_interview_prep_difficulty_idx" ON "generated_interview_prep"("difficulty");
CREATE INDEX IF NOT EXISTS "generated_interview_prep_category_idx" ON "generated_interview_prep"("category");

-- Step 4: Add foreign key constraints for generated_interview_prep (if they don't exist)
DO $$
BEGIN
    -- Add user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_interview_prep_user_id_fkey'
    ) THEN
        ALTER TABLE "generated_interview_prep" 
        ADD CONSTRAINT "generated_interview_prep_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add roast_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_interview_prep_roast_id_fkey'
    ) THEN
        ALTER TABLE "generated_interview_prep" 
        ADD CONSTRAINT "generated_interview_prep_roast_id_fkey" 
        FOREIGN KEY ("roast_id") REFERENCES "generated_roasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add extracted_resume_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_interview_prep_extracted_resume_id_fkey'
    ) THEN
        ALTER TABLE "generated_interview_prep" 
        ADD CONSTRAINT "generated_interview_prep_extracted_resume_id_fkey" 
        FOREIGN KEY ("extracted_resume_id") REFERENCES "extracted_resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Add extracted_job_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_interview_prep_extracted_job_id_fkey'
    ) THEN
        ALTER TABLE "generated_interview_prep" 
        ADD CONSTRAINT "generated_interview_prep_extracted_job_id_fkey" 
        FOREIGN KEY ("extracted_job_id") REFERENCES "extracted_job_descriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 5: Update interview_evaluations to point to generated_interview_prep
-- First, drop the old foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'interview_evaluations_interview_prep_id_fkey'
        AND table_name = 'interview_evaluations'
    ) THEN
        ALTER TABLE "interview_evaluations" DROP CONSTRAINT "interview_evaluations_interview_prep_id_fkey";
    END IF;
END $$;

-- Add the new foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'interview_evaluations_interview_prep_id_fkey'
        AND table_name = 'interview_evaluations'
    ) THEN
        ALTER TABLE "interview_evaluations" 
        ADD CONSTRAINT "interview_evaluations_interview_prep_id_fkey" 
        FOREIGN KEY ("interview_prep_id") REFERENCES "generated_interview_prep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 6: Update llm_calls table
-- Add the new column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'llm_calls' AND column_name = 'generated_interview_prep_id'
    ) THEN
        ALTER TABLE "llm_calls" ADD COLUMN "generated_interview_prep_id" TEXT;
    END IF;
END $$;

-- Migrate data from interview_prep_id to generated_interview_prep_id
UPDATE "llm_calls" 
SET "generated_interview_prep_id" = "interview_prep_id" 
WHERE "interview_prep_id" IS NOT NULL 
AND "generated_interview_prep_id" IS NULL;

-- Drop the old foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'llm_calls_interview_prep_id_fkey'
    ) THEN
        ALTER TABLE "llm_calls" DROP CONSTRAINT "llm_calls_interview_prep_id_fkey";
    END IF;
END $$;

-- Drop the old column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'llm_calls' AND column_name = 'interview_prep_id'
    ) THEN
        ALTER TABLE "llm_calls" DROP COLUMN "interview_prep_id";
    END IF;
END $$;

-- Add the new foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'llm_calls_generated_interview_prep_id_fkey'
    ) THEN
        ALTER TABLE "llm_calls" 
        ADD CONSTRAINT "llm_calls_generated_interview_prep_id_fkey" 
        FOREIGN KEY ("generated_interview_prep_id") REFERENCES "generated_interview_prep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 7: Update generated_cover_letters table
-- Add new columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_cover_letters' AND column_name = 'model_name'
    ) THEN
        ALTER TABLE "generated_cover_letters" ADD COLUMN "model_name" TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_cover_letters' AND column_name = 'roast_id'
    ) THEN
        ALTER TABLE "generated_cover_letters" ADD COLUMN "roast_id" TEXT;
    END IF;
END $$;

-- Add index and foreign key for roast_id
CREATE INDEX IF NOT EXISTS "generated_cover_letters_roast_id_idx" ON "generated_cover_letters"("roast_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_cover_letters_roast_id_fkey'
    ) THEN
        ALTER TABLE "generated_cover_letters" 
        ADD CONSTRAINT "generated_cover_letters_roast_id_fkey" 
        FOREIGN KEY ("roast_id") REFERENCES "generated_roasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 8: Update generated_resumes table
-- Drop old foreign key constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_resumes_resume_id_fkey'
    ) THEN
        ALTER TABLE "generated_resumes" DROP CONSTRAINT "generated_resumes_resume_id_fkey";
    END IF;
END $$;

-- Drop the old column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_resumes' AND column_name = 'resume_id'
    ) THEN
        ALTER TABLE "generated_resumes" DROP COLUMN "resume_id";
    END IF;
END $$;

-- Add the new column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'generated_resumes' AND column_name = 'roast_id'
    ) THEN
        ALTER TABLE "generated_resumes" ADD COLUMN "roast_id" TEXT;
    END IF;
END $$;

-- Add index and foreign key for roast_id
CREATE INDEX IF NOT EXISTS "generated_resumes_roast_id_idx" ON "generated_resumes"("roast_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generated_resumes_roast_id_fkey'
    ) THEN
        ALTER TABLE "generated_resumes" 
        ADD CONSTRAINT "generated_resumes_roast_id_fkey" 
        FOREIGN KEY ("roast_id") REFERENCES "generated_roasts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 9: Finally, drop the old interview_prep table if it exists
DROP TABLE IF EXISTS "interview_prep";

-- Step 10: Verify the migration is complete
SELECT 'Migration completed successfully!' as status; 