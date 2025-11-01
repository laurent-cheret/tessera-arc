-- Migration: Simplify Phase 1 to Single Main Idea Question
-- Date: October 30, 2025
-- Purpose: Replace hierarchical Q1 with open-ended "main idea" question

BEGIN;

-- =====================================================
-- Step 1: Add new column for simplified Phase 1
-- =====================================================

ALTER TABLE responses 
ADD COLUMN IF NOT EXISTS q1_main_idea TEXT;

-- =====================================================
-- Step 2: Backup old hierarchical Q1 data (for safety)
-- =====================================================

-- Rename old columns to backup (don't drop yet, in case we need to rollback)
ALTER TABLE responses 
RENAME COLUMN q1_primary_impression TO q1_primary_impression_old;

ALTER TABLE responses 
RENAME COLUMN q1_primary_features TO q1_primary_features_old;

ALTER TABLE responses 
RENAME COLUMN q1_primary_other_text TO q1_primary_other_text_old;

ALTER TABLE responses 
RENAME COLUMN q1_secondary_impressions TO q1_secondary_impressions_old;

-- =====================================================
-- Step 3: Remove old Q2 (initial hypothesis) - now merged into Q1
-- =====================================================

ALTER TABLE responses 
RENAME COLUMN q2_initial_hypothesis TO q2_initial_hypothesis_old;

-- =====================================================
-- Step 4: Drop old Q4 word count (not needed)
-- =====================================================

ALTER TABLE responses 
DROP COLUMN IF EXISTS q4_word_count;

-- =====================================================
-- Step 5: Update constraints
-- =====================================================

-- Drop old constraint on primary impression
ALTER TABLE responses 
DROP CONSTRAINT IF EXISTS valid_q1_primary_impression;

-- =====================================================
-- Step 6: Update indexes
-- =====================================================

-- Drop old indexes that are no longer relevant
DROP INDEX IF EXISTS idx_responses_q1_primary;

-- =====================================================
-- Step 7: Add comments documenting the change
-- =====================================================

COMMENT ON TABLE responses IS 'Updated Oct 30, 2025: Simplified Phase 1 from hierarchical categories to single open-ended main idea question';

COMMENT ON COLUMN responses.q1_main_idea IS 'Phase 1 Q1: What is the main idea of this puzzle? (15-150 words, validated in application)';
COMMENT ON COLUMN responses.q1_primary_impression_old IS 'DEPRECATED: Old hierarchical Q1 primary category (kept for historical data)';
COMMENT ON COLUMN responses.q2_initial_hypothesis_old IS 'DEPRECATED: Old Q2 initial hypothesis (merged into new Q1)';

-- =====================================================
-- Step 8: Create view for new questionnaire structure
-- =====================================================

CREATE OR REPLACE VIEW responses_current_structure AS
SELECT 
    response_id,
    attempt_id,
    
    -- Phase 1: Initial Observations (1 question)
    q1_main_idea,
    
    -- Phase 3: Post-Solving (3 questions)
    q4_what_you_tried,
    q5_hypothesis_revised,
    q5_revision_reason,
    q6_strategy_used,
    
    -- Phase 4: Reflection (2 questions)
    q7_difficulty_rating,
    q8_challenge_factors,
    q8_challenge_other
    
FROM responses;

COMMENT ON VIEW responses_current_structure IS 'Shows only currently-used questionnaire columns (post-Oct 30, 2025 simplification)';

COMMIT;

-- =====================================================
-- Rollback script (if needed)
-- =====================================================

-- To rollback this migration, run:
/*
BEGIN;

-- Restore old column names
ALTER TABLE responses RENAME COLUMN q1_primary_impression_old TO q1_primary_impression;
ALTER TABLE responses RENAME COLUMN q1_primary_features_old TO q1_primary_features;
ALTER TABLE responses RENAME COLUMN q1_primary_other_text_old TO q1_primary_other_text;
ALTER TABLE responses RENAME COLUMN q1_secondary_impressions_old TO q1_secondary_impressions;
ALTER TABLE responses RENAME COLUMN q2_initial_hypothesis_old TO q2_initial_hypothesis;

-- Drop new column
ALTER TABLE responses DROP COLUMN q1_main_idea;

-- Restore Q4 word count
ALTER TABLE responses ADD COLUMN q4_word_count INTEGER;

-- Restore old constraints
ALTER TABLE responses ADD CONSTRAINT valid_q1_primary_impression CHECK (
    q1_primary_impression IS NULL OR q1_primary_impression IN (
        'visual_appearance', 'spatial_arrangement', 'structure_connections',
        'quantities_sizes', 'changes_movement', 'organization_grouping', 'rules_patterns'
    )
);

COMMIT;
*/