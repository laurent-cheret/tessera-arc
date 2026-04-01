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
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// =====================================================
// Middleware
// =====================================================

app.use(helmet());

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 CORS check - Incoming origin:', origin);
    console.log('🔍 Is in allowedOrigins?', allowedOrigins.includes(origin));
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed for:', origin);
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      console.log('❌ Allowed origins are:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
// NEW: CHARACTER LIMIT VALIDATION
// =====================================================

function validateTextLengths(data) {
  const limits = {
    q1_main_idea: 500,
    q3_what_you_tried: 600,
    q3a_what_to_look_for: 400,
    q3b_how_to_transform: 400,
    q3c_how_to_verify: 400,
    q9_revision_reason: 300,
    q8_challenge_other: 200
  };

  for (const [field, maxLength] of Object.entries(limits)) {
    if (data[field] && data[field].length > maxLength) {
      return {
        valid: false,
        field,
        message: `${field} exceeds maximum length of ${maxLength} characters (got ${data[field].length})`
      };
    }
  }

  return { valid: true };
}

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
      tasks_loaded: taskLoader.getTaskCount(),
      bot_protection: 'Cloudflare Turnstile + Honeypots ENABLED'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server running but database unhealthy',
      error: error.message
    });
  }
});

// =====================================================
// BOT PROTECTION: Cloudflare Turnstile Verification
// =====================================================

app.post('/api/verify-turnstile', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    console.warn('❌ Turnstile verification failed: No token provided');
    return res.status(400).json({ success: false, error: 'No token provided' });
  }

  try {
    console.log('🔍 Verifying Turnstile token...');
    
    // Verify with Cloudflare
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token
      })
    });

    const verifyData = await verifyResponse.json();
    console.log('Turnstile verification result:', verifyData);

    if (verifyData.success) {
      // Generate session ID for tracking
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      console.log('✅ Turnstile verification successful:', sessionId);
      
      res.json({ 
        success: true, 
        sessionId,
        message: 'Verification successful' 
      });
    } else {
      console.error('❌ Turnstile verification failed:', verifyData['error-codes']);
      res.status(400).json({ 
        success: false, 
        error: 'Verification failed',
        details: verifyData['error-codes']
      });
    }
  } catch (error) {
    console.error('❌ Turnstile verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error during verification' 
    });
  }
});

// =====================================================
// Participant Management (OPTIMIZED)
// =====================================================

