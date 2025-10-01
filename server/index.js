const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Database connection
const db = require('./database/connection');
const taskLoader = require('./taskLoader');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================================
// Middleware
// =====================================================

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Submission rate limiting (stricter)
const submissionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 submissions per 5 minutes
  message: 'Submission rate limit exceeded. Please wait before submitting again.',
});

// =====================================================
// Helper Functions
// =====================================================

// Generate anonymous participant ID
const generateParticipantId = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress;
  const timestamp = Date.now();
  
  // Create hash for privacy
  const hash = crypto.createHash('sha256')
    .update(`${ipAddress}-${userAgent}-${timestamp}`)
    .digest('hex')
    .substring(0, 16);
    
  return `anon_${hash}`;
};

// Hash sensitive data for privacy
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// =====================================================
// Basic Routes
// =====================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({ 
      message: 'ARC Server is running!',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      tasks_loaded: taskLoader.getTaskCount()
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server running but database unhealthy',
      error: error.message
    });
  }
});

// =====================================================
// Participant Management
// =====================================================

// Create or get participant
app.post('/api/participants', 
  body('sessionId').optional().isLength({ min: 10, max: 100 }),
  body('demographics').optional().isObject(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const participantId = req.body.participantId || generateParticipantId(req);
      const { sessionId, demographics = {} } = req.body;
      
      // Check if participant exists
      const existingParticipant = await db.query(
        'SELECT participant_id FROM participants WHERE participant_id = $1',
        [participantId]
      );
      
      if (existingParticipant.rows.length > 0) {
        // Update last active
        await db.query(
          'UPDATE participants SET last_active_date = CURRENT_TIMESTAMP WHERE participant_id = $1',
          [participantId]
        );
        
        return res.json({ 
          participantId,
          status: 'existing',
          message: 'Welcome back!'
        });
      }
      
      // Create new participant
      const ipHash = hashData(req.ip || 'unknown');
      const userAgentHash = hashData(req.headers['user-agent'] || 'unknown');
      
      await db.query(`
        INSERT INTO participants (
          participant_id,
          session_id,
          ip_address_hash,
          user_agent_hash,
          age_range,
          gender,
          education_level,
          country,
          platform_source,
          registration_date,
          last_active_date,
          consent_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        participantId,
        sessionId,
        ipHash,
        userAgentHash,
        demographics.age_range || null,
        demographics.gender || null,
        demographics.education_level || null,
        demographics.country || null,
        'direct'
      ]);
      
      res.json({
        participantId,
        status: 'created',
        message: 'Welcome! Your anonymous ID has been created.'
      });
      
    } catch (error) {
      console.error('Error creating participant:', error);
      res.status(500).json({ error: 'Failed to create participant' });
    }
  }
);

// =====================================================
// Task Management
// =====================================================

// Get random task (updated to save to database)
app.get('/api/arc-tasks', async (req, res) => {
  try {
    const taskData = taskLoader.getRandomTask();
    if (!taskData) {
      return res.status(500).json({ error: 'No tasks available' });
    }
    
    // Ensure task is in database
    await ensureTaskInDatabase(taskData);
    
    res.json({ task: taskData });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Get specific task by ID
app.get('/api/arc-tasks/:taskId', async (req, res) => {
  try {
    const taskData = taskLoader.getTaskById(req.params.taskId);
    if (!taskData) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    await ensureTaskInDatabase(taskData);
    
    res.json({ task: taskData });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Helper function to ensure task exists in database
async function ensureTaskInDatabase(taskData) {
  try {
    const existing = await db.query(
      'SELECT task_id FROM tasks WHERE task_id = $1',
      [taskData.id]
    );
    
    if (existing.rows.length === 0) {
      // Insert task into database
      await db.query(`
        INSERT INTO tasks (
          task_id,
          task_set,
          input_grids,
          output_grids,
          test_input_grid,
          ground_truth_output,
          number_of_examples,
          created_date,
          source,
          task_validated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8, TRUE)
        ON CONFLICT (task_id) DO NOTHING
      `, [
        taskData.id,
        taskData.type,
        JSON.stringify(taskData.input),
        JSON.stringify(taskData.output),
        JSON.stringify(taskData.test[0]?.input || null),
        JSON.stringify(taskData.test[0]?.output || null),
        taskData.train.length,
        'arc_original'
      ]);
    }
  } catch (error) {
    console.error('Error ensuring task in database:', error);
    // Don't throw - task loading should continue even if DB insert fails
  }
}

// =====================================================
// Data Submission
// =====================================================

// Submit complete questionnaire response
app.post('/api/submissions',
  submissionLimiter,
  body('participantId').notEmpty().isLength({ min: 5, max: 100 }),
  body('taskId').notEmpty().isLength({ min: 5, max: 50 }),
  body('phase1_initial_observations').isObject(),
  body('phase2_solving_process').isObject(),
  body('phase3_post_solving').isObject(),
  body('phase4_reflection').isObject(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        participantId,
        taskId,
        taskType,
        phase1_initial_observations,
        phase2_solving_process,
        phase3_post_solving,
        phase4_reflection,
        submissionTimestamp,
        totalTimeSeconds
      } = req.body;
      
      await db.transaction(async (client) => {
        // 1. Create task attempt
        const attemptId = db.generateId('attempt');
        
        await client.query(`
          INSERT INTO task_attempts (
            attempt_id,
            participant_id,
            task_id,
            attempt_start_time,
            attempt_end_time,
            duration_seconds,
            submitted_solution,
            is_correct,
            correctness_score,
            device_type,
            browser,
            attempt_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          attemptId,
          participantId,
          taskId,
          new Date(Date.now() - (totalTimeSeconds * 1000)),
          new Date(),
          totalTimeSeconds,
          JSON.stringify(phase2_solving_process.solutionGrid),
          phase2_solving_process.isCorrect,
          phase2_solving_process.isCorrect ? 1.0 : 0.0,
          'desktop', // TODO: Detect from user agent
          req.headers['user-agent']?.split(' ')[0] || 'unknown',
          'completed'
        ]);
        
        // 2. Create response record
        const responseId = db.generateId('response');

        await client.query(`
          INSERT INTO responses (
            response_id,
            attempt_id,
            primary_impression,
            primary_features,
            primary_other_text,
            secondary_impressions,
            initial_hypothesis,
            confidence_level,
            transformation_rule_full,
            transformation_word_count,
            hypothesis_revised,
            revision_reason,
            strategy_used,
            difficulty_rating,
            challenge_factors,
            challenge_factors_other
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          responseId,
          attemptId,
          // Q1 hierarchical
          phase1_initial_observations.primaryImpression || null,
          phase1_initial_observations.primaryFeatures ? JSON.stringify(phase1_initial_observations.primaryFeatures) : null,
          phase1_initial_observations.primaryOtherText || null,
          phase1_initial_observations.secondaryImpressions ? JSON.stringify(phase1_initial_observations.secondaryImpressions) : null,
          // Q2
          phase1_initial_observations.initialHypothesis || null,
          // Q4 (confidence - moved to Phase 1)
          phase1_initial_observations.hypothesisConfidence || null,
          // Phase 3 - Q3 (what you tried)
          phase3_post_solving.q3_what_you_tried || null,
          phase3_post_solving.q3_word_count || null,
          // Phase 3 - Q9 (revision - moved from Phase 4)
          phase3_post_solving.q9_hypothesis_revised || null,
          phase3_post_solving.q9_revision_reason || null,
          // Phase 3 - Q5 (strategy)
          phase3_post_solving.q5_strategy_used || null,
          // Phase 4 - Q7 (difficulty)
          phase4_reflection.q7_difficulty_rating || null,
          // Phase 4 - Q8 (challenges)
          phase4_reflection.q8_challenge_factors ? JSON.stringify(phase4_reflection.q8_challenge_factors) : null,
          phase4_reflection.q8_challenge_other || null
        ]);
        

        // 3. Insert action traces (ENHANCED VERSION - Stores resize dimensions)
        if (phase2_solving_process.actionLog && phase2_solving_process.actionLog.length > 0) {
          for (const action of phase2_solving_process.actionLog) {
            const actionId = db.generateId('action');
            
            // Handle different action types with proper data storage
            let cellRow = null;
            let cellColumn = null;
            let oldValue = null;
            let newValue = null;
            let gridStateAfter = null;
            
            if (action.type === 'cell_change') {
              // Cell change actions
              cellRow = action.row !== undefined && action.row !== null ? action.row : null;
              cellColumn = action.col !== undefined && action.col !== null ? action.col : null;
              oldValue = action.oldValue !== undefined && action.oldValue !== null ? action.oldValue : null;
              newValue = action.newValue !== undefined && action.newValue !== null ? action.newValue : null;
              
            } else if (action.type === 'resize') {
              // FIXED: Store resize dimensions
              gridStateAfter = JSON.stringify({
                newRows: action.newRows,
                newCols: action.newCols,
                actionType: 'resize'
              });
              
            } else if (action.type === 'reset') {
              // Store reset action metadata
              gridStateAfter = JSON.stringify({
                actionType: 'reset',
                description: 'Grid cleared to all zeros'
              });
              
            } else if (action.type === 'copy_from_input') {
              // Store copy action metadata
              gridStateAfter = JSON.stringify({
                actionType: 'copy_from_input', 
                description: 'Grid restored to original input state'
              });
            }
            
            // DEBUG: Log what we're about to insert
            console.log('🔍 Inserting action:', {
              actionNumber: action.actionNumber,
              type: action.type,
              row: cellRow,
              col: cellColumn,
              oldValue,
              newValue,
              gridStateAfter: gridStateAfter ? JSON.parse(gridStateAfter) : null
            });
            
            await client.query(`
              INSERT INTO action_traces (
                action_id,
                attempt_id,
                sequence_number,
                action_type,
                cell_row,
                cell_column,
                color_value_before,
                color_value_after,
                timestamp_relative_ms,
                timestamp_absolute,
                grid_state_after
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              actionId,
              attemptId,
              action.actionNumber,
              action.type,
              cellRow,           
              cellColumn,        
              oldValue,          
              newValue,          
              action.timestamp - Date.now() + (totalTimeSeconds * 1000),
              new Date(action.timestamp),
              gridStateAfter    // FIXED: Now stores action-specific metadata
            ]);
          }
        }
      });
      
      console.log(`✅ Submission saved for participant ${participantId}, task ${taskId}`);
      
      res.json({
        success: true,
        message: 'Submission saved successfully',
        submissionId: db.generateId('submission')
      });
      
    } catch (error) {
      console.error('Error saving submission:', error);
      res.status(500).json({ 
        error: 'Failed to save submission',
        details: error.message 
      });
    }
  }
);

