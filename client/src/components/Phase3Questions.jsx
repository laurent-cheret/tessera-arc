import React, { useState } from 'react';
import './Phase3Questions.css';
import ColorAutocompleteTextarea from './ColorAutocompleteTextarea';

const Phase3Questions = ({ onComplete, initialData, testInput, userSolution, isCorrect }) => {
  const [hypothesisRevised, setHypothesisRevised] = useState(initialData?.hypothesisRevised || null);
  const [revisionReason, setRevisionReason] = useState(initialData?.revisionReason || '');
  
  // For correct solutions (teaching questions)
  const [whatToLookFor, setWhatToLookFor] = useState(initialData?.whatToLookFor || '');
  const [howToTransform, setHowToTransform] = useState(initialData?.howToTransform || '');
  const [howToVerify, setHowToVerify] = useState(initialData?.howToVerify || '');
  
  // For incorrect solutions (single question)
  const [whatYouTried, setWhatYouTried] = useState(initialData?.whatYouTried || '');
  
  const [errors, setErrors] = useState({});
  
  // Official ARC color palette
  const colors = {
    0: '#000000', 1: '#0074D9', 2: '#FF4136', 3: '#2ECC40', 4: '#FFDC00',
    5: '#AAAAAA', 6: '#F012BE', 7: '#FF851B', 8: '#7FDBFF', 9: '#870C25'
  };
  
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const enforceWordLimit = (text, currentText, maxWords) => {
    const wordCount = getWordCount(text);
    if (wordCount <= maxWords) {
      return text;
    } else if (text.length < currentText.length) {
      return text;
    }
    return currentText;
  };

  const validate = () => {
    const newErrors = {};
    
    if (hypothesisRevised === null) {
      newErrors.hypothesisRevised = 'Please indicate whether you changed your approach.';
    }

    if (hypothesisRevised && !revisionReason.trim()) {
      newErrors.revisionReason = 'Please explain what made you change your approach.';
    }
    
    if (isCorrect) {
      const lookForWordCount = getWordCount(whatToLookFor);
      if (lookForWordCount < 10) {
        newErrors.whatToLookFor = 'Please write at least 10 words.';
      }
      if (lookForWordCount > 40) {
        newErrors.whatToLookFor = 'Please keep your answer under 40 words.';
      }
      
      const transformWordCount = getWordCount(howToTransform);
      if (transformWordCount < 10) {
        newErrors.howToTransform = 'Please write at least 10 words.';
      }
      if (transformWordCount > 40) {
        newErrors.howToTransform = 'Please keep your answer under 40 words.';
      }
      
      const verifyWordCount = getWordCount(howToVerify);
      if (verifyWordCount < 10) {
        newErrors.howToVerify = 'Please write at least 10 words.';
      }
      if (verifyWordCount > 40) {
        newErrors.howToVerify = 'Please keep your answer under 40 words.';
      }
    } else {
      const attemptWordCount = getWordCount(whatYouTried);
      if (attemptWordCount < 10) {
        newErrors.whatYouTried = 'Please write at least 10 words.';
      }
      if (attemptWordCount > 60) {
        newErrors.whatYouTried = 'Please keep your answer under 60 words.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const data = {
        q9_hypothesis_revised: hypothesisRevised,
        q9_revision_reason: hypothesisRevised ? revisionReason.trim() : null,
        phase3_timestamp: new Date().toISOString()
      };
      
      if (isCorrect) {
        data.q3a_what_to_look_for = whatToLookFor.trim();
        data.q3b_how_to_transform = howToTransform.trim();
        data.q3c_how_to_verify = howToVerify.trim();
      } else {
        data.q3_what_you_tried = whatYouTried.trim();
      }
      
      onComplete(data);
    }
  };

  const renderWordCounter = (count, max, min) => {
    let className = 'word-counter';
    if (count < min) className += ' word-counter-low';
    else if (count >= max - 3) className += ' word-counter-warning';
    else className += ' word-counter-good';

    let text = `${count} / ${max} words`;
    if (count < min) text += ` (need ${min - count} more)`;
    else if (count === max) text += ' (limit reached) ✓';
    else if (count >= max - 5) text += ` (${max - count} remaining)`;
    else text += ' ✓';

    return <div className={className}>{text}</div>;
  };

  // Render mini grid inline
  const renderMiniGrid = (grid, title) => {
    const maxDim = Math.max(grid.length, grid[0]?.length || 0);
    const cellSize = Math.min(20, Math.floor(180 / maxDim));

    return (
      <div className="inline-grid-container">
        <div className="inline-grid-title">{title}</div>
        <div className="inline-grid">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="inline-row">
              {row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="inline-cell"
                  style={{
                    backgroundColor: colors[cell],
                    width: `${cellSize}px`,
                    height: `${cellSize}px`,
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="phase3-questions">
      <h2>{isCorrect ? '👨‍🏫 Instructing Someone to Solve This' : '🤔 About Your Attempt'}</h2>
      <p className="phase-intro">
        {isCorrect 
          ? "Great job! Now help others learn from your success."
          : "Let's understand your reasoning. Even incorrect attempts help us learn about human problem-solving."
        }
      </p>

      {/* Q9: Strategy Revision (ALWAYS SHOWN) */}
      <div className="question-block">
        <h3>Did you change your mind about the main idea of the puzzle?</h3>
        
        {errors.hypothesisRevised && <div className="error-message">{errors.hypothesisRevised}</div>}
        
        <div className="revision-options">
          <div
            className={`revision-option ${hypothesisRevised === false ? 'selected' : ''}`}
            onClick={() => {
              setHypothesisRevised(false);
              setRevisionReason('');
            }}
          >
            <div className="revision-icon">✓</div>
            <div className="revision-label">No, I stuck with my original idea</div>
          </div>

          <div
            className={`revision-option ${hypothesisRevised === true ? 'selected' : ''}`}
            onClick={() => setHypothesisRevised(true)}
          >
            <div className="revision-icon">🔄</div>
            <div className="revision-label">Yes, I changed my approach</div>
          </div>
        </div>

        {hypothesisRevised && (
          <div className="revision-reason-section">
            <p className="question-hint">What made you change your approach?</p>
            
            {errors.revisionReason && <div className="error-message">{errors.revisionReason}</div>}
            
            <ColorAutocompleteTextarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="Example: 'At first I thought shapes were just rotating, but one of the examples showed some shapes staying still. I realized only shapes touching the border rotate.'"
              rows={3}
              className="response-textarea small"
            />
          </div>
        )}
      </div>

      {/* CONDITIONAL: Teaching questions (if correct) OR Single attempt question (if incorrect) */}
      {isCorrect ? (
        <>
          {/* Teaching Context Box with Integrated Grids */}
          <div className="teaching-context-box">
            <div className="context-header">
              <span className="context-emoji">👥</span>
              <h3>Imagine Instructing a Friend</h3>
            </div>
            
            <div className="context-explanation">
              <p>
                Your friend <strong>can ONLY see this specific test input</strong> below. 
                They don't have access to the training examples you studied.
              </p>
              <p className="context-hint">
                Guide them step-by-step to create <strong>this exact output</strong> from <strong>this specific input</strong>:
              </p>
            </div>

            {/* Embedded grids showing what the friend sees */}
            <div className="context-grids">
              {renderMiniGrid(testInput, "What your friend sees")}
              <div className="context-arrow">→</div>
              {renderMiniGrid(userSolution, "What they need to create")}
            </div>

            <div className="context-footer">
              <span className="context-icon">💡</span>
              <p>Your instructions should work specifically for <strong>these grids</strong>, not just the general pattern.</p>
            </div>
          </div>

          {/* Q3a: What to Look For */}
          <div className="question-block teaching-question">
            <div className="step-header">
              <span className="step-number">1</span>
              <h3>👀 What should they look for first?</h3>
            </div>
            <p className="question-hint">
              What things should they notice in <strong>this specific test input</strong>? (objects, colors, positions, relationships)
            </p>
            
            {errors.whatToLookFor && <div className="error-message">{errors.whatToLookFor}</div>}
            
            <ColorAutocompleteTextarea
              value={whatToLookFor}
              onChange={(e) => setWhatToLookFor(enforceWordLimit(e.target.value, whatToLookFor, 40))}
              placeholder="Example: 'Look for the three blue rectangles in the top-left corner. Notice how they form an L-shape.'"
              rows={3}
              className="response-textarea small"
            />
            
            {renderWordCounter(getWordCount(whatToLookFor), 40, 10)}
          </div>

          {/* Q3b: How to Transform */}
          <div className="question-block teaching-question">
            <div className="step-header">
              <span className="step-number">2</span>
              <h3>🔧 What steps should they follow?</h3>
            </div>
            <p className="question-hint">
              Describe the specific transformation needed for <strong>this test case</strong>.
            </p>
            
            {errors.howToTransform && <div className="error-message">{errors.howToTransform}</div>}
            
            <ColorAutocompleteTextarea
              value={howToTransform}
              onChange={(e) => setHowToTransform(enforceWordLimit(e.target.value, howToTransform, 40))}
              placeholder="Example: 'Take each blue rectangle and rotate it 90 degrees clockwise. Then move them to the bottom-right corner.'"
              rows={3}
              className="response-textarea small"
            />
            
            {renderWordCounter(getWordCount(howToTransform), 40, 10)}
          </div>

          {/* Q3c: How to Verify */}
          <div className="question-block teaching-question">
            <div className="step-header">
              <span className="step-number">3</span>
              <h3>✅ How can they check if it's correct?</h3>
            </div>
            <p className="question-hint">
              What should <strong>the final output</strong> look like? What checks should they perform?
            </p>
            
            {errors.howToVerify && <div className="error-message">{errors.howToVerify}</div>}
            
            <ColorAutocompleteTextarea
              value={howToVerify}
              onChange={(e) => setHowToVerify(enforceWordLimit(e.target.value, howToVerify, 40))}
              placeholder="Example: 'You should end up with three blue rectangles forming an L-shape in the bottom-right. The grid should be the same size as the input.'"
              rows={3}
              className="response-textarea small"
            />
            
            {renderWordCounter(getWordCount(howToVerify), 40, 10)}
          </div>
        </>
      ) : (
        <>
          {/* Q3: What You Tried (single question for incorrect) */}
          <div className="question-block">
            <h3>What did you try to solve this test?</h3>
            <p className="question-hint">
              Describe your approach and what you attempted to do.
            </p>
            
            {errors.whatYouTried && <div className="error-message">{errors.whatYouTried}</div>}
            
            <ColorAutocompleteTextarea
              value={whatYouTried}
              onChange={(e) => setWhatYouTried(enforceWordLimit(e.target.value, whatYouTried, 60))}
              placeholder="Example: 'I thought all shapes should rotate, so I rotated every shape 90 degrees clockwise.'"
              rows={4}
              className="response-textarea"
            />
            
            {renderWordCounter(getWordCount(whatYouTried), 60, 10)}
          </div>
        </>
      )}

      <div className="continue-section">
        <button 
          className="continue-btn"
          onClick={handleSubmit}
        >
          Continue to Final Question →
        </button>
      </div>
    </div>
  );
};

export default Phase3Questions;