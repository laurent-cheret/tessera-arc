-- =====================================================
-- OPTIMIZED ARC DATABASE SCHEMA
-- PostgreSQL - Lightweight Version
-- Reduces storage by ~40-60% per submission
-- =====================================================

-- =====================================================
-- 1. PARTICIPANTS TABLE (OPTIMIZED)
-- =====================================================
-- REMOVED: All demographic fields (age_range, gender, education, etc.)
-- REMOVED: Qualification metrics (not used)
-- REMOVED: Inter-annotator agreement (not applicable yet)
-- REMOVED: worker_id_external (not using crowdsourcing platforms)
-- KEPT: Only essential tracking fields

CREATE TABLE IF NOT EXISTS participants (
    -- Primary Key
    participant_id              VARCHAR(50) PRIMARY KEY,
    
    -- Session Tracking (for bot protection)
    session_id                  VARCHAR(100) NOT NULL,
    ip_address_hash             VARCHAR(64) NOT NULL,
    user_agent_hash             VARCHAR(64) NOT NULL,
    
    -- Activity Tracking
    registration_date           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_date            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_tasks_completed       INTEGER DEFAULT 0,
    
    -- Privacy & Consent
    consent_timestamp           TIMESTAMP NOT NULL,
    data_sharing_consent        BOOLEAN DEFAULT FALSE,
    
    -- Platform
    platform_source             VARCHAR(20) DEFAULT 'direct'
);

-- Indexes
CREATE INDEX idx_participants_registration ON participants(registration_date);
CREATE INDEX idx_participants_completed ON participants(total_tasks_completed);

-- =====================================================
-- 2. TASKS TABLE (SIMPLIFIED)
-- =====================================================
-- REMOVED: All analytical fields that are NULL or can be computed
-- REMOVED: task_category, core_knowledge_domain, transformation_type
-- REMOVED: estimated_difficulty, human_accuracy_rate, ai_baseline_accuracy
-- REMOVED: grid_dimensions, color_count, object_count_avg
-- REMOVED: requires_* boolean flags
-- REMOVED: validation_notes
-- KEPT: Only essential task data

CREATE TABLE IF NOT EXISTS tasks (
    -- Primary Key
    task_id                     VARCHAR(50) PRIMARY KEY,
    
    -- Task Classification
    task_set                    VARCHAR(10) NOT NULL,  -- 'training' or 'evaluation'
    
    -- Task Content (JSON)
    input_grids                 JSONB NOT NULL,        -- Use JSONB for better compression
    output_grids                JSONB NOT NULL,
    test_input_grid             JSONB NOT NULL,
    ground_truth_output         JSONB NOT NULL,
    
    -- Metadata
    number_of_examples          SMALLINT NOT NULL,     -- SMALLINT instead of INTEGER (2-4 examples max)
    created_date                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source                      VARCHAR(20) DEFAULT 'arc_original',
    
    CONSTRAINT valid_task_set CHECK (task_set IN ('training', 'evaluation'))
);

-- Indexes
CREATE INDEX idx_tasks_set ON tasks(task_set);

-- =====================================================
-- 3. TASK_ATTEMPTS TABLE (OPTIMIZED)
-- =====================================================
-- REMOVED: attempt_number (always 1, no retries yet)
-- REMOVED: correctness_score (redundant with is_correct)
-- REMOVED: screen_resolution (always NULL)
-- REMOVED: device_type (can extract from user_agent if needed)
-- REMOVED: browser (can extract from user_agent if needed)
-- KEPT: Essential attempt data

CREATE TABLE IF NOT EXISTS task_attempts (
    -- Primary Key
    attempt_id                  VARCHAR(50) PRIMARY KEY,
    
    -- Foreign Keys
    participant_id              VARCHAR(50) REFERENCES participants(participant_id) ON DELETE CASCADE,
    task_id                     VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    
    -- Timing
    attempt_start_time          TIMESTAMP NOT NULL,
    attempt_end_time            TIMESTAMP NOT NULL,
    duration_seconds            INTEGER NOT NULL,
    
    -- Solution (compressed JSON)
    submitted_solution          JSONB NOT NULL,
    is_correct                  BOOLEAN NOT NULL,
    
    -- Status
    attempt_status              VARCHAR(12) DEFAULT 'completed',  -- Reduced size
    
    CONSTRAINT valid_status CHECK (attempt_status IN ('completed', 'abandoned')),
    CONSTRAINT unique_participant_task UNIQUE(participant_id, task_id)  -- One attempt per task
);

-- Indexes
CREATE INDEX idx_attempts_participant ON task_attempts(participant_id);
CREATE INDEX idx_attempts_task ON task_attempts(task_id);
CREATE INDEX idx_attempts_correct ON task_attempts(is_correct);
CREATE INDEX idx_attempts_start_time ON task_attempts(attempt_start_time);

-- =====================================================
-- 4. RESPONSES TABLE (OPTIMIZED)
-- =====================================================
-- REMOVED: Separate view (phase3_response_types) - not needed
-- KEPT: All questionnaire fields (these are the actual data you want!)
-- OPTIMIZED: Using TEXT for responses (PostgreSQL handles compression well)

