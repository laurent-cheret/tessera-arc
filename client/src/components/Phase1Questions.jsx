import React, { useState } from 'react';
import './Phase1Questions.css';
import ColorAutocompleteTextarea from './ColorAutocompleteTextarea';

const Phase1Questions = ({ onComplete, initialData }) => {
  const [mainIdea, setMainIdea] = useState(initialData?.mainIdea || '');
  const [error, setError] = useState('');

  const MAX_WORDS = 40;
  const MIN_WORDS = 10;

  const handleTextChange = (e) => {
    const newText = e.target.value;
    const wordCount = newText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    // Only update if word count is within limit or text is being deleted
    if (wordCount <= MAX_WORDS || newText.length < mainIdea.length) {
      setMainIdea(newText);
      setError('');
    }
    // If trying to add more words beyond limit, just ignore the input
  };

  const handleSubmit = () => {
    const wordCount = mainIdea.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (wordCount < MIN_WORDS) {
      setError(`Please write at least ${MIN_WORDS} words describing the main idea.`);
      return;
    }
    
    if (wordCount > MAX_WORDS) {
      setError(`Please keep your description under ${MAX_WORDS} words.`);
      return;
    }
    
    // Pass data to parent
    onComplete({
      mainIdea: mainIdea.trim()
    });
  };

  const wordCount = mainIdea.trim().split(/\s+/).filter(w => w.length > 0).length;
  
  // Determine word counter status
  const getWordCounterClass = () => {
    if (wordCount < MIN_WORDS) return 'word-counter-low';
    if (wordCount >= MIN_WORDS && wordCount <= MAX_WORDS) return 'word-counter-good';
    return 'word-counter-high';
  };

  const getWordCounterText = () => {
    if (wordCount < MIN_WORDS) {
      return `${wordCount} / ${MAX_WORDS} words (need ${MIN_WORDS - wordCount} more)`;
    }
    if (wordCount === MAX_WORDS) {
      return `${wordCount} / ${MAX_WORDS} words (limit reached) ✓`;
    }
    return `${wordCount} / ${MAX_WORDS} words ✓`;
  };

  return (
    <div className="phase1-questions">
      <h2>Before You Start Solving</h2>
      
      <div className="question-container">
        <h3>What is the main idea of this puzzle?</h3>
        
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
        
        {/* <div className={`word-counter ${getWordCounterClass()}`}>
          {getWordCounterText()}
        </div> */}
        
        <div className="helpful-hints">
          <p><strong>Helpful hints:</strong></p>
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
          disabled={wordCount < MIN_WORDS}
        >
          Continue to Solving →
        </button>
      </div>
    </div>
  );
};

export default Phase1Questions;