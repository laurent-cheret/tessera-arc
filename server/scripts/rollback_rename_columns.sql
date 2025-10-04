-- ============================================================================
-- Rollback Script - Undo Column Reorganization
-- Date: October 4, 2025
-- Purpose: Revert column names back to original names
-- Use: Only if migration needs to be undone
-- ============================================================================

BEGIN;

DO $$ 
BEGIN 
  RAISE NOTICE 'Rolling back database reorganization...';
  RAISE NOTICE 'Restoring original column names';
END $$;

-- ============================================================================
-- Reverse the column renames (Q1-Q8 back to original)
-- ============================================================================

-- Q1 columns -> original names
ALTER TABLE responses 
  RENAME COLUMN q1_primary_impression TO primary_impression;

ALTER TABLE responses 
  RENAME COLUMN q1_primary_features TO primary_features;

ALTER TABLE responses 
  RENAME COLUMN q1_primary_other_text TO primary_other_text;

ALTER TABLE responses 
  RENAME COLUMN q1_secondary_impressions TO secondary_impressions;

-- Q2 -> original
ALTER TABLE responses 
  RENAME COLUMN q2_initial_hypothesis TO initial_hypothesis;

-- Q3 -> original
ALTER TABLE responses 
  RENAME COLUMN q3_confidence_level TO confidence_level;

-- Q4 -> original
ALTER TABLE responses 
  RENAME COLUMN q4_what_you_tried TO transformation_rule_full;

ALTER TABLE responses 
  RENAME COLUMN q4_word_count TO transformation_word_count;

-- Q5 -> original
ALTER TABLE responses 
  RENAME COLUMN q5_hypothesis_revised TO hypothesis_revised;

ALTER TABLE responses 
  RENAME COLUMN q5_revision_reason TO revision_reason;

-- Q6 -> original
ALTER TABLE responses 
  RENAME COLUMN q6_strategy_used TO strategy_used;

-- Q7 -> original
ALTER TABLE responses 
  RENAME COLUMN q7_difficulty_rating TO difficulty_rating;

-- Q8 -> original
ALTER TABLE responses 
  RENAME COLUMN q8_challenge_factors TO challenge_factors;

ALTER TABLE responses 
  RENAME COLUMN q8_challenge_other TO challenge_factors_other;

-- ============================================================================
-- Restore original constraints
-- ============================================================================

ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_q3_confidence;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_q7_difficulty;
ALTER TABLE responses DROP CONSTRAINT IF EXISTS valid_q1_primary_impression;

ALTER TABLE responses 
  ADD CONSTRAINT valid_confidence 
  CHECK (confidence_level >= 1 AND confidence_level <= 5);

ALTER TABLE responses 
  ADD CONSTRAINT valid_difficulty 
  CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5);

ALTER TABLE responses 
  ADD CONSTRAINT valid_primary_impression 
  CHECK (primary_impression IS NULL OR primary_impression IN (
    'visual_appearance',
    'spatial_arrangement',
    'structure_connections',
    'quantities_sizes',
    'changes_movement',
    'organization_grouping',
    'rules_patterns'
  ));

-- ============================================================================
-- Restore original indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_responses_q3_confidence;
DROP INDEX IF EXISTS idx_responses_q7_difficulty;
DROP INDEX IF EXISTS idx_responses_q6_strategy;

CREATE INDEX idx_responses_confidence ON responses(confidence_level);
CREATE INDEX idx_responses_difficulty ON responses(difficulty_rating);
CREATE INDEX idx_responses_strategy ON responses(strategy_used);

-- ============================================================================
-- Verification
-- ============================================================================

DO $$ 
DECLARE
  old_column_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO old_column_count
  FROM information_schema.columns 
  WHERE table_name = 'responses' 
    AND (column_name = 'primary_impression' 
      OR column_name = 'confidence_level'
      OR column_name = 'difficulty_rating');
  
  IF old_column_count = 3 THEN
    RAISE NOTICE 'SUCCESS: Rollback successful - original names restored';
  ELSE
    RAISE EXCEPTION 'Rollback verification failed!';
  END IF;
END $$;

COMMIT;

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE 'ROLLBACK COMPLETE';
  RAISE NOTICE 'Database reverted to original column names';
  RAISE NOTICE '';
END $$;