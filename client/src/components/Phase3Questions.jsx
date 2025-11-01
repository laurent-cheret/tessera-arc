import React, { useState } from 'react';
import SolutionSummary from './SolutionSummary';
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
  
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const enforceWordLimit = (text, currentText, maxWords) => {
    const wordCount = getWordCount(text);
    if (wordCount <= maxWords) {
      return text;
    } else if (text.length < currentText.length) {
      // Allow deletion
      return text;
    }
    return currentText;
  };

  const validate = () => {
    const newErrors = {};
    
    // Q9: Hypothesis revision
    if (hypothesisRevised === null) {
      newErrors.hypothesisRevised = 'Please indicate whether you changed your approach.';
    }

    if (hypothesisRevised && !revisionReason.trim()) {
      newErrors.revisionReason = 'Please explain what made you change your approach.';
    }
    
    if (isCorrect) {
      // Validate teaching questions (10-50 words each)
      const lookForWordCount = getWordCount(whatToLookFor);
      if (lookForWordCount < 10) {
        newErrors.whatToLookFor = 'Please write at least 10 words.';
      }
      if (lookForWordCount > 50) {
        newErrors.whatToLookFor = 'Please keep your answer under 50 words.';
      }
      
      const transformWordCount = getWordCount(howToTransform);
      if (transformWordCount < 10) {
        newErrors.howToTransform = 'Please write at least 10 words.';
      }
      if (transformWordCount > 50) {
        newErrors.howToTransform = 'Please keep your answer under 50 words.';
      }
      
      const verifyWordCount = getWordCount(howToVerify);
      if (verifyWordCount < 10) {
        newErrors.howToVerify = 'Please write at least 10 words.';
      }
      if (verifyWordCount > 50) {
        newErrors.howToVerify = 'Please keep your answer under 50 words.';
      }
    } else {
      // Validate single attempt question (10-60 words)
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

  return (
    <div className="phase3-container">
      {/* Side panel with solution summary */}
      <div className="phase3-sidebar">
        <SolutionSummary 
          testInput={testInput}
          userSolution={userSolution}
          isCorrect={isCorrect}
        />
      </div>

      {/* Main questions area */}
      <div className="phase3-questions">
        <h2>{isCorrect ? '👨‍🏫 Teaching Someone to Solve This' : '🤔 About Your Attempt'}</h2>
        <p className="phase-intro">
          {isCorrect 
            ? "Great job! Now imagine teaching a friend who can only see the test input (not the examples). How would you guide them?"
            : "Let's understand your reasoning. Even incorrect attempts help us learn about human problem-solving."
          }
        </p>

        {/* Q9: Strategy Revision (ALWAYS SHOWN) */}
        <div className="question-block">
          <h3>Did you change your mind about the pattern while solving?</h3>
          
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
            <div className="teaching-intro">
              <p>
                <span className="emoji">👥</span> 
                <strong>Imagine your friend can ONLY see this test input</strong> (they don't have access to the training examples). 
                Guide them through solving it in 3 simple steps:
              </p>
            </div>

            {/* Q3a: What to Look For */}
            <div className="question-block teaching-question">
              <div className="step-header">
                <span className="step-number">1</span>
                <h3>👀 What should they look for first?</h3>
              </div>
              <p className="question-hint">
                What features or patterns should they notice? (objects, colors, positions, relationships)
              </p>
              
              {errors.whatToLookFor && <div className="error-message">{errors.whatToLookFor}</div>}
              
              <ColorAutocompleteTextarea
                value={whatToLookFor}
                onChange={(e) => setWhatToLookFor(enforceWordLimit(e.target.value, whatToLookFor, 50))}
                placeholder="Example: 'Look for any blue shapes that are touching the grid border. Those are the ones that will rotate.'"
                rows={3}
                className="response-textarea small"
              />
              
              {renderWordCounter(getWordCount(whatToLookFor), 50, 10)}
            </div>

            {/* Q3b: How to Transform */}
            <div className="question-block teaching-question">
              <div className="step-header">
                <span className="step-number">2</span>
                <h3>🔧 What steps should they follow?</h3>
              </div>
              <p className="question-hint">
                Describe the transformation process clearly and concisely.
              </p>
              
              {errors.howToTransform && <div className="error-message">{errors.howToTransform}</div>}
              
              <ColorAutocompleteTextarea
                value={howToTransform}
                onChange={(e) => setHowToTransform(enforceWordLimit(e.target.value, howToTransform, 50))}
                placeholder="Example: 'Rotate each blue shape touching the border 90 degrees clockwise. Keep all other shapes in their original positions.'"
                rows={3}
                className="response-textarea small"
              />
              
              {renderWordCounter(getWordCount(howToTransform), 50, 10)}
            </div>

            {/* Q3c: How to Verify */}
            <div className="question-block teaching-question">
              <div className="step-header">
                <span className="step-number">3</span>
                <h3>✅ How can they check if it's correct?</h3>
              </div>
              <p className="question-hint">
                What should the final output look like? What checks should they perform?
              </p>
              
              {errors.howToVerify && <div className="error-message">{errors.howToVerify}</div>}
              
              <ColorAutocompleteTextarea
                value={howToVerify}
                onChange={(e) => setHowToVerify(enforceWordLimit(e.target.value, howToVerify, 50))}
                placeholder="Example: 'You should end up with all blue boxes touching each other. The grid stays the same size as the input.'"
                rows={3}
                className="response-textarea small"
              />
              
              {renderWordCounter(getWordCount(howToVerify), 50, 10)}
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
    </div>
  );
};

export default Phase3Questions;