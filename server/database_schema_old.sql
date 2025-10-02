-- ARC Crowdsourcing Platform Database Schema
-- PostgreSQL Version

-- Create database (run this separately)
-- CREATE DATABASE arc_crowdsourcing;

-- =====================================================
-- Core Tables (Phase 1 Implementation)
-- =====================================================

-- 1. PARTICIPANTS Table
CREATE TABLE participants (
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
    ip_address_hash             VARCHAR(64), -- Hashed for privacy
    user_agent_hash             VARCHAR(64), -- Hashed for privacy
    
    CONSTRAINT valid_age_range CHECK (age_range IN (
        '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    ))
);

-- 2. TASKS Table  
CREATE TABLE tasks (
    -- Primary Key
    task_id                     VARCHAR(50) PRIMARY KEY,
    
    -- Task Classification
    task_set                    VARCHAR(20) NOT NULL,
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
CREATE TABLE task_attempts (
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

-- 4. RESPONSES Table
CREATE TABLE responses (
    -- Primary Key
    response_id                 VARCHAR(50) PRIMARY KEY,
    
    -- Foreign Key
    attempt_id                  VARCHAR(50) REFERENCES task_attempts(attempt_id) ON DELETE CASCADE,
    
    -- Q1: First Impressions (Phase 1)
    initial_attention           JSON,
    initial_attention_other     TEXT,
    
    -- Q2: Pattern Hypothesis (Phase 1)
    initial_hypothesis          TEXT,
    initial_hypothesis_word_count INTEGER,
    
    -- Q3: Transformation Rule (Phase 3)
    transformation_rule_full    TEXT,
    transformation_what         TEXT,
    transformation_how          TEXT,
    transformation_conditions   TEXT,
    transformation_word_count   INTEGER,
    
    -- Q4: Confidence Rating (Phase 3)
    confidence_level            INTEGER,
    
    -- Q5: Problem-Solving Strategy (Phase 3)
    strategy_used               VARCHAR(50),
    strategy_other              TEXT,
    
    -- Q6: Step-by-Step Reasoning (Phase 4)
    reasoning_narrative         TEXT,
    reasoning_word_count        INTEGER,
    
    -- Q7: Difficulty Rating (Phase 4)
    difficulty_rating           INTEGER,
    
    -- Q8: Challenge Factors (Phase 4, conditional)
    challenge_factors           JSON,
    challenge_factors_other     TEXT,
    
    -- Q9: Strategy Revision (Phase 4)
    hypothesis_revised          BOOLEAN,
    revision_reason             TEXT,
    
    -- Response Metadata
    response_completion_rate    FLOAT DEFAULT 1.0,
    time_to_complete_responses  INTEGER,
    
    -- Timestamps
    phase1_timestamp            TIMESTAMP,
    phase3_timestamp            TIMESTAMP,
    phase4_timestamp            TIMESTAMP,
    
    CONSTRAINT valid_confidence CHECK (confidence_level BETWEEN 1 AND 5),
    CONSTRAINT valid_difficulty CHECK (difficulty_rating BETWEEN 1 AND 5)
);

-- 5. ACTION_TRACES Table
CREATE TABLE action_traces (
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
CREATE INDEX idx_participants_registration ON participants(registration_date);
CREATE INDEX idx_participants_source ON participants(platform_source);
CREATE INDEX idx_participants_completed ON participants(total_tasks_completed);

-- Tasks  
CREATE INDEX idx_tasks_set ON tasks(task_set);
CREATE INDEX idx_tasks_difficulty ON tasks(estimated_difficulty);
CREATE INDEX idx_tasks_validated ON tasks(task_validated);

-- Task Attempts
CREATE INDEX idx_attempts_participant ON task_attempts(participant_id);
CREATE INDEX idx_attempts_task ON task_attempts(task_id);
CREATE INDEX idx_attempts_correct ON task_attempts(is_correct);
CREATE INDEX idx_attempts_start_time ON task_attempts(attempt_start_time);
CREATE INDEX idx_attempts_status ON task_attempts(attempt_status);

-- Responses
CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_responses_confidence ON responses(confidence_level);
CREATE INDEX idx_responses_strategy ON responses(strategy_used);
CREATE INDEX idx_responses_difficulty ON responses(difficulty_rating);

-- Action Traces
CREATE INDEX idx_actions_attempt ON action_traces(attempt_id);
CREATE INDEX idx_actions_sequence ON action_traces(attempt_id, sequence_number);
CREATE INDEX idx_actions_type ON action_traces(action_type);
CREATE INDEX idx_actions_timestamp ON action_traces(timestamp_absolute);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to generate UUIDs for IDs
CREATE OR REPLACE FUNCTION generate_id(prefix TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN prefix || '_' || REPLACE(gen_random_uuid()::TEXT, '-', '');
END;
$$ LANGUAGE plpgsql;

-- Function to update participant stats
CREATE OR REPLACE FUNCTION update_participant_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE participants 
    SET 
        total_tasks_completed = (
            SELECT COUNT(*) FROM task_attempts 
            WHERE participant_id = NEW.participant_id 
            AND attempt_status = 'completed'
        ),
        last_active_date = CURRENT_TIMESTAMP,
        average_task_duration_sec = (
            SELECT AVG(duration_seconds) FROM task_attempts 
            WHERE participant_id = NEW.participant_id 
            AND duration_seconds IS NOT NULL
        )
    WHERE participant_id = NEW.participant_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update participant stats when task attempt is completed
CREATE TRIGGER trigger_update_participant_stats
    AFTER INSERT OR UPDATE ON task_attempts
    FOR EACH ROW
    WHEN (NEW.attempt_status = 'completed')
    EXECUTE FUNCTION update_participant_stats();

-- =====================================================
-- Sample Data Population Functions
-- =====================================================

-- Function to populate tasks from ARC dataset
CREATE OR REPLACE FUNCTION populate_tasks_from_arc()
RETURNS INTEGER AS $$
DECLARE
    task_count INTEGER := 0;
BEGIN
    -- This will be called from the Node.js application
    -- to populate the tasks table with ARC data
    RETURN task_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View: Complete participant performance
CREATE VIEW participant_performance AS
SELECT 
    p.participant_id,
    p.registration_date,
    p.total_tasks_completed,
    p.average_task_duration_sec,
    COALESCE(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END), 0) as accuracy_rate,
    COALESCE(AVG(r.confidence_level), 0) as avg_confidence,
    COALESCE(AVG(r.difficulty_rating), 0) as avg_perceived_difficulty,
    COUNT(ta.attempt_id) as total_attempts
FROM participants p
LEFT JOIN task_attempts ta ON p.participant_id = ta.participant_id
LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
GROUP BY p.participant_id, p.registration_date, p.total_tasks_completed, p.average_task_duration_sec;

-- View: Task difficulty analysis
CREATE VIEW task_difficulty_analysis AS
SELECT 
    t.task_id,
    t.task_set,
    t.estimated_difficulty,
    COUNT(ta.attempt_id) as attempt_count,
    COALESCE(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END), 0) as actual_accuracy,
    COALESCE(AVG(r.difficulty_rating), 0) as perceived_difficulty,
    COALESCE(AVG(ta.duration_seconds), 0) as avg_solve_time,
    COALESCE(AVG(r.confidence_level), 0) as avg_confidence
FROM tasks t
LEFT JOIN task_attempts ta ON t.task_id = ta.task_id
LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
WHERE ta.attempt_status = 'completed'
GROUP BY t.task_id, t.task_set, t.estimated_difficulty;

-- =====================================================
-- Data Quality Checks
-- =====================================================

-- Function to check data quality
CREATE OR REPLACE FUNCTION check_data_quality()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    count INTEGER,
    description TEXT
) AS $$
BEGIN
    -- Check for incomplete responses
    RETURN QUERY
    SELECT 
        'incomplete_responses'::TEXT,
        'WARNING'::TEXT,
        COUNT(*)::INTEGER,
        'Responses missing required fields'::TEXT
    FROM responses r
    WHERE r.initial_hypothesis IS NULL 
       OR r.transformation_rule_full IS NULL 
       OR r.confidence_level IS NULL;
       
    -- Check for suspiciously fast completions
    RETURN QUERY
    SELECT 
        'fast_completions'::TEXT,
        'WARNING'::TEXT,
        COUNT(*)::INTEGER,
        'Task attempts completed in under 30 seconds'::TEXT
    FROM task_attempts ta
    WHERE ta.duration_seconds < 30 AND ta.attempt_status = 'completed';
    
    -- Check for participants with high activity
    RETURN QUERY
    SELECT 
        'high_activity_participants'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::INTEGER,
        'Participants with more than 50 completed tasks'::TEXT
    FROM participants p
    WHERE p.total_tasks_completed > 50;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Export Functions
-- =====================================================

-- Function to export data for ML training
CREATE OR REPLACE FUNCTION export_training_data()
RETURNS TABLE(
    task_id TEXT,
    input_grids JSON,
    ground_truth_output JSON,
    human_annotations JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.task_id::TEXT,
        t.input_grids,
        t.ground_truth_output,
        json_agg(
            json_build_object(
                'participant_id', ta.participant_id,
                'attempt_id', ta.attempt_id,
                'is_correct', ta.is_correct,
                'duration_seconds', ta.duration_seconds,
                'responses', row_to_json(r.*),
                'action_count', (
                    SELECT COUNT(*) FROM action_traces at 
                    WHERE at.attempt_id = ta.attempt_id
                )
            )
        ) as human_annotations
    FROM tasks t
    JOIN task_attempts ta ON t.task_id = ta.task_id
    JOIN responses r ON ta.attempt_id = r.attempt_id
    WHERE ta.attempt_status = 'completed'
    GROUP BY t.task_id, t.input_grids, t.ground_truth_output;
END;
$$ LANGUAGE plpgsql;