import React from 'react';
import './SolutionSummary.css';

const SolutionSummary = ({ testInput, userSolution, isCorrect }) => {
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

  // Calculate cell size to fit in 200px container
  const getMaxDimension = (grid) => {
    return Math.max(grid.length, grid[0]?.length || 0);
  };

  const maxDim = Math.max(
    getMaxDimension(testInput),
    getMaxDimension(userSolution)
  );
  
  const cellSize = Math.min(20, Math.floor(200 / maxDim));

  const renderGrid = (grid, title) => (
    <div className="summary-grid-container">
      <div className="summary-grid-title">{title}</div>
      <div className="summary-grid">
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="summary-row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="summary-cell"
                style={{
                  backgroundColor: colors[cell],
                  width: `${cellSize}px`,
                  height: `${cellSize}px`,
                  border: '1px solid #333'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="solution-summary">
      <div className="summary-header">
        <h4>Your Solution</h4>
        {isCorrect !== null && (
          <div className={`summary-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </div>
        )}
      </div>
      
      <div className="summary-grids">
        {renderGrid(testInput, "What you started with")}
        
        <div className="summary-arrow">→</div>
        
        {renderGrid(userSolution, "What you created")}
      </div>
      
      <div className="summary-footer">
        <p className="summary-hint">
          Refer to this while describing your approach
        </p>
      </div>
    </div>
  );
};

export default SolutionSummary;