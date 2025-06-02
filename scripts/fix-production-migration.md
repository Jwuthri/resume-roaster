# Fix Production Migration Guide

## Problem
The migration `20250602022415_update_tables_with_roast_id_and_model_name` failed because it tried to drop the `interview_prep` table while `interview_evaluations` still had foreign key references to it.

## Solution Steps

### Step 1: Mark the failed migration as rolled back
```bash
npx prisma migrate resolve --rolled-back 20250602022415_update_tables_with_roast_id_and_model_name
```

### Step 2: Connect to your production database and run the fix SQL
You'll need to execute the SQL script `scripts/fix-production-migration.sql` against your production database. You can do this through:

- Your database provider's web interface (Supabase, PlanetScale, etc.)
- A database client like pgAdmin, DBeaver, or psql
- Your hosting platform's database console

### Step 3: Alternative - Manual Steps via Database Console

If you prefer to run commands manually, execute these in order:

#### 3.1: Create the new table
```sql
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
```

#### 3.2: Migrate existing data
```sql
INSERT INTO "generated_interview_prep" (
    "id", "user_id", "analysis_id", "roast_id", "extracted_resume_id", 
    "extracted_job_id", "content_hash", "data", "difficulty", "category", "created_at"
)
SELECT 
    "id", "user_id", 
    COALESCE("analysis_id", 'migrated_' || "id") as "analysis_id",
    NULL as "roast_id",
    "extracted_resume_id", "extracted_job_id", "content_hash", "data",
    COALESCE("difficulty", 'medium') as "difficulty",
    COALESCE("category", 'general') as "category",
    "created_at"
FROM "interview_prep"
ON CONFLICT ("id") DO NOTHING;
```

#### 3.3: Update foreign key references
```sql
-- Drop old constraint
ALTER TABLE "interview_evaluations" DROP CONSTRAINT IF EXISTS "interview_evaluations_interview_prep_id_fkey";

-- Add new constraint
ALTER TABLE "interview_evaluations" 
ADD CONSTRAINT "interview_evaluations_interview_prep_id_fkey" 
FOREIGN KEY ("interview_prep_id") REFERENCES "generated_interview_prep"("id") ON DELETE CASCADE;
```

#### 3.4: Update llm_calls table
```sql
-- Add new column
ALTER TABLE "llm_calls" ADD COLUMN IF NOT EXISTS "generated_interview_prep_id" TEXT;

-- Migrate data
UPDATE "llm_calls" 
SET "generated_interview_prep_id" = "interview_prep_id" 
WHERE "interview_prep_id" IS NOT NULL;

-- Drop old constraint and column
ALTER TABLE "llm_calls" DROP CONSTRAINT IF EXISTS "llm_calls_interview_prep_id_fkey";
ALTER TABLE "llm_calls" DROP COLUMN IF EXISTS "interview_prep_id";
```

#### 3.5: Update other tables
```sql
-- Add columns to generated_cover_letters
ALTER TABLE "generated_cover_letters" ADD COLUMN IF NOT EXISTS "model_name" TEXT;
ALTER TABLE "generated_cover_letters" ADD COLUMN IF NOT EXISTS "roast_id" TEXT;

-- Update generated_resumes
ALTER TABLE "generated_resumes" DROP CONSTRAINT IF EXISTS "generated_resumes_resume_id_fkey";
ALTER TABLE "generated_resumes" DROP COLUMN IF EXISTS "resume_id";
ALTER TABLE "generated_resumes" ADD COLUMN IF NOT EXISTS "roast_id" TEXT;
```

#### 3.6: Drop old table
```sql
DROP TABLE IF EXISTS "interview_prep";
```

### Step 4: Mark migration as applied
After successfully running the SQL fixes:

```bash
npx prisma migrate resolve --applied 20250602022415_update_tables_with_roast_id_and_model_name
```

### Step 5: Deploy remaining migrations
```bash
npx prisma migrate deploy
```

### Step 6: Verify database state
```bash
npx prisma migrate status
```

## Alternative: Reset and Redeploy (DESTRUCTIVE)

⚠️ **WARNING: This will delete all data in your production database!**

If you don't have important data and want to start fresh:

```bash
# Reset the database (DELETES ALL DATA)
npx prisma migrate reset --force

# Deploy all migrations
npx prisma migrate deploy
```

## Troubleshooting

### If you get "migration already applied" error:
```bash
npx prisma migrate resolve --rolled-back 20250602022415_update_tables_with_roast_id_and_model_name
```

### If you get foreign key constraint errors:
1. Check that all referenced records exist in the target tables
2. Temporarily disable foreign key checks if your database supports it
3. Run the data migration steps in the correct order

### To check current migration status:
```bash
npx prisma migrate status
```

### To see what's in the failed migration:
```bash
cat prisma/migrations/20250602022415_update_tables_with_roast_id_and_model_name/migration.sql
```

## Prevention for Future

To avoid this issue in the future:
1. Always test migrations on a copy of production data first
2. Use `npx prisma migrate diff` to preview changes
3. Consider using `npx prisma db push` for development
4. Break complex migrations into smaller, safer steps 