-- ============================================================================
-- Database Column Reorganization Migration
-- Date: October 4, 2025
-- Purpose: Rename columns to match logical Q1-Q8 question order
-- Safety: All changes in transaction, can rollback if any error
-- ============================================================================

-- Start transaction
BEGIN;

-- Print start message
DO $$ 
BEGIN 
  RAISE NOTICE 'Starting database reorganization migration...';
  RAISE NOTICE 'Renaming 14 columns in responses table';
END $$;

-- ============================================================================
-- Step 1: Rename columns to match Q1-Q8 structure
-- ============================================================================

-- Q1: Hierarchical first impressions (4 columns)
ALTER TABLE responses 
  RENAME COLUMN primary_impression TO q1_primary_impression;

ALTER TABLE responses 
  RENAME COLUMN primary_features TO q1_primary_features;

ALTER TABLE responses 
  RENAME COLUMN primary_other_text TO q1_primary_other_text;

ALTER TABLE responses 
  RENAME COLUMN secondary_impressions TO q1_secondary_impressions;

-- Q2: Initial hypothesis
ALTER TABLE responses 
  RENAME COLUMN initial_hypothesis TO q2_initial_hypothesis;

-- Q3: Confidence level (moved to Phase 1)
ALTER TABLE responses 
  RENAME COLUMN confidence_level TO q3_confidence_level;

-- Q4: What you tried (formerly transformation_rule)
ALTER TABLE responses 
  RENAME COLUMN transformation_rule_full TO q4_what_you_tried;

ALTER TABLE responses 
  RENAME COLUMN transformation_word_count TO q4_word_count;

-- Q5: Strategy revision (moved to Phase 3)
ALTER TABLE responses 
  RENAME COLUMN hypothesis_revised TO q5_hypothesis_revised;

ALTER TABLE responses 
  RENAME COLUMN revision_reason TO q5_revision_reason;

-- Q6: Strategy used
ALTER TABLE responses 
  RENAME COLUMN strategy_used TO q6_strategy_used;

-- Q7: Difficulty rating
ALTER TABLE responses 
  RENAME COLUMN difficulty_rating TO q7_difficulty_rating;

-- Q8: Challenge factors
ALTER TABLE responses 
  RENAME COLUMN challenge_factors TO q8_challenge_factors;

ALTER TABLE responses 
  RENAME COLUMN challenge_factors_other TO q8_challenge_other;

-- ============================================================================
-- Step 2: Update CHECK constraints to match new column names
-- ============================================================================

-- Drop old constraints
ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_confidence;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_difficulty;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_primary_impression;

-- Recreate with new column names
ALTER TABLE responses 
  ADD CONSTRAINT valid_q3_confidence 
  CHECK (q3_confidence_level >= 1 AND q3_confidence_level <= 5);

ALTER TABLE responses 
  ADD CONSTRAINT valid_q7_difficulty 
  CHECK (q7_difficulty_rating >= 1 AND q7_difficulty_rating <= 5);

ALTER TABLE responses 
  ADD CONSTRAINT valid_q1_primary_impression 
  CHECK (q1_primary_impression IS NULL OR q1_primary_impression IN (
    'visual_appearance',
    'spatial_arrangement',
    'structure_connections',
    'quantities_sizes',
    'changes_movement',
    'organization_grouping',
    'rules_patterns'
  ));

-- ============================================================================
-- Step 3: Update indexes to match new column names
-- ============================================================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_responses_confidence;
DROP INDEX IF EXISTS idx_responses_difficulty;
DROP INDEX IF EXISTS idx_responses_strategy;

-- Create new indexes with logical names
CREATE INDEX idx_responses_q3_confidence ON responses(q3_confidence_level);
CREATE INDEX idx_responses_q7_difficulty ON responses(q7_difficulty_rating);
CREATE INDEX idx_responses_q6_strategy ON responses(q6_strategy_used);

-- Keep the attempt_id index (unchanged)
-- idx_responses_attempt already exists

-- ============================================================================
-- Step 4: Verification
-- ============================================================================

DO $$ 
DECLARE
  column_count INTEGER;
BEGIN 
  -- Count renamed columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'responses' 
    AND column_name LIKE 'q%';
  
  IF column_count = 14 THEN
    RAISE NOTICE 'SUCCESS: All 14 columns renamed successfully';
    RAISE NOTICE 'SUCCESS: Constraints updated';
    RAISE NOTICE 'SUCCESS: Indexes rebuilt';
    RAISE NOTICE 'Migration completed successfully!';
  ELSE
    RAISE EXCEPTION 'Migration verification failed! Expected 14 columns with q prefix, found %', column_count;
  END IF;
END $$;

-- ============================================================================
-- Commit transaction (or rollback if any error occurred)
-- ============================================================================

COMMIT;

-- Print final success message
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '===================================================';
  RAISE NOTICE 'DATABASE REORGANIZATION COMPLETE';
  RAISE NOTICE '===================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run verification script: node server/scripts/verify_migration.js';
  RAISE NOTICE '2. Update backend code (server/index.js)';
  RAISE NOTICE '3. Update frontend components';
  RAISE NOTICE '4. Test complete submission flow';
  RAISE NOTICE '';
END $$;