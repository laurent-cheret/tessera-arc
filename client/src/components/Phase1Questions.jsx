import React, { useState } from 'react';
import './Phase1Questions.css';
import ColorAutocompleteTextarea from './ColorAutocompleteTextarea';

const Phase1Questions = ({ onComplete, initialData }) => {
  const [mainIdea, setMainIdea] = useState(initialData?.mainIdea || '');
  const [error, setError] = useState('');

  const MAX_WORDS = 40;
  const MIN_WORDS = 10;
  const MAX_CHARS = 500; // NEW: Character limit

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    const wordCount = getWordCount(newText);
    const charCount = newText.length;
    
    // NEW: Enforce character limit first
    if (charCount > MAX_CHARS && newText.length > mainIdea.length) {
      // Prevent typing beyond character limit (but allow deletion)
      return;
    }
    
    // Then enforce word limit
    if (wordCount <= MAX_WORDS) {
      setMainIdea(newText);
      setError('');
    } else if (newText.length < mainIdea.length) {
      // Allow deletion even when over limit
      setMainIdea(newText);
      setError('');
    }
  };

  const handleSubmit = () => {
    const wordCount = getWordCount(mainIdea);
    const charCount = mainIdea.length;
    
    // NEW: Validate character count
    if (charCount > MAX_CHARS) {
      setError(`Your response is too long (${charCount} characters). Please keep it under ${MAX_CHARS} characters.`);
      return;
    }
    
    if (wordCount < MIN_WORDS) {
      setError(`Please write at least ${MIN_WORDS} words describing the main idea.`);
      return;
    }
    
    onComplete({
      mainIdea: mainIdea.trim()
    });
  };

  const wordCount = getWordCount(mainIdea);
  const charCount = mainIdea.length; // NEW
  
  const getWordCounterClass = () => {
    if (wordCount < MIN_WORDS) return 'word-counter-low';
    if (wordCount >= MAX_WORDS - 5) return 'word-counter-warning';
    return 'word-counter-good';
  };

  const getWordCounterText = () => {
    if (wordCount < MIN_WORDS) {
      return `${wordCount} / ${MAX_WORDS} words (need ${MIN_WORDS - wordCount} more)`;
    }
    if (wordCount === MAX_WORDS) {
      return `${wordCount} / ${MAX_WORDS} words (limit reached) ✓`;
    }
    if (wordCount >= MAX_WORDS - 5) {
      return `${wordCount} / ${MAX_WORDS} words (${MAX_WORDS - wordCount} remaining)`;
    }
    return `${wordCount} / ${MAX_WORDS} words ✓`;
  };

  // NEW: Character counter styling
  const getCharCounterClass = () => {
    if (charCount > MAX_CHARS) return 'char-counter-error';
    if (charCount >= MAX_CHARS - 50) return 'char-counter-warning';
    return 'char-counter-normal';
  };

  return (
    <div className="phase1-questions">
      <h2>Before You Start Solving</h2>
      
      <div className="question-container">
        <h3>💭 What is the main idea of this puzzle?</h3>
        
        <p className="instruction">
          Take a moment to look at the examples. In your own words, describe the "big picture" 
          in <strong>10-40 words</strong> - what do you think is happening? What's the core concept or transformation?
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <ColorAutocompleteTextarea
          value={mainIdea}
          onChange={handleTextChange}
          placeholder="Example: 'Objects are moving toward the center' or 'Each shape gets copied and rotated' or 'Colors are swapping positions based on their size'"
          rows={6}
          className="main-idea-textarea"
        />
        
        {/* NEW: Combined counter display */}
        <div className="counter-container">
          <div className={`word-counter ${getWordCounterClass()}`}>
            {getWordCounterText()}
          </div>
          <div className={`char-counter ${getCharCounterClass()}`}>
            {charCount} / {MAX_CHARS} characters
          </div>
        </div>
        
        <div className="helpful-hints">
          <p><strong>💡 Helpful hints:</strong></p>
          <ul>
            <li>Think about what's <strong>changing</strong> from input to output</li>
            <li>Consider what <strong>stays the same</strong> and what <strong>transforms</strong></li>
            <li>Describe it like you're explaining to a friend - no technical jargon needed!</li>
            <li>You don't need to be 100% correct - just share your initial impression</li>
            <li><strong>Keep it concise</strong> - focus on the main transformation (max 40 words)</li>
          </ul>
        </div>
      </div>

      <div className="button-section">
        <button 
          className="continue-btn"
          onClick={handleSubmit}
          disabled={wordCount < MIN_WORDS || charCount > MAX_CHARS}
        >
          Continue to Solving →
        </button>
      </div>
    </div>
  );
};

export default Phase1Questions;