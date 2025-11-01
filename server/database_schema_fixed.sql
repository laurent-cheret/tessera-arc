-- ARC Crowdsourcing Platform Database Schema
-- PostgreSQL Version - Updated Oct 31, 2025
-- Phase 3 Conditional Questions (Teaching vs Reflection)

-- =====================================================
-- Core Tables
-- =====================================================

-- 1. PARTICIPANTS Table
CREATE TABLE IF NOT EXISTS participants (
    -- Primary Key
    participant_id              VARCHAR(50) PRIMARY KEY,
    
    -- Demographics (optional - can be NULL for anonymous users)
    age_range                   VARCHAR(20),
    gender                      VARCHAR(20),
    education_level             VARCHAR(50),
    country                     VARCHAR(100),
    native_language             VARCHAR(50),
    occupation_category         VARCHAR(100),
    
    -- Experience & Background
    puzzle_experience           VARCHAR(50),
    coding_experience           VARCHAR(50),
    math_background             VARCHAR(50),
    
    -- Qualification Metrics
    qualification_score         FLOAT,
    auroc2_metacognitive_score  FLOAT,
    
    -- Platform Metadata
    registration_date           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_date            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_tasks_completed       INTEGER DEFAULT 0,
    average_task_duration_sec   INTEGER,
    
    -- Quality Metrics
    average_confidence_accuracy FLOAT,
    inter_annotator_agreement   FLOAT,
    completion_rate             FLOAT,
    
    -- Privacy & Consent
    consent_timestamp           TIMESTAMP,
    data_sharing_consent        BOOLEAN DEFAULT FALSE,
    
    -- Platform-specific
    platform_source             VARCHAR(50) DEFAULT 'direct',
    worker_id_external          VARCHAR(100),
    
    -- Session tracking
    session_id                  VARCHAR(100),
    ip_address_hash             VARCHAR(64),
    user_agent_hash             VARCHAR(64),
    
    CONSTRAINT valid_age_range CHECK (age_range IN (
        '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    ))
);

-- 2. TASKS Table  
CREATE TABLE IF NOT EXISTS tasks (
    -- Primary Key
    task_id                     VARCHAR(50) PRIMARY KEY,
    
    -- Task Classification
    task_set                    VARCHAR(20) NOT NULL,
    arc_version                 VARCHAR(10),
    task_category               VARCHAR(50),
    
    -- Core Knowledge Domain
    core_knowledge_domain       VARCHAR(100),
    
    -- Difficulty Metrics
    estimated_difficulty        FLOAT,
    human_accuracy_rate         FLOAT,
    ai_baseline_accuracy        FLOAT,
    
    -- Task Content (stored as JSON)
    input_grids                 JSON NOT NULL,
    output_grids                JSON NOT NULL,
    test_input_grid             JSON,
    ground_truth_output         JSON,
    
    -- Visual Properties
    grid_dimensions             VARCHAR(50),
    color_count                 INTEGER,
    object_count_avg            INTEGER,
    
    -- Transformation Properties
    transformation_type         VARCHAR(100),
    requires_counting           BOOLEAN DEFAULT FALSE,
    requires_spatial_reasoning  BOOLEAN DEFAULT FALSE,
    requires_pattern_completion BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_date                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source                      VARCHAR(50) DEFAULT 'arc_original',
    number_of_examples          INTEGER,
    
    -- Quality Control
    task_validated              BOOLEAN DEFAULT FALSE,
    validation_notes            TEXT,
    
    CONSTRAINT valid_task_set CHECK (task_set IN ('training', 'evaluation', 'validation', 'test'))
);

-- 3. TASK_ATTEMPTS Table
CREATE TABLE IF NOT EXISTS task_attempts (
    -- Primary Key
    attempt_id                  VARCHAR(50) PRIMARY KEY,
    
    -- Foreign Keys
    participant_id              VARCHAR(50) REFERENCES participants(participant_id) ON DELETE CASCADE,
    task_id                     VARCHAR(50) REFERENCES tasks(task_id) ON DELETE CASCADE,
    
    -- Attempt Metadata
    attempt_number              INTEGER DEFAULT 1,
    attempt_start_time          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempt_end_time            TIMESTAMP,
    duration_seconds            INTEGER,
    
    -- Solution Data
    submitted_solution          JSON,
    is_correct                  BOOLEAN,
    correctness_score           FLOAT,
    
    -- Device & Environment
    device_type                 VARCHAR(50),
    browser                     VARCHAR(50),
    screen_resolution           VARCHAR(20),
    
    -- Status
    attempt_status              VARCHAR(20) DEFAULT 'completed',
    
    CONSTRAINT valid_attempt_number CHECK (attempt_number BETWEEN 1 AND 3),
    CONSTRAINT valid_attempt_status CHECK (attempt_status IN ('completed', 'abandoned', 'timeout', 'error')),
    CONSTRAINT unique_participant_task_attempt UNIQUE(participant_id, task_id, attempt_number)
);

-- 4. RESPONSES Table (UPDATED - Conditional Phase 3 Questions)
CREATE TABLE IF NOT EXISTS responses (
    -- Primary Key
    response_id                 VARCHAR(50) PRIMARY KEY,
    
    -- Foreign Key
    attempt_id                  VARCHAR(50) REFERENCES task_attempts(attempt_id) ON DELETE CASCADE,
    
    -- =====================================================
    -- Phase 1: Initial Hypothesis (BEFORE solving)
    -- =====================================================
    
    -- Q1: Main Idea
    q1_main_idea                TEXT,
    
    -- =====================================================
    -- Phase 3: Post-Solving Questions (AFTER solving)
    -- CONDITIONAL based on correctness (is_correct in task_attempts)
    -- =====================================================
    
    -- Q9: Hypothesis Revision (ALWAYS present)
    q9_hypothesis_revised       BOOLEAN,
    q9_revision_reason          TEXT,
    
    -- Q3 - FOR INCORRECT SOLUTIONS (single question)
    q3_what_you_tried           TEXT,
    
    -- Q3a, Q3b, Q3c - FOR CORRECT SOLUTIONS (teaching questions)
    q3a_what_to_look_for        TEXT,
    q3b_how_to_transform        TEXT,
    q3c_how_to_verify           TEXT,
    
    -- =====================================================
    -- Phase 4: Final Reflection
    -- =====================================================
    
    -- Q7: Difficulty Rating
    q7_difficulty_rating        INTEGER,
    
    -- Q8: Challenge Factors
    q8_challenge_factors        JSON,
    q8_challenge_other          TEXT,
    
    -- =====================================================
    -- Constraints
    -- =====================================================
    
    CONSTRAINT valid_q7_difficulty CHECK (q7_difficulty_rating BETWEEN 1 AND 5)
);

-- Add table comments
COMMENT ON TABLE responses IS 'Questionnaire responses. Updated Oct 31, 2025: Conditional Phase 3 questions based on correctness.';
COMMENT ON COLUMN responses.q1_main_idea IS 'Phase 1 Q1: What is the main idea of this puzzle? (15-40 words)';
COMMENT ON COLUMN responses.q9_hypothesis_revised IS 'Phase 3 Q9: Did you change your mind while solving? (always present)';
COMMENT ON COLUMN responses.q9_revision_reason IS 'Phase 3 Q9 followup: Why did you change? (conditional on q9_hypothesis_revised=true)';
COMMENT ON COLUMN responses.q3_what_you_tried IS 'Phase 3 Q3: What did you try? (only for INCORRECT solutions, 10-60 words)';
COMMENT ON COLUMN responses.q3a_what_to_look_for IS 'Phase 3 Q3a: What to look for? (only for CORRECT solutions, 10-40 words)';
COMMENT ON COLUMN responses.q3b_how_to_transform IS 'Phase 3 Q3b: How to transform? (only for CORRECT solutions, 10-40 words)';
COMMENT ON COLUMN responses.q3c_how_to_verify IS 'Phase 3 Q3c: How to verify? (only for CORRECT solutions, 10-40 words)';

-- 5. ACTION_TRACES Table
CREATE TABLE IF NOT EXISTS action_traces (
    -- Primary Key
    action_id                   VARCHAR(50) PRIMARY KEY,
    
    -- Foreign Key
    attempt_id                  VARCHAR(50) REFERENCES task_attempts(attempt_id) ON DELETE CASCADE,
    
    -- Action Sequence
    sequence_number             INTEGER NOT NULL,
    
    -- Action Details
    action_type                 VARCHAR(50) NOT NULL,
    
    -- Spatial Information
    cell_row                    INTEGER,
    cell_column                 INTEGER,
    
    -- Value Information
    color_value_before          INTEGER,
    color_value_after           INTEGER,
    
    -- Temporal Information
    timestamp_relative_ms       INTEGER NOT NULL,
    timestamp_absolute          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- State Snapshots (for key actions)
    grid_state_before           JSON,
    grid_state_after            JSON,
    
    -- Interaction Context
    is_correction               BOOLEAN DEFAULT FALSE,
    pause_before_action_ms      INTEGER,
    
    CONSTRAINT action_sequence_order UNIQUE(attempt_id, sequence_number)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_registration ON participants(registration_date);
CREATE INDEX IF NOT EXISTS idx_participants_source ON participants(platform_source);
CREATE INDEX IF NOT EXISTS idx_participants_completed ON participants(total_tasks_completed);

-- Tasks  
CREATE INDEX IF NOT EXISTS idx_tasks_set ON tasks(task_set);
CREATE INDEX IF NOT EXISTS idx_tasks_difficulty ON tasks(estimated_difficulty);
CREATE INDEX IF NOT EXISTS idx_tasks_validated ON tasks(task_validated);

-- Task Attempts
CREATE INDEX IF NOT EXISTS idx_attempts_participant ON task_attempts(participant_id);
CREATE INDEX IF NOT EXISTS idx_attempts_task ON task_attempts(task_id);
CREATE INDEX IF NOT EXISTS idx_attempts_correct ON task_attempts(is_correct);
CREATE INDEX IF NOT EXISTS idx_attempts_start_time ON task_attempts(attempt_start_time);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON task_attempts(attempt_status);

-- Responses
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_q7_difficulty ON responses(q7_difficulty_rating);
CREATE INDEX IF NOT EXISTS idx_responses_q9_revised ON responses(q9_hypothesis_revised);

-- Action Traces
CREATE INDEX IF NOT EXISTS idx_actions_attempt ON action_traces(attempt_id);
CREATE INDEX IF NOT EXISTS idx_actions_sequence ON action_traces(attempt_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_actions_type ON action_traces(action_type);
CREATE INDEX IF NOT EXISTS idx_actions_timestamp ON action_traces(timestamp_absolute);

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View: Participant performance summary
CREATE OR REPLACE VIEW participant_performance AS
SELECT 
    p.participant_id,
    p.registration_date,
    p.total_tasks_completed,
    p.average_task_duration_sec,
    COALESCE(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END), 0) as accuracy_rate,
    COALESCE(AVG(r.q7_difficulty_rating), 0) as avg_perceived_difficulty,
    COUNT(ta.attempt_id) as total_attempts
FROM participants p
LEFT JOIN task_attempts ta ON p.participant_id = ta.participant_id
LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
GROUP BY p.participant_id, p.registration_date, p.total_tasks_completed, p.average_task_duration_sec;

-- View: Task difficulty analysis
CREATE OR REPLACE VIEW task_difficulty_analysis AS
SELECT 
    t.task_id,
    t.task_set,
    t.estimated_difficulty,
    COUNT(ta.attempt_id) as attempt_count,
    COALESCE(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END), 0) as actual_accuracy,
    COALESCE(AVG(r.q7_difficulty_rating), 0) as perceived_difficulty,
    COALESCE(AVG(ta.duration_seconds), 0) as avg_solve_time
FROM tasks t
LEFT JOIN task_attempts ta ON t.task_id = ta.task_id
LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
WHERE ta.attempt_status = 'completed'
GROUP BY t.task_id, t.task_set, t.estimated_difficulty;

-- View: Phase 3 response types (teaching vs reflection)
CREATE OR REPLACE VIEW phase3_response_types AS
SELECT 
    r.response_id,
    r.attempt_id,
    ta.is_correct,
    CASE 
        WHEN ta.is_correct THEN 'teaching'
        ELSE 'reflection'
    END as response_type,
    r.q9_hypothesis_revised,
    r.q3_what_you_tried,
    r.q3a_what_to_look_for,
    r.q3b_how_to_transform,
    r.q3c_how_to_verify
FROM responses r
JOIN task_attempts ta ON r.attempt_id = ta.attempt_id;

COMMENT ON VIEW phase3_response_types IS 'Shows which Phase 3 question type was answered based on correctness';