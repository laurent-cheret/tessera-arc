-- Migration: Conditional Phase 3 Questions (Teaching vs Reflection)
-- Date: October 31, 2025
-- Description: Adds conditional Phase 3 columns based on correctness

-- Step 1: Add new Phase 3 columns for correct solutions (teaching questions)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS q3a_what_to_look_for TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS q3b_how_to_transform TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS q3c_how_to_verify TEXT;

-- Step 2: Add new Phase 3 column for incorrect solutions (single attempt question)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS q3_what_you_tried TEXT;

-- Step 3: Keep q9 columns (hypothesis revision) - these are always present
-- q9_hypothesis_revised and q9_revision_reason should already exist

-- Step 4: Remove old columns that are no longer used
ALTER TABLE responses DROP COLUMN IF EXISTS q5_strategy_used;
ALTER TABLE responses DROP COLUMN IF EXISTS q6_strategy_used;
ALTER TABLE responses DROP COLUMN IF EXISTS q4_what_you_tried;

-- Step 5: Remove old word count columns (no longer tracking)
ALTER TABLE responses DROP COLUMN IF EXISTS q3_word_count;
ALTER TABLE responses DROP COLUMN IF EXISTS q3a_word_count;
ALTER TABLE responses DROP COLUMN IF EXISTS q3b_word_count;
ALTER TABLE responses DROP COLUMN IF EXISTS q3c_word_count;

-- Step 6: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'responses' 
  AND column_name LIKE 'q%'
ORDER BY column_name;

-- Expected Phase 3 columns:
-- q1_main_idea (Phase 1 - always present)
-- q3_what_you_tried (Phase 3 - if incorrect)
-- q3a_what_to_look_for (Phase 3 - if correct)
-- q3b_how_to_transform (Phase 3 - if correct)
-- q3c_how_to_verify (Phase 3 - if correct)
-- q7_difficulty_rating (Phase 4 - always present)
-- q8_challenge_factors (Phase 4 - always present)
-- q8_challenge_other (Phase 4 - always present)
-- q9_hypothesis_revised (Phase 3 - always present)
-- q9_revision_reason (Phase 3 - conditional)