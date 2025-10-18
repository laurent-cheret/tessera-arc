import React, { useState } from 'react';
import SolutionSummary from './SolutionSummary';
import './Phase3Questions.css';
import ColorAutocompleteTextarea from './ColorAutocompleteTextarea';

const Phase3Questions = ({ onComplete, initialData, testInput, userSolution, isCorrect }) => {
  const [whatYouTried, setWhatYouTried] = useState(initialData?.whatYouTried || '');
  const [hypothesisRevised, setHypothesisRevised] = useState(initialData?.hypothesisRevised || null);
  const [revisionReason, setRevisionReason] = useState(initialData?.revisionReason || '');
  const [strategy, setStrategy] = useState(initialData?.strategy || '');
  const [errors, setErrors] = useState({});

  const strategies = [
    {
      value: 'intuitive_recognition',
      emoji: '💡',
      label: 'Quick Recognition',
      when: 'The transformation felt obvious to you. You recognized the pattern quickly, like spotting a familiar face in a crowd.',
      example: 'You instantly thought "Oh, this is just flipping the shape horizontally" without analyzing why.'
    },
    {
      value: 'systematic_analysis',
      emoji: '🔬',
      label: 'Systematic Rule Finding',
      when: 'You methodically analyzed the training examples, identified what changed and what stayed the same, and built up a clear rule in your mind.',
      example: 'You noticed: "First, I identify all blue squares. Then, I move each one 2 spaces right. Finally, I change their color to red."'
    },
    {
      value: 'hands_on_experimentation',
      emoji: '🎯',
      label: 'Learning by Trying',
      when: 'You used the interactive grid to experiment—copying, editing, resizing—and learned from seeing what worked and what didn\'t.',
      example: 'You tried rotating the pattern, saw it was wrong, then tried reflecting it instead, gradually refining your approach.'
    },
    {
      value: 'reverse_engineering',
      emoji: '⏪',
      label: 'Reverse Engineering',
      when: 'You started by analyzing what the output needs to be, then determined which transformations would create that result.',
      example: 'You thought "The output needs to be symmetric, so I need to mirror this half onto the other side"—starting with the end goal in mind.'
    }
  ];

  const validate = () => {
    const newErrors = {};
    
    const wordCount = whatYouTried.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 15) {
      newErrors.whatYouTried = 'Please write at least 15 words describing what you tried.';
    }
    if (wordCount > 500) {
      newErrors.whatYouTried = 'Please keep your description under 500 words.';
    }

    if (hypothesisRevised === null) {
      newErrors.hypothesisRevised = 'Please indicate whether you changed your approach.';
    }

    if (hypothesisRevised && !revisionReason.trim()) {
      newErrors.revisionReason = 'Please explain what made you change your approach.';
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
        q3_what_you_tried: whatYouTried.trim(),
        q3_word_count: whatYouTried.trim().split(/\s+/).filter(w => w.length > 0).length,
        q9_hypothesis_revised: hypothesisRevised,
        q9_revision_reason: hypothesisRevised ? revisionReason.trim() : null,
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
          Your attempts and reasoning are valuable regardless of the outcome.
        </p>

        {/* Q3: What You Tried */}
        <div className="question-block">
          <h3>Q3: What did you try to solve this puzzle?</h3>
          <p className="question-hint">
            Describe your approach step-by-step. Try to include:
          </p>
          <ul className="hint-list">
            <li><strong>What</strong> you focused on (objects, colors, positions, patterns)</li>
            <li><strong>How</strong> you attempted to transform the input (what operations or changes you tried)</li>
            <li><strong>When/Why</strong> certain approaches seemed right or wrong</li>
          </ul>
          
          {errors.whatYouTried && <div className="error-message">{errors.whatYouTried}</div>}
          
          <ColorAutocompleteTextarea
          value={whatYouTried}
          onChange={(e) => setWhatYouTried(e.target.value)}
          placeholder="Example: 'I tried moving all the red objects to the right side of the grid. When that didn't look right, I attempted to rotate them 90 degrees instead. I noticed the pattern seemed to involve mirroring across the center line...'"
          rows={6}
          className="response-textarea"
        />
          
          <div className="word-counter">
            {whatYouTried.trim().split(/\s+/).filter(w => w.length > 0).length} / 500 words
            (minimum 15 words)
          </div>
        </div>

        {/* Q9: Strategy Revision (moved here from Phase 4) */}
        <div className="question-block">
          <h3>Q4: Did you change your mind about the pattern while solving?</h3>
          
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
                placeholder="Example: 'At first I thought shapes were just rotating, but example 3 showed some shapes staying still. I realized only shapes touching the border rotate.'"
                rows={3}
                className="response-textarea small"
              />
            </div>
          )}
        </div>

        {/* Q5: Strategy Selection */}
        <div className="question-block">
          <h3>Q5: Which approach best describes how you solved this puzzle?</h3>
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