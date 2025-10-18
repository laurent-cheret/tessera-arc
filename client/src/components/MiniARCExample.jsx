import React, { useState, useEffect } from 'react';
import './MiniARCExample.css';
import config from '../config';

const MiniARCExample = () => {
  const [exampleTask, setExampleTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // List of hand-picked tasks with good visualization for landing page
    const exampleTaskIds = [
      '5ecac7f7',
      'd22278a0', 
      'bb43febb',
      '00d62c1b',
      'e4075551',
      'e8dc4411'
    ];
    
    // Pick a random task ID from the curated list
    const randomTaskId = exampleTaskIds[Math.floor(Math.random() * exampleTaskIds.length)];
    
    // Fetch that specific task
    fetch(`${config.API_URL}/api/arc-tasks/${randomTaskId}`)
      .then(res => res.json())
      .then(data => {
        setExampleTask(data.task);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching example task:', err);
        setLoading(false);
      });
  }, []);

  // ... rest of your code stays the same

  // Official ARC color palette
  const colors = {
    0: '#000000', // Black
    1: '#0074D9', // Blue
    2: '#FF4136', // Red
    3: '#2ECC40', // Green
    4: '#FFDC00', // Yellow
    5: '#AAAAAA', // Gray
    6: '#F012BE', // Magenta
    7: '#FF851B', // Orange
    8: '#7FDBFF', // Cyan
    9: '#870C25', // Maroon
  };

  // Calculate optimal cell size based on all grids in the task
  const calculateCellSize = (task) => {
    if (!task || !task.train || task.train.length === 0) return 15;

    // Find the maximum dimensions across all grids
    let maxRows = 0;
    let maxCols = 0;

    // Check all training grids
    task.train.forEach(pair => {
      if (pair.input) {
        maxRows = Math.max(maxRows, pair.input.length);
        maxCols = Math.max(maxCols, pair.input[0]?.length || 0);
      }
      if (pair.output) {
        maxRows = Math.max(maxRows, pair.output.length);
        maxCols = Math.max(maxCols, pair.output[0]?.length || 0);
      }
    });

    // Check test grid
    if (task.test && task.test[0] && task.test[0].input) {
      maxRows = Math.max(maxRows, task.test[0].input.length);
      maxCols = Math.max(maxCols, task.test[0].input[0]?.length || 0);
    }

    // Define maximum display size in pixels - INCREASED for better visibility
    const maxDisplaySize = 200;

    // Calculate cell size to fit the largest grid within maxDisplaySize
    const cellSizeByRows = Math.floor(maxDisplaySize / maxRows);
    const cellSizeByCols = Math.floor(maxDisplaySize / maxCols);

    // Use the smaller of the two to ensure both dimensions fit
    let cellSize = Math.min(cellSizeByRows, cellSizeByCols);

    // Set bounds: minimum 6px (increased), maximum 25px (increased)
    cellSize = Math.max(6, Math.min(25, cellSize));

    return cellSize;
  };

  const renderMiniGrid = (grid, cellSize) => {
    if (!grid || !grid.length || !grid[0]) return null;

    return (
      <div className="mini-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="mini-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="mini-cell"
                style={{ 
                  backgroundColor: colors[cell],
                  border: '1px solid #999',
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mini-example-container">
        <div className="loading-spinner">Loading example...</div>
      </div>
    );
  }

  if (!exampleTask || !exampleTask.train || !exampleTask.test) {
    return null;
  }

  const testInput = exampleTask.test[0]?.input;
  const cellSize = calculateCellSize(exampleTask);

  return (
    <div className="mini-example-container">
      <h3 className="example-title">Anatomy of a Complete ARC Task</h3>
      
      {/* Training Examples Section */}
      <div className="training-section">
        <div className="section-header">
          <span className="section-badge">Training Examples</span>
          <p className="section-description">
            The first step in solving and ARC task is to understand what are the common transformation rules applied to the training examples.
          </p>
        </div>
        
        <div className="training-grid">
          {exampleTask.train.map((pair, index) => (
            <div key={index} className="training-pair-compact">
              <div className="pair-label">Example {index + 1}</div>
              <div className="grid-pair-compact">
                <div className="grid-with-label-compact">
                  <span className="grid-label-small">Input</span>
                  {renderMiniGrid(pair.input, cellSize)}
                </div>
                
                <div className="arrow-compact">→</div>
                
                <div className="grid-with-label-compact">
                  <span className="grid-label-small">Output</span>
                  {renderMiniGrid(pair.output, cellSize)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Example Section */}
      <div className="test-section">
        <div className="section-header">
          <span className="section-badge test-badge">Test Case</span>
          <p className="section-description">
            Then, once you think you figured out the pattern, you can apply it to the test input to see if you got it right.
          </p>
        </div>
        
        <div className="test-pair">
          <div className="grid-pair-compact">
            <div className="grid-with-label-compact">
              <span className="grid-label-small">Test Input</span>
              {testInput && renderMiniGrid(testInput, cellSize)}
            </div>
            
            <div className="arrow-compact">→</div>
            
            <div className="grid-with-label-compact">
              <span className="grid-label-small">Your Answer</span>
              <div className="question-placeholder-compact">?</div>
            </div>
          </div>
        </div>
      </div>

      <div className="task-summary">
        <p>
          <strong>This is one single task!</strong> Each one will be completely different from the others, some will have more training examples than others. For example, the one you see above has {exampleTask.train.length} training example{exampleTask.train.length > 1 ? 's' : ''} + 1 test case
        </p>
      </div>
    </div>
  );
};

export default MiniARCExample;