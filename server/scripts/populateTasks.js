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
    
    const dataDir = path.join(__dirname, '../data');
    
    // Process both v1 and v2
    const versions = [
      { path: path.join(dataDir, 'v1'), version: 'v1' },
      { path: path.join(dataDir, 'v2'), version: 'v2' }
    ];
    
    let totalTraining = 0;
    let totalEvaluation = 0;
    const versionStats = {};
    
    for (const { path: versionPath, version } of versions) {
      const trainingDir = path.join(versionPath, 'training');
      const evaluationDir = path.join(versionPath, 'evaluation');
      
      if (!fs.existsSync(trainingDir) && !fs.existsSync(evaluationDir)) {
        console.log(`⚠️  Skipping ${version} - directories not found`);
        continue;
      }
      
      console.log(`\n🔄 Processing ${version.toUpperCase()} tasks...`);
      versionStats[version] = { training: 0, evaluation: 0 };
      
      // Step 3: Process training tasks
      if (fs.existsSync(trainingDir)) {
        console.log(`   📖 Processing ${version} training tasks...`);
        const trainingFiles = fs.readdirSync(trainingDir).filter(file => file.endsWith('.json'));
        
        for (const file of trainingFiles) {
          const taskId = file.replace('.json', '');
          const filePath = path.join(trainingDir, file);
          const taskData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          await insertTask(taskId, 'training', taskData, version);
          versionStats[version].training++;
          totalTraining++;
          
          if (totalTraining % 50 === 0) {
            console.log(`      📝 Processed ${totalTraining} training tasks so far...`);
          }
        }
        
        console.log(`   ✅ Inserted ${versionStats[version].training} ${version} training tasks`);
      }
      
      // Step 4: Process evaluation tasks
      if (fs.existsSync(evaluationDir)) {
        console.log(`   📖 Processing ${version} evaluation tasks...`);
        const evaluationFiles = fs.readdirSync(evaluationDir).filter(file => file.endsWith('.json'));
        
        for (const file of evaluationFiles) {
          const taskId = file.replace('.json', '');
          const filePath = path.join(evaluationDir, file);
          const taskData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          await insertTask(taskId, 'evaluation', taskData, version);
          versionStats[version].evaluation++;
          totalEvaluation++;
          
          if (totalEvaluation % 50 === 0) {
            console.log(`      📝 Processed ${totalEvaluation} evaluation tasks so far...`);
          }
        }
        
        console.log(`   ✅ Inserted ${versionStats[version].evaluation} ${version} evaluation tasks`);
      }
    }
    
    // Step 5: Verify insertion
    console.log('\n🔍 Verifying task insertion...');
    const taskCountResult = await db.query(`
      SELECT 
        task_set,
        arc_version,
        COUNT(*) as count,
        AVG(number_of_examples) as avg_examples
      FROM tasks 
      GROUP BY task_set, arc_version
      ORDER BY arc_version, task_set
    `);
    
    console.log('\n📊 Task summary by version:');
    taskCountResult.rows.forEach(row => {
      console.log(`   ${row.arc_version} ${row.task_set}: ${row.count} tasks (avg ${Math.round(row.avg_examples)} examples each)`);
    });
    
    const totalTasks = totalTraining + totalEvaluation;
    console.log(`\n🎉 Successfully populated ${totalTasks} ARC tasks into database!`);
    console.log(`   Training: ${totalTraining}`);
    console.log(`   Evaluation: ${totalEvaluation}`);
    
    // Display unique task count
    const uniqueCountResult = await db.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`\n📊 Unique tasks in database: ${uniqueCountResult.rows[0].count}`);
    console.log(`   (${totalTasks - uniqueCountResult.rows[0].count} duplicates updated with v2 data)`);
    
    // Step 6: Update task statistics
    console.log('\n📈 Updating task statistics...');
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
    console.error('   2. Check that ARC data exists in data/v1 and data/v2');
    console.error('   3. Verify database connection in .env file');
    
    process.exit(1);
  }
}

async function insertTask(taskId, taskSet, taskData, version) {
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
    
    // Insert task with version
    await db.query(`
      INSERT INTO tasks (
        task_id,
        task_set,
        arc_version,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11, TRUE)
      ON CONFLICT (task_id) DO UPDATE SET
        task_set = EXCLUDED.task_set,
        arc_version = EXCLUDED.arc_version,
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
      version,
      JSON.stringify(inputGrids),
      JSON.stringify(outputGrids),
      testInput ? JSON.stringify(testInput) : null,
      testOutput ? JSON.stringify(testOutput) : null,
      gridDimensions,
      colors.size,
      taskData.train.length,
      `arc_${version}`
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