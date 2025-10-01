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
      // Load training tasks
      const trainingDir = path.join(__dirname, '../data/training');
      const trainingFiles = fs.readdirSync(trainingDir);
      
      trainingFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const taskPath = path.join(trainingDir, file);
          const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
          const taskId = file.replace('.json', '');
          
          this.trainingTasks.push({
            id: taskId,
            ...taskData
          });
        }
      });

      console.log(`Loaded ${this.trainingTasks.length} training tasks`);

      // Load evaluation tasks
      const evaluationDir = path.join(__dirname, '../data/evaluation');
      const evaluationFiles = fs.readdirSync(evaluationDir);
      
      evaluationFiles.forEach(file => {
        if (file.endsWith('.json')) {
          const taskPath = path.join(evaluationDir, file);
          const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
          const taskId = file.replace('.json', '');
          
          this.evaluationTasks.push({
            id: taskId,
            ...taskData
          });
        }
      });

      console.log(`Loaded ${this.evaluationTasks.length} evaluation tasks`);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }

  getRandomTask() {
    // Use both training and evaluation tasks for comprehensive description collection
    const allTasks = [...this.trainingTasks, ...this.evaluationTasks];
    
    if (allTasks.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * allTasks.length);
    const task = allTasks[randomIndex];
    
    // Add a label to distinguish the source
    const taskType = this.trainingTasks.includes(task) ? 'training' : 'evaluation';
    
    return {
      id: task.id,
      name: `ARC Task ${task.id} (${taskType})`,
      type: taskType,
      train: task.train,
      test: task.test,
      input: task.train.map(pair => pair.input),
      output: task.train.map(pair => pair.output)
    };
  }

  getTaskById(taskId) {
    // Search in both training and evaluation tasks
    let task = this.trainingTasks.find(t => t.id === taskId);
    let taskType = 'training';
    
    if (!task) {
      task = this.evaluationTasks.find(t => t.id === taskId);
      taskType = 'evaluation';
    }
    
    if (!task) return null;
    
    return {
      id: task.id,
      name: `ARC Task ${task.id} (${taskType})`,
      type: taskType,
      train: task.train,
      test: task.test,
      input: task.train.map(pair => pair.input),
      output: task.train.map(pair => pair.output)
    };
  }

  // NEW METHOD: Get total task count
  getTaskCount() {
    return this.trainingTasks.length + this.evaluationTasks.length;
  }

  // NEW METHOD: Get task counts by type
  getTaskCounts() {
    return {
      training: this.trainingTasks.length,
      evaluation: this.evaluationTasks.length,
      total: this.getTaskCount()
    };
  }

  // NEW METHOD: Get all task IDs
  getAllTaskIds() {
    const trainingIds = this.trainingTasks.map(t => t.id);
    const evaluationIds = this.evaluationTasks.map(t => t.id);
    return {
      training: trainingIds,
      evaluation: evaluationIds,
      all: [...trainingIds, ...evaluationIds]
    };
  }
}

module.exports = new TaskLoader();