CREATE TABLE IF NOT EXISTS responses (
    -- Primary Key
    response_id                 VARCHAR(50) PRIMARY KEY,
    
    -- Foreign Key
    attempt_id                  VARCHAR(50) REFERENCES task_attempts(attempt_id) ON DELETE CASCADE UNIQUE,
    
    -- Phase 1: Initial Hypothesis
    q1_main_idea                TEXT NOT NULL,
    
    -- Phase 3: Post-Solving (Conditional)
    q9_hypothesis_revised       BOOLEAN NOT NULL,
    q9_revision_reason          TEXT,  -- NULL if q9 = false
    
    -- For INCORRECT solutions
    q3_what_you_tried           TEXT,
    
    -- For CORRECT solutions (teaching questions)
    q3a_what_to_look_for        TEXT,
    q3b_how_to_transform        TEXT,
    q3c_how_to_verify           TEXT,
    
    -- Phase 4: Reflection
    q7_difficulty_rating        SMALLINT NOT NULL,  -- 1-5, SMALLINT saves space
    q8_challenge_factors        JSONB,              -- NULL if empty
    q8_challenge_other          TEXT,               -- NULL if not provided
    
    CONSTRAINT valid_difficulty CHECK (q7_difficulty_rating BETWEEN 1 AND 5),
    CONSTRAINT valid_phase3_correct CHECK (
        -- If correct: teaching questions required, tried=NULL
        (q3a_what_to_look_for IS NOT NULL AND 
         q3b_how_to_transform IS NOT NULL AND 
         q3c_how_to_verify IS NOT NULL AND 
         q3_what_you_tried IS NULL) OR
        -- If incorrect: tried required, teaching=NULL
        (q3_what_you_tried IS NOT NULL AND 
         q3a_what_to_look_for IS NULL AND 
         q3b_how_to_transform IS NULL AND 
         q3c_how_to_verify IS NULL)
    )
);

-- Index
CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_responses_difficulty ON responses(q7_difficulty_rating);
CREATE INDEX idx_responses_revised ON responses(q9_hypothesis_revised);

-- =====================================================
-- 5. ACTION_TRACES TABLE (OPTIMIZED)
-- =====================================================
-- REMOVED: grid_state_before (always NULL)
-- REMOVED: is_correction (always FALSE)
-- REMOVED: pause_before_action_ms (always NULL)
-- REMOVED: timestamp_absolute (redundant with relative + attempt start time)
-- OPTIMIZED: Using SMALLINT for smaller numbers

CREATE TABLE IF NOT EXISTS action_traces (
    -- Composite Primary Key (saves ~50 bytes per row by removing action_id!)
    attempt_id                  VARCHAR(50) NOT NULL REFERENCES task_attempts(attempt_id) ON DELETE CASCADE,
    sequence_number             SMALLINT NOT NULL,  -- Max ~32k actions per attempt
    
    -- Action Details
    action_type                 VARCHAR(20) NOT NULL,
    
    -- Spatial Information (NULL for non-cell actions)
    cell_row                    SMALLINT,
    cell_column                 SMALLINT,
    
    -- Value Information (NULL for non-cell actions)
    color_value_before          SMALLINT,
    color_value_after           SMALLINT,
    
    -- Timing (milliseconds since attempt start)
    timestamp_ms                INTEGER NOT NULL,
    
    -- State Snapshot (compressed JSON, only for key actions)
    grid_state_after            JSONB,
    
    -- Define composite primary key
    PRIMARY KEY (attempt_id, sequence_number)
);

-- Indexes
CREATE INDEX idx_actions_type ON action_traces(action_type);

-- =====================================================
-- VIEWS (UPDATED FOR NEW SCHEMA)
-- =====================================================

-- Participant Performance
CREATE OR REPLACE VIEW participant_performance AS
SELECT 
    p.participant_id,
    p.registration_date,
    p.total_tasks_completed,
    COALESCE(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END), 0) as accuracy_rate,
    COALESCE(AVG(ta.duration_seconds), 0) as avg_duration_sec,
    COALESCE(AVG(r.q7_difficulty_rating), 0) as avg_perceived_difficulty,
    COUNT(ta.attempt_id) as total_attempts
FROM participants p
LEFT JOIN task_attempts ta ON p.participant_id = ta.participant_id
LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
GROUP BY p.participant_id, p.registration_date, p.total_tasks_completed;

-- Task Difficulty Analysis
CREATE OR REPLACE VIEW task_difficulty_analysis AS
SELECT 
    t.task_id,
    t.task_set,
    COUNT(ta.attempt_id) as attempt_count,
    COALESCE(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END), 0) as accuracy_rate,
    COALESCE(AVG(r.q7_difficulty_rating), 0) as avg_perceived_difficulty,
    COALESCE(AVG(ta.duration_seconds), 0) as avg_duration_sec,
    COALESCE(MIN(ta.duration_seconds), 0) as min_duration_sec,
    COALESCE(MAX(ta.duration_seconds), 0) as max_duration_sec
FROM tasks t
LEFT JOIN task_attempts ta ON t.task_id = ta.task_id
LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
WHERE ta.attempt_status = 'completed'
GROUP BY t.task_id, t.task_set;

-- =====================================================
-- STORAGE OPTIMIZATION SETTINGS
-- =====================================================

-- Enable TOAST compression for TEXT fields (PostgreSQL auto-compresses)
-- This is automatic, but we can ensure it's set

ALTER TABLE responses ALTER COLUMN q1_main_idea SET STORAGE EXTENDED;
ALTER TABLE responses ALTER COLUMN q9_revision_reason SET STORAGE EXTENDED;
ALTER TABLE responses ALTER COLUMN q3_what_you_tried SET STORAGE EXTENDED;
ALTER TABLE responses ALTER COLUMN q3a_what_to_look_for SET STORAGE EXTENDED;
ALTER TABLE responses ALTER COLUMN q3b_how_to_transform SET STORAGE EXTENDED;
ALTER TABLE responses ALTER COLUMN q3c_how_to_verify SET STORAGE EXTENDED;
ALTER TABLE responses ALTER COLUMN q8_challenge_other SET STORAGE EXTENDED;

-- JSONB fields automatically use TOAST compression