// Create or get participant
app.post('/api/participants', 
  body('sessionId').optional().isLength({ min: 10, max: 100 }),
  handleValidationErrors,
  async (req, res) => {
    try {
      const participantId = req.body.participantId || generateParticipantId(req);
      const { sessionId } = req.body;
      
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
      
      // OPTIMIZED: Removed demographic fields
      const ipHash = hashData(req.ip || 'unknown');
      const userAgentHash = hashData(req.headers['user-agent'] || 'unknown');
      
      await db.query(`
        INSERT INTO participants (
          participant_id,
          session_id,
          ip_address_hash,
          user_agent_hash,
          registration_date,
          last_active_date,
          consent_timestamp,
          data_sharing_consent,
          platform_source
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, 'direct')
      `, [
        participantId,
        sessionId,
        ipHash,
        userAgentHash
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
// Task Management (OPTIMIZED)
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

// Helper function to ensure task exists in database (OPTIMIZED)
async function ensureTaskInDatabase(taskData) {
  try {
    const existing = await db.query(
      'SELECT task_id FROM tasks WHERE task_id = $1',
      [taskData.id]
    );
    
    if (existing.rows.length === 0) {
      // OPTIMIZED: Removed analytical fields
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
          source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'arc_original')
        ON CONFLICT (task_id) DO NOTHING
      `, [
        taskData.id,
        taskData.type,
        JSON.stringify(taskData.input),   // PostgreSQL converts to JSONB automatically
        JSON.stringify(taskData.output),
        JSON.stringify(taskData.test[0]?.input || null),
        JSON.stringify(taskData.test[0]?.output || null),
        taskData.train.length
      ]);
    }
  } catch (error) {
    console.error('Error ensuring task in database:', error);
    // Don't throw - task loading should continue even if DB insert fails
  }
}

// =====================================================
// Data Submission (OPTIMIZED + CHARACTER VALIDATION)
// =====================================================

// Submit complete questionnaire response
app.post('/api/submissions',
  submissionLimiter,
  body('participantId').notEmpty().isLength({ min: 5, max: 100 }),
  body('taskId').notEmpty().isLength({ min: 5, max: 50 }),
  body('verificationSessionId').notEmpty().isString(),
  body('phase1_main_idea').isString().isLength({ min: 15, max: 1000 }),
  body('phase2_solving_process').isObject(),
  body('phase3_post_solving').isObject(),
  body('phase4_reflection').isObject(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        participantId,
        taskId,
        verificationSessionId,
        phase1_main_idea,
        phase2_solving_process,
        phase3_post_solving,
        phase4_reflection,
        totalTimeSeconds
      } = req.body;

      // ========================================
      // BOT PROTECTION: Validate Turnstile session
      // ========================================
      if (!verificationSessionId || !verificationSessionId.startsWith('session_')) {
        console.warn('🤖 Bot blocked: Invalid verification session');
        console.log('Received session ID:', verificationSessionId);
        return res.status(400).json({ error: 'Invalid session' });
      }

      // Check if session is recent (within last hour)
      const sessionParts = verificationSessionId.split('_');
      if (sessionParts.length < 2) {
        console.warn('🤖 Bot blocked: Malformed session ID');
        return res.status(400).json({ error: 'Invalid session format' });
      }

      const sessionTimestamp = parseInt(sessionParts[1]);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      if (isNaN(sessionTimestamp) || sessionTimestamp < oneHourAgo) {
        console.warn('🤖 Bot blocked: Expired verification session');
        console.log('Session timestamp:', sessionTimestamp);
        console.log('Current time:', Date.now());
        console.log('Age (minutes):', Math.floor((Date.now() - sessionTimestamp) / 60000));
        return res.status(400).json({ error: 'Session expired' });
      }

      console.log('✅ Turnstile session validated:', verificationSessionId);
      console.log('   Session age:', Math.floor((Date.now() - sessionTimestamp) / 60000), 'minutes');
      
      // ========================================
      // NEW: CHARACTER LIMIT VALIDATION
      // ========================================
      const validation = validateTextLengths({
        q1_main_idea: phase1_main_idea,
        q3_what_you_tried: phase3_post_solving.q3_what_you_tried,
        q3a_what_to_look_for: phase3_post_solving.q3a_what_to_look_for,
        q3b_how_to_transform: phase3_post_solving.q3b_how_to_transform,
        q3c_how_to_verify: phase3_post_solving.q3c_how_to_verify,
        q9_revision_reason: phase3_post_solving.q9_revision_reason,
        q8_challenge_other: phase4_reflection.q8_challenge_other
      });

      if (!validation.valid) {
        console.warn('🚫 Submission blocked: Character limit exceeded');
        console.log('   Field:', validation.field);
        console.log('   Message:', validation.message);
        return res.status(400).json({
          error: 'Text length validation failed',
          details: validation.message,
          field: validation.field
        });
      }

      console.log('✅ Character limits validated');
      
      // ========================================
      // PHASE 3 VALIDATION: Conditional based on correctness
      // ========================================
      if (typeof phase3_post_solving.q9_hypothesis_revised !== 'boolean') {
        return res.status(400).json({ error: 'q9_hypothesis_revised is required and must be boolean' });
      }
      
      if (phase2_solving_process.isCorrect) {
        // If correct - require teaching questions
        if (!phase3_post_solving.q3a_what_to_look_for || typeof phase3_post_solving.q3a_what_to_look_for !== 'string') {
          return res.status(400).json({ error: 'q3a_what_to_look_for is required for correct solutions' });
        }
        if (!phase3_post_solving.q3b_how_to_transform || typeof phase3_post_solving.q3b_how_to_transform !== 'string') {
          return res.status(400).json({ error: 'q3b_how_to_transform is required for correct solutions' });
        }
        if (!phase3_post_solving.q3c_how_to_verify || typeof phase3_post_solving.q3c_how_to_verify !== 'string') {
          return res.status(400).json({ error: 'q3c_how_to_verify is required for correct solutions' });
        }
      } else {
        // If incorrect - require single attempt question
        if (!phase3_post_solving.q3_what_you_tried || typeof phase3_post_solving.q3_what_you_tried !== 'string') {
          return res.status(400).json({ error: 'q3_what_you_tried is required for incorrect solutions' });
        }
      }
      
      await db.transaction(async (client) => {
        // 1. Create task attempt (OPTIMIZED)
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
            attempt_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed')
        `, [
          attemptId,
          participantId,
          taskId,
          new Date(Date.now() - (totalTimeSeconds * 1000)),
          new Date(),
          totalTimeSeconds,
          JSON.stringify(phase2_solving_process.solutionGrid),  // PostgreSQL converts to JSONB
          phase2_solving_process.isCorrect
          // OPTIMIZED: Removed attempt_number, correctness_score, device_type, browser, screen_resolution
        ]);
        
        // 2. Create response record
        const responseId = db.generateId('response');

        await client.query(`
          INSERT INTO responses (
            response_id,
            attempt_id,
            q1_main_idea,
            q9_hypothesis_revised,
            q9_revision_reason,
            q3a_what_to_look_for,
            q3b_how_to_transform,
            q3c_how_to_verify,
            q3_what_you_tried,
            q7_difficulty_rating,
            q8_challenge_factors,
            q8_challenge_other
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          responseId,
          attemptId,
          // Phase 1: Main Idea
          phase1_main_idea,
          // Phase 3: Post-solving (conditional based on correctness)
          phase3_post_solving.q9_hypothesis_revised,
          phase3_post_solving.q9_revision_reason || null,
          phase3_post_solving.q3a_what_to_look_for || null,  // If correct
          phase3_post_solving.q3b_how_to_transform || null,  // If correct
          phase3_post_solving.q3c_how_to_verify || null,     // If correct
          phase3_post_solving.q3_what_you_tried || null,     // If incorrect
          // Phase 4: Reflection
          phase4_reflection.q7_difficulty_rating || null,
          phase4_reflection.q8_challenge_factors ? JSON.stringify(phase4_reflection.q8_challenge_factors) : null,
          phase4_reflection.q8_challenge_other || null
        ]);
        

        // 3. Insert action traces (OPTIMIZED - NO action_id)
        if (phase2_solving_process.actionLog && phase2_solving_process.actionLog.length > 0) {
          for (const action of phase2_solving_process.actionLog) {
            let cellRow = null;
            let cellColumn = null;
            let oldValue = null;
            let newValue = null;
            let gridStateAfter = null;
            
            if (action.type === 'cell_change') {
              cellRow = action.row !== undefined && action.row !== null ? action.row : null;
              cellColumn = action.col !== undefined && action.col !== null ? action.col : null;
              oldValue = action.oldValue !== undefined && action.oldValue !== null ? action.oldValue : null;
              newValue = action.newValue !== undefined && action.newValue !== null ? action.newValue : null;
              
            } else if (action.type === 'resize') {
              gridStateAfter = JSON.stringify({
                newRows: action.newRows,
                newCols: action.newCols,
                actionType: 'resize'
              });
              
            } else if (action.type === 'reset') {
              gridStateAfter = JSON.stringify({
                actionType: 'reset',
                description: 'Grid cleared to all zeros'
              });
              
            } else if (action.type === 'copy_from_input') {
              gridStateAfter = JSON.stringify({
                actionType: 'copy_from_input', 
                description: 'Grid restored to original input state'
              });
              
            } else if (action.type === 'test_solution') {
              gridStateAfter = JSON.stringify({
                actionType: 'test_solution',
                result: action.result || 'unknown',
                incorrectCells: action.incorrectCells || null
              });
              
            } else if (action.type === 'select_region') {
              gridStateAfter = JSON.stringify({
                actionType: 'select_region',
                startRow: action.startRow,
                startCol: action.startCol,
                endRow: action.endRow,
                endCol: action.endCol,
                color: action.color,
                cellsAffected: action.cellsAffected
              });
              
            } else if (action.type === 'fill_all') {
              gridStateAfter = JSON.stringify({
                actionType: 'fill_all',
                color: action.color
              });
            }
            
            // OPTIMIZED: No action_id - using composite primary key (attempt_id + sequence_number)
            await client.query(`
              INSERT INTO action_traces (
                attempt_id,
                sequence_number,
                action_type,
                cell_row,
                cell_column,
                color_value_before,
                color_value_after,
                timestamp_ms,
                grid_state_after
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
              attemptId,
              action.actionNumber,
              action.type,
              cellRow,
              cellColumn,
              oldValue,
              newValue,
              action.timestamp - Date.now() + (totalTimeSeconds * 1000),  // Milliseconds since attempt start
              gridStateAfter
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
    
    res.json({
      summary: stats.rows[0],
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
      SELECT 
        r.response_id,
        r.attempt_id,
        r.q1_main_idea,
        r.q3_what_you_tried,
        r.q3a_what_to_look_for,
        r.q3b_how_to_transform,
        r.q3c_how_to_verify,
        r.q9_hypothesis_revised,
        r.q9_revision_reason,
        r.q7_difficulty_rating,
        r.q8_challenge_factors,
        ta.task_id,
        ta.is_correct,
        ta.duration_seconds
      FROM responses r
      JOIN task_attempts ta ON r.attempt_id = ta.attempt_id
      WHERE ta.attempt_status = 'completed'
      LIMIT $1
    `, [limit]);
    
    if (format === 'csv') {
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
        r.q7_difficulty_rating,
        r.q1_main_idea
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
// Analytics — Grid Reconstruction Helpers
// =====================================================

function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

function hashGrid(grid) {
  return JSON.stringify(grid);
}

// Reconstruct grid state snapshots from action traces.
// Every action that changes the grid emits a snapshot.
// Special events (test, reset, resize, etc.) are tagged with their event type.
// Cell edits are tagged 'edit'.
function reconstructGridPath(actions, testInput) {
  let grid = [[0,0,0],[0,0,0],[0,0,0]]; // App.js always starts with blank 3×3
  const snapshots = [
    { event: 'start', grid: cloneGrid(grid), timestamp_ms: 0 }
  ];

  for (const action of actions) {
    const meta = action.grid_state_after;

    switch (action.action_type) {

      case 'cell_change':
        if (action.cell_row !== null && action.cell_column !== null) {
          while (grid.length <= action.cell_row) {
            grid.push(new Array(grid[0]?.length || 1).fill(0));
          }
          while (grid[action.cell_row] && grid[action.cell_row].length <= action.cell_column) {
            grid[action.cell_row].push(0);
          }
          if (grid[action.cell_row]) {
            grid[action.cell_row][action.cell_column] = action.color_value_after ?? 0;
          }
        }
        snapshots.push({ event: 'edit', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms });
        break;

      case 'select_region':
        if (meta && meta.color !== undefined) {
          const { startRow, startCol, endRow, endCol, color } = meta;
          const minR = Math.min(startRow ?? 0, endRow ?? 0);
          const maxR = Math.max(startRow ?? 0, endRow ?? 0);
          const minC = Math.min(startCol ?? 0, endCol ?? 0);
          const maxC = Math.max(startCol ?? 0, endCol ?? 0);
          for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
              if (grid[r] && c < grid[r].length) grid[r][c] = color;
            }
          }
        }
        snapshots.push({ event: 'edit', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms });
        break;

      case 'fill_all':
        if (meta && meta.color !== undefined) {
          grid = grid.map(row => row.map(() => meta.color));
        }
        snapshots.push({ event: 'edit', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms });
        break;

      case 'reset':
        grid = [[0,0,0],[0,0,0],[0,0,0]];
        snapshots.push({ event: 'reset', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms });
        break;

      case 'clear':
        grid = grid.map(row => row.map(() => 0));
        snapshots.push({ event: 'clear', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms });
        break;

      case 'copy_from_input':
        if (testInput) {
          grid = testInput.map(row => [...row]);
          snapshots.push({ event: 'copy_from_input', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms });
        }
        break;

      case 'resize':
        if (meta && meta.newRows && meta.newCols) {
          const { newRows, newCols } = meta;
          const newGrid = Array(newRows).fill(null).map((_, ri) =>
            Array(newCols).fill(null).map((_, ci) => {
              if (ri < grid.length && ci < (grid[ri]?.length || 0)) return grid[ri][ci];
              return 0;
            })
          );
          grid = newGrid;
          snapshots.push({ event: 'resize', grid: cloneGrid(grid), timestamp_ms: action.timestamp_ms, newRows, newCols });
        }
        break;

      case 'test_solution':
        snapshots.push({
          event: 'test_solution',
          grid: cloneGrid(grid),
          timestamp_ms: action.timestamp_ms,
          result: meta?.result || 'unknown',
          incorrect_cells: meta?.incorrectCells ?? null
        });
        break;

      default:
        break;
    }
  }

  return snapshots;
}

// =====================================================
// Analytics Dashboard Endpoints
// =====================================================

// Overview: rich aggregate stats
app.get('/api/analytics/overview', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM task_attempts WHERE attempt_status = 'completed') as total_submissions,
        (SELECT COUNT(DISTINCT participant_id) FROM task_attempts WHERE attempt_status = 'completed') as total_participants,
        (SELECT COUNT(DISTINCT task_id) FROM task_attempts WHERE attempt_status = 'completed') as unique_tasks_attempted,
        (SELECT ROUND(AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) FROM task_attempts WHERE attempt_status = 'completed' AND is_correct IS NOT NULL) as accuracy_percent,
        (SELECT ROUND(AVG(duration_seconds)) FROM task_attempts WHERE attempt_status = 'completed' AND duration_seconds IS NOT NULL) as avg_duration_seconds,
        (SELECT ROUND(AVG(r.q7_difficulty_rating::numeric), 2) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed' AND r.q7_difficulty_rating IS NOT NULL) as avg_difficulty,
        (SELECT ROUND(AVG(CASE WHEN r.q9_hypothesis_revised THEN 1.0 ELSE 0.0 END) * 100, 1) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed') as pct_revised_hypothesis,
        (SELECT COUNT(*) FROM task_attempts WHERE attempt_status = 'completed' AND is_correct = true) as correct_count,
        (SELECT COUNT(*) FROM task_attempts WHERE attempt_status = 'completed' AND is_correct = false) as incorrect_count,
        (SELECT ROUND(AVG(LENGTH(r.q1_main_idea))) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed' AND r.q1_main_idea IS NOT NULL) as avg_q1_length,
        (SELECT ROUND(AVG(LENGTH(r.q3a_what_to_look_for))) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed' AND r.q3a_what_to_look_for IS NOT NULL) as avg_q3a_length,
        (SELECT ROUND(AVG(LENGTH(r.q3b_how_to_transform))) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed' AND r.q3b_how_to_transform IS NOT NULL) as avg_q3b_length,
        (SELECT ROUND(AVG(LENGTH(r.q3c_how_to_verify))) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed' AND r.q3c_how_to_verify IS NOT NULL) as avg_q3c_length,
        (SELECT ROUND(AVG(LENGTH(r.q3_what_you_tried))) FROM responses r JOIN task_attempts ta ON r.attempt_id = ta.attempt_id WHERE ta.attempt_status = 'completed' AND r.q3_what_you_tried IS NOT NULL) as avg_q3_incorrect_length
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
});

// Submissions over time — daily counts, last 90 days
app.get('/api/analytics/submissions-over-time', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        DATE(attempt_end_time) as date,
        COUNT(*) as total,
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct
      FROM task_attempts
      WHERE attempt_status = 'completed'
        AND attempt_end_time >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(attempt_end_time)
      ORDER BY date ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching submissions over time:', error);
    res.status(500).json({ error: 'Failed to fetch submissions over time' });
  }
});

// Difficulty distribution — ratings 1–5
app.get('/api/analytics/difficulty-distribution', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        r.q7_difficulty_rating as rating,
        COUNT(*) as count
      FROM responses r
      JOIN task_attempts ta ON r.attempt_id = ta.attempt_id
      WHERE ta.attempt_status = 'completed'
        AND r.q7_difficulty_rating IS NOT NULL
      GROUP BY r.q7_difficulty_rating
      ORDER BY rating ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching difficulty distribution:', error);
    res.status(500).json({ error: 'Failed to fetch difficulty distribution' });
  }
});

// Challenge factors — Q8 checkbox counts
app.get('/api/analytics/challenge-factors', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        factor,
        COUNT(*) as count
      FROM responses r
      JOIN task_attempts ta ON r.attempt_id = ta.attempt_id
      CROSS JOIN LATERAL jsonb_array_elements_text(r.q8_challenge_factors) AS factor
      WHERE ta.attempt_status = 'completed'
        AND r.q8_challenge_factors IS NOT NULL
        AND jsonb_typeof(r.q8_challenge_factors) = 'array'
      GROUP BY factor
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching challenge factors:', error);
    res.status(500).json({ error: 'Failed to fetch challenge factors' });
  }
});

// Top 15 most attempted tasks
app.get('/api/analytics/top-tasks', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        ta.task_id,
        COUNT(*) as attempt_count,
        ROUND(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) as accuracy_percent,
        ROUND(AVG(ta.duration_seconds)) as avg_duration_seconds,
        ROUND(AVG(r.q7_difficulty_rating::numeric), 1) as avg_difficulty
      FROM task_attempts ta
      LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
      WHERE ta.attempt_status = 'completed'
      GROUP BY ta.task_id
      ORDER BY attempt_count DESC
      LIMIT 15
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching top tasks:', error);
    res.status(500).json({ error: 'Failed to fetch top tasks' });
  }
});

// Solve time distribution — bucketed
app.get('/api/analytics/duration-distribution', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        CASE
          WHEN duration_seconds < 60 THEN '< 1 min'
          WHEN duration_seconds < 180 THEN '1-3 min'
          WHEN duration_seconds < 360 THEN '3-6 min'
          WHEN duration_seconds < 600 THEN '6-10 min'
          WHEN duration_seconds < 900 THEN '10-15 min'
          ELSE '> 15 min'
        END as bucket,
        CASE
          WHEN duration_seconds < 60 THEN 1
          WHEN duration_seconds < 180 THEN 2
          WHEN duration_seconds < 360 THEN 3
          WHEN duration_seconds < 600 THEN 4
          WHEN duration_seconds < 900 THEN 5
          ELSE 6
        END as sort_order,
        COUNT(*) as count
      FROM task_attempts
      WHERE attempt_status = 'completed'
        AND duration_seconds IS NOT NULL
      GROUP BY bucket, sort_order
      ORDER BY sort_order ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching duration distribution:', error);
    res.status(500).json({ error: 'Failed to fetch duration distribution' });
  }
});

// List all tasks that have at least one completed attempt (for task selector)
app.get('/api/analytics/tasks-with-attempts', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        ta.task_id,
        COUNT(*) as attempt_count,
        ROUND(AVG(CASE WHEN ta.is_correct THEN 1.0 ELSE 0.0 END) * 100, 1) as accuracy_percent,
        ROUND(AVG(ta.duration_seconds)) as avg_duration_seconds,
        MAX(ta.attempt_end_time) as last_attempted
      FROM task_attempts ta
      WHERE ta.attempt_status = 'completed'
      GROUP BY ta.task_id
      ORDER BY attempt_count DESC, last_attempted DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks with attempts:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Full task explorer: task grids + all attempts with reconstructed grid paths
app.get('/api/analytics/task-explorer/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    // 1. Get task grids
    const taskResult = await db.query(
      `SELECT task_id, task_set, input_grids, output_grids, test_input_grid,
              ground_truth_output, number_of_examples
       FROM tasks WHERE task_id = $1`,
      [taskId]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskResult.rows[0];

    // 2. Get all completed attempts with responses
    const attemptsResult = await db.query(`
      SELECT
        ta.attempt_id,
        ta.participant_id,
        ta.is_correct,
        ta.duration_seconds,
        ta.attempt_end_time,
        ta.submitted_solution,
        r.q1_main_idea,
        r.q3a_what_to_look_for,
        r.q3b_how_to_transform,
        r.q3c_how_to_verify,
        r.q3_what_you_tried,
        r.q7_difficulty_rating,
        r.q9_hypothesis_revised,
        r.q9_revision_reason,
        r.q8_challenge_factors
      FROM task_attempts ta
      LEFT JOIN responses r ON ta.attempt_id = r.attempt_id
      WHERE ta.task_id = $1 AND ta.attempt_status = 'completed'
      ORDER BY ta.attempt_end_time ASC
    `, [taskId]);

    if (attemptsResult.rows.length === 0) {
      return res.json({ task, attempts: [], state_convergence: [] });
    }

    // 3. Reconstruct path for each attempt
    const testInput = task.test_input_grid;
    const attempts = await Promise.all(attemptsResult.rows.map(async (attempt) => {
      const tracesResult = await db.query(`
        SELECT action_type, cell_row, cell_column,
               color_value_before, color_value_after,
               timestamp_ms, grid_state_after
        FROM action_traces
        WHERE attempt_id = $1
        ORDER BY sequence_number ASC
      `, [attempt.attempt_id]);

      const actions = tracesResult.rows;

      const actionBreakdown = actions.reduce((acc, a) => {
        acc[a.action_type] = (acc[a.action_type] || 0) + 1;
        return acc;
      }, {});

      const path = reconstructGridPath(actions, testInput);

      return {
        attempt_id: attempt.attempt_id,
        participant_id: attempt.participant_id.substring(0, 12) + '…',
        is_correct: attempt.is_correct,
        duration_seconds: attempt.duration_seconds,
        q1_main_idea: attempt.q1_main_idea,
        q3a_what_to_look_for: attempt.q3a_what_to_look_for,
        q3b_how_to_transform: attempt.q3b_how_to_transform,
        q3c_how_to_verify: attempt.q3c_how_to_verify,
        q3_what_you_tried: attempt.q3_what_you_tried,
        q7_difficulty_rating: attempt.q7_difficulty_rating,
        q9_hypothesis_revised: attempt.q9_hypothesis_revised,
        q9_revision_reason: attempt.q9_revision_reason,
        q8_challenge_factors: attempt.q8_challenge_factors,
        action_count: actions.length,
        action_breakdown: actionBreakdown,
        path,
        submitted_solution: attempt.submitted_solution
      };
    }));

    // 4. State convergence: find grid states shared across multiple attempts
    const state_convergence = [];
    if (attempts.length > 1) {
      const stateMap = {};
      attempts.forEach((attempt) => {
        attempt.path.forEach((snapshot, si) => {
          if (snapshot.event === 'start') return; // skip — always identical blank grid
          const hash = hashGrid(snapshot.grid);
          if (!stateMap[hash]) stateMap[hash] = [];
          stateMap[hash].push({ attempt_id: attempt.attempt_id, snapshot_index: si, event: snapshot.event });
        });
      });
      Object.entries(stateMap).forEach(([hash, entries]) => {
        const uniqueAttempts = new Set(entries.map(e => e.attempt_id));
        if (uniqueAttempts.size > 1) {
          state_convergence.push({ grid_hash: hash, occurrences: entries });
        }
      });
    }

    res.json({ task, attempts, state_convergence });

  } catch (error) {
    console.error('Error fetching task explorer:', error);
    res.status(500).json({ error: 'Failed to fetch task explorer data' });
  }
});

// =====================================================
// Error Handling
// =====================================================

// =====================================================
// ARC Prize Live Stats
// =====================================================

const https = require('https');

// Simple in-memory cache: refresh every 6 hours
let arcStatsCache = null;
let arcStatsCachedAt = 0;
const ARC_CACHE_TTL = 6 * 60 * 60 * 1000;

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Tessera-ARC/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

app.get('/api/arc-live-stats', async (req, res) => {
  try {
    const now = Date.now();
    if (arcStatsCache && now - arcStatsCachedAt < ARC_CACHE_TTL) {
      return res.json(arcStatsCache);
    }

    const [evaluations, models] = await Promise.all([
      fetchJSON('https://arcprize.org/media/data/leaderboard/evaluations.json'),
      fetchJSON('https://arcprize.org/media/data/models.json'),
    ]);

    // Build model lookup: id -> displayName
    const modelById = {};
    for (const m of models) modelById[m.id] = m;

    // Focus on ARC-AGI-2 (v2_Semi_Private) — the main active benchmark
    const v2 = evaluations.filter(e => e.datasetId === 'v2_Semi_Private');

    // Human baseline
    const humanEntry = v2.find(e => e.modelId === '2025_human_panel');
    const humanScore = humanEntry ? Math.round(humanEntry.score * 100) : 100;

    // Best AI score (exclude human entries, find highest score under $50/task)
    const humanIds = new Set(['2025_human_panel', 'avg_mturker', 'human_panel', '2024_human_panel']);
    const aiEntries = v2
      .filter(e => !humanIds.has(e.modelId) && e.costPerTask != null && e.costPerTask <= 50)
      .sort((a, b) => b.score - a.score);

    const topAI = aiEntries.slice(0, 3).map(e => ({
      modelId: e.modelId,
      name: modelById[e.modelId]?.displayName || e.modelId,
      score: Math.round(e.score * 100 * 10) / 10,
      costPerTask: e.costPerTask,
    }));

    // Also get ARC-AGI-1 best score for the "historical gap" story
    const v1 = evaluations.filter(e => e.datasetId === 'v1_Semi_Private');
    const v1Human = v1.find(e => e.modelId === '2025_human_panel');
    const v1AI = v1
      .filter(e => !humanIds.has(e.modelId) && e.costPerTask != null && e.costPerTask <= 50)
      .sort((a, b) => b.score - a.score)[0];

    const result = {
      benchmark: 'ARC-AGI-2',
      humanScore,
      topAI,
      bestAIScore: topAI[0]?.score ?? null,
      bestAIName: topAI[0]?.name ?? null,
      v1: {
        humanScore: v1Human ? Math.round(v1Human.score * 100) : 98,
        bestAIScore: v1AI ? Math.round(v1AI.score * 100 * 10) / 10 : null,
        bestAIName: v1AI ? (modelById[v1AI.modelId]?.displayName || v1AI.modelId) : null,
      },
      fetchedAt: new Date().toISOString(),
    };

    arcStatsCache = result;
    arcStatsCachedAt = now;
    res.json(result);
  } catch (err) {
    console.error('ARC live stats fetch error:', err.message);
    // Return fallback data so the page still works
    res.json({
      benchmark: 'ARC-AGI-2',
      humanScore: 100,
      bestAIScore: 83,
      bestAIName: 'GPT-5.4',
      topAI: [{ name: 'GPT-5.4', score: 83, costPerTask: 16.4 }],
      v1: { humanScore: 98, bestAIScore: 55.5, bestAIName: 'o3 (2024)' },
      fetchedAt: null,
    });
  }
});

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
      console.log(`🛡️  Bot protection: Cloudflare Turnstile + Honeypots ENABLED`);
      console.log(`🔐 Turnstile key configured: ${process.env.TURNSTILE_SECRET_KEY ? 'YES' : 'NO'}`);
      console.log(`🔒 Character limits: ENFORCED (500-600 chars per field)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();