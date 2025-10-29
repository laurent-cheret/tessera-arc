import React, { useState } from 'react';
import SolutionSummary from './SolutionSummary';
import './Phase3Questions.css';
import ColorAutocompleteTextarea from './ColorAutocompleteTextarea';

const Phase3Questions = ({ onComplete, initialData, testInput, userSolution, isCorrect }) => {
  const [hypothesisRevised, setHypothesisRevised] = useState(initialData?.hypothesisRevised || null);
  const [revisionReason, setRevisionReason] = useState(initialData?.revisionReason || '');
  const [testCaseDescription, setTestCaseDescription] = useState(initialData?.testCaseDescription || '');
  const [strategy, setStrategy] = useState(initialData?.strategy || '');
  const [errors, setErrors] = useState({});
  
  const strategies = [
    {
      value: 'intuitive_recognition',
      emoji: '💡',
      label: 'Quick Recognition',
      when: 'The transformation felt obvious to you. Like spotting a familiar face in a crowd.',
      example: 'You instantly thought "Oh, this is just flipping the shape horizontally" without analyzing why.'
    },
    {
      value: 'systematic_analysis',
      emoji: '🔬',
      label: 'Systematic Rule Finding',
      when: 'You had to look at all the examples to be sure about the transformation, then built up a clear rule in your mind.',
      example: 'You noticed: "Blue squares disappear. But, it only happens when they are close to green squares."'
    },
    {
      value: 'hands_on_experimentation',
      emoji: '🎯',
      label: 'Learning by Trying',
      when: 'The rule wasn\'t clear so you used the interactive grid to experiment, and learned from seeing what worked and what didn\'t.',
      example: 'You tried rotating the pattern, saw it was wrong, then tried reflecting it instead, gradually refining your approach.'
    }
  ];
  
  const validate = () => {
    const newErrors = {};
    
    if (hypothesisRevised === null) {
      newErrors.hypothesisRevised = 'Please indicate whether you changed your approach.';
    }

    if (hypothesisRevised && !revisionReason.trim()) {
      newErrors.revisionReason = 'Please explain what made you change your approach.';
    }
    
    const wordCount = testCaseDescription.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 5) {
      newErrors.testCaseDescription = 'Please write at least 15 words (2-3 sentences).';
    }
    if (wordCount > 150) {
      newErrors.testCaseDescription = 'Please keep your description under 150 words.';
    }
    
    if (!strategy) {
      newErrors.strategy = 'Please select the strategy that best describes your approach.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const data = {
        q9_hypothesis_revised: hypothesisRevised,
        q9_revision_reason: hypothesisRevised ? revisionReason.trim() : null,
        q3_what_you_tried: testCaseDescription.trim(), // KEPT ORIGINAL DATABASE KEY
        q3_word_count: testCaseDescription.trim().split(/\s+/).filter(w => w.length > 0).length,
        q5_strategy_used: strategy, 
        phase3_timestamp: new Date().toISOString()
      };
      onComplete(data);
    }
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
        <h2>About Your Solving Attempt</h2>
        <p className="phase-intro">
          Whether you solved it correctly or not, we want to hear about your approach!
        </p>

        {/* Q9: Strategy Revision (NOW FIRST) */}
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

        {/* Q3: Test Case Description (NEW REFORMULATED VERSION) */}
        <div className="question-block">
        <h3>What did you try to solve this test?</h3>
        <p className="question-hint">
          Even if the pattern was the same as the examples, your test might have had different challenges. Tell us what you noticed:
        </p>
        <ul className="hint-list">
          <li><strong>What</strong> you saw in your test (objects, colors, sizes, positions)</li>
          <li><strong>How</strong> your test was similar or different from the examples</li>
          <li><strong>How</strong> you applied the pattern to your specific test</li>
        </ul>
          
          {errors.testCaseDescription && <div className="error-message">{errors.testCaseDescription}</div>}
          
          <ColorAutocompleteTextarea
            value={testCaseDescription}
            onChange={(e) => setTestCaseDescription(e.target.value)}
            placeholder="Example: 'My test had 7 blue shapes instead of the 3 red ones in the examples. Only the top-left and bottom-right shapes touched the border, so only those two rotated 90 degrees.'"
            rows={4}
            className="response-textarea"
          />
          
          <div className="word-counter">
            {testCaseDescription.trim().split(/\s+/).filter(w => w.length > 0).length} / 150 words
            (minimum 15 words)
          </div>
        </div>

        {/* Q5: Strategy Selection */}
        <div className="question-block">
          <h3>Which strategy best describes how you solved this puzzle?</h3>
          <p className="question-hint">Select the ONE that fits best:</p>
          
          {errors.strategy && <div className="error-message">{errors.strategy}</div>}
          
          <div className="strategy-options">
            {strategies.map(s => (
              <div
                key={s.value}
                className={`strategy-card ${strategy === s.value ? 'selected' : ''}`}
                onClick={() => setStrategy(s.value)}
              >
                <div className="strategy-header">
                  <span className="strategy-emoji">{s.emoji}</span>
                  <span className="strategy-label">{s.label}</span>
                </div>
                <div className="strategy-when">
                  <strong>When to select:</strong> {s.when}
                </div>
                <div className="strategy-example">
                  <strong>Example:</strong> {s.example}
                </div>
              </div>
            ))}
          </div>
        </div>

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