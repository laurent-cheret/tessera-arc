import React, { useState } from 'react';
import ARCGrid from './ARCGrid';
import './TaskReference.css';

// Mini grid component for collapsed preview
const MiniGrid = ({ grid }) => {
  const colors = {
    0: '#000000', 1: '#0074D9', 2: '#FF4136', 3: '#2ECC40', 4: '#FFDC00',
    5: '#AAAAAA', 6: '#F012BE', 7: '#FF851B', 8: '#7FDBFF', 9: '#870C25'
  };

  return (
    <div className="mini-grid">
      {grid.map((row, i) => (
        <div key={i} className="mini-row">
          {row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="mini-cell"
              style={{ backgroundColor: colors[cell] || '#CCC' }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const TaskReference = ({ 
  trainingExamples, 
  userSolution, 
  isCorrect, 
  showUserSolution,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="task-reference">
      <button 
        className="task-reference-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">
          {isExpanded ? 'Hide Training Examples' : 'Show Training Examples'}
          {!isExpanded && <span className="example-count"> ({trainingExamples.length})</span>}
        </span>
        
        {/* Miniature previews when collapsed */}
        {!isExpanded && (
          <div className="miniatures-container">
            {trainingExamples.map((pair, index) => (
              <div key={index} className="miniature-pair">
                <MiniGrid grid={pair.input} />
                <span className="mini-arrow">→</span>
                <MiniGrid grid={pair.output} />
              </div>
            ))}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className="task-reference-content">
          <div className="training-examples-compact">
            <h4>Training Examples - Study the Pattern:</h4>
            {trainingExamples.map((pair, index) => (
              <div key={index} className="training-pair-compact">
                <div className="pair-label">Example {index + 1}</div>
                <div className="pair-grids">
                  {/* maxSize=250 for training examples to keep them compact */}
                  <ARCGrid grid={pair.input} title="Input" maxSize={250} />
                  <span className="arrow">→</span>
                  <ARCGrid grid={pair.output} title="Output" maxSize={250} />
                </div>
              </div>
            ))}
          </div>

          {showUserSolution && userSolution && (
            <div className="user-solution-display">
              <h4>Your Solution:</h4>
              <div className="solution-with-status">
                {/* maxSize=300 for user solution - slightly larger */}
                <ARCGrid grid={userSolution} title="Your Output" maxSize={300} />
                {isCorrect !== null && (
                  <div className={`solution-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskReference;