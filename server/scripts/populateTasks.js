const fs = require('fs');
const path = require('path');
const db = require('../database/connection');
require('dotenv').config();

async function populateTasks() {
  console.log('📚 Populating ARC tasks into database...');
  
  try {
    // Step 1: Connect to database
    const healthCheck = await db.healthCheck();
    if (healthCheck.status !== 'healthy') {
      throw new Error('Database is not healthy');
    }
    console.log('✅ Database connection verified');
    
    // Step 2: Load tasks from filesystem
    console.log('📁 Loading ARC tasks from data directory...');
    
    const dataDir = path.join(__dirname, '../../data');
    const trainingDir = path.join(dataDir, 'training');
    const evaluationDir = path.join(dataDir, 'evaluation');
    
    if (!fs.existsSync(trainingDir) || !fs.existsSync(evaluationDir)) {
      throw new Error(`ARC data directories not found. Expected:\n  ${trainingDir}\n  ${evaluationDir}`);
    }
    
    // Step 3: Process training tasks
    console.log('🔄 Processing training tasks...');
    const trainingFiles = fs.readdirSync(trainingDir).filter(file => file.endsWith('.json'));
    let trainingCount = 0;
    
    for (const file of trainingFiles) {
      const taskId = file.replace('.json', '');
      const filePath = path.join(trainingDir, file);
      const taskData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      await insertTask(taskId, 'training', taskData);
      trainingCount++;
      
      if (trainingCount % 50 === 0) {
        console.log(`   📝 Processed ${trainingCount}/${trainingFiles.length} training tasks...`);
      }
    }
    
    console.log(`✅ Inserted ${trainingCount} training tasks`);
    
    // Step 4: Process evaluation tasks
    console.log('🔄 Processing evaluation tasks...');
    const evaluationFiles = fs.readdirSync(evaluationDir).filter(file => file.endsWith('.json'));
    let evaluationCount = 0;
    
    for (const file of evaluationFiles) {
      const taskId = file.replace('.json', '');
      const filePath = path.join(evaluationDir, file);
      const taskData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      await insertTask(taskId, 'evaluation', taskData);
      evaluationCount++;
      
      if (evaluationCount % 50 === 0) {
        console.log(`   📝 Processed ${evaluationCount}/${evaluationFiles.length} evaluation tasks...`);
      }
    }
    
    console.log(`✅ Inserted ${evaluationCount} evaluation tasks`);
    
    // Step 5: Verify insertion
    console.log('🔍 Verifying task insertion...');
    const taskCountResult = await db.query(`
      SELECT 
        task_set,
        COUNT(*) as count,
        AVG(number_of_examples) as avg_examples
      FROM tasks 
      GROUP BY task_set 
      ORDER BY task_set
    `);
    
    console.log('📊 Task summary:');
    taskCountResult.rows.forEach(row => {
      console.log(`   ${row.task_set}: ${row.count} tasks (avg ${Math.round(row.avg_examples)} examples each)`);
    });
    
    const totalTasks = trainingCount + evaluationCount;
    console.log(`\n🎉 Successfully populated ${totalTasks} ARC tasks into database!`);
    
    // Step 6: Update task statistics
    console.log('📈 Updating task statistics...');
    await updateTaskStatistics();
    
    console.log('\n✅ Task population completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Test the API: http://localhost:5000/api/health');
    console.log('   3. Get a random task: http://localhost:5000/api/arc-tasks');
    
  } catch (error) {
    console.error('❌ Task population failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Make sure the database is set up: npm run db:setup');
    console.error('   2. Check that ARC data exists in data/training and data/evaluation');
    console.error('   3. Verify database connection in .env file');
    
    process.exit(1);
  }
}

async function insertTask(taskId, taskSet, taskData) {
  try {
    // Calculate task properties
    const inputGrids = taskData.train.map(pair => pair.input);
    const outputGrids = taskData.train.map(pair => pair.output);
    const testInput = taskData.test[0]?.input || null;
    const testOutput = taskData.test[0]?.output || null;
    
    // Analyze task properties
    const allGrids = [...inputGrids, ...outputGrids];
    const colors = new Set();
    let minRows = Infinity, maxRows = 0, minCols = Infinity, maxCols = 0;
    
    allGrids.forEach(grid => {
      minRows = Math.min(minRows, grid.length);
      maxRows = Math.max(maxRows, grid.length);
      minCols = Math.min(minCols, grid[0]?.length || 0);
      maxCols = Math.max(maxCols, grid[0]?.length || 0);
      
      grid.forEach(row => {
        row.forEach(cell => colors.add(cell));
      });
    });
    
    const gridDimensions = minRows === maxRows && minCols === maxCols 
      ? `${minRows}x${minCols}` 
      : `${minRows}-${maxRows}x${minCols}-${maxCols}`;
    
    // Insert task
    await db.query(`
      INSERT INTO tasks (
        task_id,
        task_set,
        input_grids,
        output_grids,
        test_input_grid,
        ground_truth_output,
        grid_dimensions,
        color_count,
        number_of_examples,
        created_date,
        source,
        task_validated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10, TRUE)
      ON CONFLICT (task_id) DO UPDATE SET
        input_grids = EXCLUDED.input_grids,
        output_grids = EXCLUDED.output_grids,
        test_input_grid = EXCLUDED.test_input_grid,
        ground_truth_output = EXCLUDED.ground_truth_output,
        grid_dimensions = EXCLUDED.grid_dimensions,
        color_count = EXCLUDED.color_count,
        number_of_examples = EXCLUDED.number_of_examples
    `, [
      taskId,
      taskSet,
      JSON.stringify(inputGrids),
      JSON.stringify(outputGrids),
      testInput ? JSON.stringify(testInput) : null,
      testOutput ? JSON.stringify(testOutput) : null,
      gridDimensions,
      colors.size,
      taskData.train.length,
      'arc_original'
    ]);
    
  } catch (error) {
    console.error(`❌ Failed to insert task ${taskId}:`, error.message);
    throw error;
  }
}

async function updateTaskStatistics() {
  try {
    // This would be expanded to calculate more sophisticated metrics
    await db.query(`
      UPDATE tasks SET 
        estimated_difficulty = 3.0,
        human_accuracy_rate = 0.5,
        ai_baseline_accuracy = 0.3
      WHERE estimated_difficulty IS NULL
    `);
    
    console.log('✅ Task statistics updated');
  } catch (error) {
    console.error('⚠️  Warning: Failed to update task statistics:', error.message);
  }
}

// Run population if called directly
if (require.main === module) {
  populateTasks();
}

module.exports = { populateTasks };