const fs = require('fs');
const path = require('path');

class TaskLoader {
  constructor() {
    this.trainingTasks = [];
    this.evaluationTasks = [];
    this.loadTasks();
  }

  loadTasks() {
    try {
      // Load v1 tasks
      this.loadTasksFromDirectory(
        path.join(__dirname, './data/v1/training'),
        'training',
        'v1'
      );
      this.loadTasksFromDirectory(
        path.join(__dirname, './data/v1/evaluation'),
        'evaluation',
        'v1'
      );

      // Load v2 tasks
      this.loadTasksFromDirectory(
        path.join(__dirname, './data/v2/training'),
        'training',
        'v2'
      );
      this.loadTasksFromDirectory(
        path.join(__dirname, './data/v2/evaluation'),
        'evaluation',
        'v2'
      );

      // Summary
      console.log('\n=== Task Loading Summary ===');
      const counts = this.getTaskCounts();
      console.log(`Training v1: ${counts.training.v1}`);
      console.log(`Training v2: ${counts.training.v2}`);
      console.log(`Evaluation v1: ${counts.evaluation.v1}`);
      console.log(`Evaluation v2: ${counts.evaluation.v2}`);
      console.log(`Total: ${counts.total}`);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  // NEW HELPER METHOD
  loadTasksFromDirectory(directory, taskType, version) {
    if (!fs.existsSync(directory)) {
      console.log(`⚠️  Directory not found: ${directory}`);
      return;
    }

    const files = fs.readdirSync(directory);
    const targetArray = taskType === 'training' ? this.trainingTasks : this.evaluationTasks;
    let loadedCount = 0;

    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const taskPath = path.join(directory, file);
          const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
          const taskId = file.replace('.json', '');

          targetArray.push({
            id: taskId,
            version: version,  // Add version tracking
            ...taskData
          });
          loadedCount++;
        } catch (error) {
          console.error(`❌ Error loading task ${file}:`, error.message);
        }
      }
    });

    console.log(`✅ Loaded ${loadedCount} ${version} ${taskType} tasks`);
  }

  getRandomTask() {
    const allTasks = [...this.trainingTasks, ...this.evaluationTasks];
    
    if (allTasks.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * allTasks.length);
    const task = allTasks[randomIndex];
    
    const taskType = this.trainingTasks.includes(task) ? 'training' : 'evaluation';
    
    return {
      id: task.id,
      name: `ARC Task ${task.id} (${task.version.toUpperCase()}, ${taskType})`,
      type: taskType,
      version: task.version,  // Include version
      train: task.train,
      test: task.test,
      input: task.train.map(pair => pair.input),
      output: task.train.map(pair => pair.output)
    };
  }

  getTaskById(taskId) {
    let task = this.trainingTasks.find(t => t.id === taskId);
    let taskType = 'training';
    
    if (!task) {
      task = this.evaluationTasks.find(t => t.id === taskId);
      taskType = 'evaluation';
    }
    
    if (!task) return null;
    
    return {
      id: task.id,
      name: `ARC Task ${task.id} (${task.version.toUpperCase()}, ${taskType})`,
      type: taskType,
      version: task.version,  // Include version
      train: task.train,
      test: task.test,
      input: task.train.map(pair => pair.input),
      output: task.train.map(pair => pair.output)
    };
  }

  // EXISTING METHOD - Returns total count
  getTaskCount() {
    return this.trainingTasks.length + this.evaluationTasks.length;
  }

  // ENHANCED METHOD - Now includes v1/v2 breakdown
  getTaskCounts() {
    return {
      training: {
        v1: this.trainingTasks.filter(t => t.version === 'v1').length,
        v2: this.trainingTasks.filter(t => t.version === 'v2').length,
        total: this.trainingTasks.length
      },
      evaluation: {
        v1: this.evaluationTasks.filter(t => t.version === 'v1').length,
        v2: this.evaluationTasks.filter(t => t.version === 'v2').length,
        total: this.evaluationTasks.length
      },
      total: this.getTaskCount()
    };
  }

  // EXISTING METHOD - Maintains backward compatibility
  // Returns IDs in the same format as before
  getAllTaskIds() {
    const trainingIds = this.trainingTasks.map(t => t.id);
    const evaluationIds = this.evaluationTasks.map(t => t.id);
    return {
      training: trainingIds,
      evaluation: evaluationIds,
      all: [...trainingIds, ...evaluationIds]
    };
  }

  // NEW METHOD - Returns IDs with version info (for database population)
  getAllTaskIdsWithVersion() {
    const allTasks = [...this.trainingTasks, ...this.evaluationTasks];
    return allTasks.map(t => ({ 
      id: t.id, 
      version: t.version,
      type: this.trainingTasks.includes(t) ? 'training' : 'evaluation'
    }));
  }
}

module.exports = new TaskLoader();