// =====================================================
// Analytics & Export Endpoints
// =====================================================

// Get basic statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM participants) as total_participants,
        (SELECT COUNT(*) FROM task_attempts WHERE attempt_status = 'completed') as total_attempts,
        (SELECT COUNT(DISTINCT task_id) FROM task_attempts) as unique_tasks_attempted,
        (SELECT AVG(duration_seconds) FROM task_attempts WHERE duration_seconds IS NOT NULL) as avg_completion_time,
        (SELECT AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) FROM task_attempts WHERE is_correct IS NOT NULL) as overall_accuracy
    `);
    
    const qualityCheck = await db.query('SELECT * FROM check_data_quality()');
    
    res.json({
      summary: stats.rows[0],
      quality_checks: qualityCheck.rows,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Export data for research (admin endpoint)
app.get('/api/export/training-data', async (req, res) => {
  try {
    const { format = 'json', limit = 1000 } = req.query;
    
    const result = await db.query(`
      SELECT * FROM export_training_data()
      LIMIT $1
    `, [limit]);
    
    if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = convertToCSV(result.rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=arc_training_data.csv');
      res.send(csv);
    } else {
      res.json({
        data: result.rows,
        count: result.rows.length,
        exported_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Helper function to convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'object' ? JSON.stringify(value) : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// =====================================================
// Admin Endpoints
// =====================================================

// Get recent submissions (admin)
app.get('/api/admin/recent-submissions', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const result = await db.query(`
      SELECT 
        ta.attempt_id,
        ta.participant_id,
        ta.task_id,
        ta.attempt_start_time,
        ta.duration_seconds,
        ta.is_correct,
        r.confidence_level,
        r.difficulty_rating,
        r.strategy_used
      FROM task_attempts ta
      LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
      WHERE ta.attempt_status = 'completed'
      ORDER BY ta.attempt_start_time DESC
      LIMIT $1
    `, [limit]);
    
    res.json({
      submissions: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching recent submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// =====================================================
// Error Handling
// =====================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// =====================================================
// Server Startup
// =====================================================

const startServer = async () => {
  try {
    // Test database connection
    await db.healthCheck();
    console.log('🔗 Database connection verified');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🎯 Tasks loaded: ${taskLoader.getTaskCount()}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();