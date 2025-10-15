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
      value: 'visual_pattern_matching',
      emoji: '📸',
      label: 'Visual Pattern Matching',
      description: 'I recognized this pattern from similar puzzles I\'ve seen before. I matched the visual structure to a known transformation type.',
      when: 'You immediately recognized the pattern type (rotation, reflection, etc.) because you\'ve seen similar puzzles.'
    },
    {
      value: 'rule_induction',
      emoji: '🔍',
      label: 'Rule Induction from Examples',
      description: 'I systematically compared all training examples to find what stays the same and what changes, then extracted the underlying rule.',
      when: 'You carefully analyzed each example pair to identify the consistent transformation rule.'
    },
    {
      value: 'trial_and_error',
      emoji: '🎲',
      label: 'Trial-and-Error Exploration',
      description: 'I tried different ideas by manipulating the grid, seeing what works, and adjusting based on what I observed.',
      when: 'You experimented with the interactive grid, testing multiple approaches until something looked right.'
    },
    {
      value: 'decomposition',
      emoji: '🧩',
      label: 'Decomposition into Subtasks',
      description: 'I broke the problem into smaller pieces (identify objects, apply transformation, position results) and solved each piece separately.',
      when: 'You split the complex problem into manageable steps.'
    },
    {
      value: 'working_backwards',
      emoji: '⏪',
      label: 'Working Backwards from Output',
      description: 'I started with the expected output and worked backwards to figure out what operations would produce it from the input.',
      when: 'You analyzed the output first, then reverse-engineered the transformation.'
    },
    {
      value: 'constraint_based',
      emoji: '📏',
      label: 'Constraint-Based Reasoning',
      description: 'I identified constraints (grid size, color rules, position limits) and used them to narrow down possible transformations.',
      when: 'You focused on what\'s NOT allowed to eliminate options.'
    },
    {
      value: 'geometric_reasoning',
      emoji: '🔄',
      label: 'Symmetry and Geometric Reasoning',
      description: 'I focused on geometric properties like symmetry, rotation, reflection, or spatial relationships between objects.',
      when: 'You primarily thought in terms of geometric transformations.'
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
          <h3>Q5: Which approach best describes how you tackled this puzzle?</h3>
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
                <p className="strategy-description">{s.description}</p>
                <p className="strategy-when"><strong>When to select:</strong> {s.when}</p>
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