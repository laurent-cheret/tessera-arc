import React, { useState } from 'react';
import ARCGrid from './ARCGrid';
import './TaskReference.css';

const TaskReference = ({ trainingExamples, userSolution, isCorrect, showUserSolution }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="task-reference">
      <button 
        className="task-reference-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">
          {isExpanded ? 'Hide Task Examples' : 'View Task Examples'}
        </span>
        <span className="toggle-hint">
          (Tap to {isExpanded ? 'hide' : 'see'} the training examples)
        </span>
      </button>

      {isExpanded && (
        <div className="task-reference-content">
          <div className="training-examples-compact">
            <h4>Training Examples:</h4>
            {trainingExamples.map((pair, index) => (
              <div key={index} className="training-pair-compact">
                <div className="pair-label">Example {index + 1}</div>
                <div className="pair-grids">
                  <ARCGrid grid={pair.input} title="In" />
                  <span className="arrow">→</span>
                  <ARCGrid grid={pair.output} title="Out" />
                </div>
              </div>
            ))}
          </div>

          {showUserSolution && userSolution && (
            <div className="user-solution-display">
              <h4>Your Solution:</h4>
              <div className="solution-with-status">
                <ARCGrid grid={userSolution} title="Your Output" />
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