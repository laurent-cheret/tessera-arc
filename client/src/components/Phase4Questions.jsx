import React, { useState } from 'react';
import './Phase4Questions.css';

const Phase4Questions = ({ onComplete, initialData }) => {
  const [difficultyRating, setDifficultyRating] = useState(initialData?.difficultyRating || null);
  const [challengeFactors, setChallengeFactors] = useState(initialData?.challengeFactors || []);
  const [challengeOther, setChallengeOther] = useState(initialData?.challengeOther || '');
  const [errors, setErrors] = useState({});

  const challengeOptions = [
    { value: 'object_identification', label: 'Hard to identify what counted as an "object"' },
    { value: 'spatial_complexity', label: 'Confusing spatial relationships' },
    { value: 'multiple_changes', label: 'Too many things changing at once' },
    { value: 'unexpected_transformation', label: 'Unexpected or unusual transformation' },
    { value: 'contradictory_examples', label: 'The examples seemed to contradict each other' },
    { value: 'insufficient_examples', label: 'Not enough examples to be sure' },
    { value: 'other', label: 'Something else', needsText: true }
  ];

  const handleChallengeToggle = (value) => {
    if (challengeFactors.includes(value)) {
      setChallengeFactors(challengeFactors.filter(f => f !== value));
      if (value === 'other') {
        setChallengeOther('');
      }
    } else {
      setChallengeFactors([...challengeFactors, value]);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!difficultyRating) {
      newErrors.difficulty = 'Please rate the difficulty of this puzzle.';
    }

    if (difficultyRating >= 3 && challengeFactors.length === 0) {
      newErrors.challengeFactors = 'Please select at least one challenge factor, or select a lower difficulty.';
    }

    if (challengeFactors.includes('other') && !challengeOther.trim()) {
      newErrors.challengeOther = 'Please describe the other challenge you faced.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const data = {
        q7_difficulty_rating: difficultyRating,
        q8_challenge_factors: difficultyRating >= 3 ? challengeFactors : null,
        q8_challenge_other: (difficultyRating >= 3 && challengeFactors.includes('other')) ? challengeOther.trim() : null,
        phase4_timestamp: new Date().toISOString()
      };
      onComplete(data);
    }
  };

  return (
    <div className="phase4-questions">
      <h2>Final Reflection</h2>

      {/* Q7: Difficulty Rating */}
      <div className="question-block">
        <h3>How difficult was this puzzle for you?</h3>
        
        {errors.difficulty && <div className="error-message">{errors.difficulty}</div>}
        
        <div className="difficulty-scale">
          {[
            { value: 1, label: 'Very easy', description: 'I saw the answer immediately' },
            { value: 2, label: 'Easy', description: 'Took a moment but straightforward' },
            { value: 3, label: 'Medium', description: 'Required some trial and error' },
            { value: 4, label: 'Hard', description: 'Very challenging, took multiple attempts' },
            { value: 5, label: 'Extremely hard', description: 'Nearly impossible to figure out' }
          ].map(option => (
            <div
              key={option.value}
              className={`difficulty-option ${difficultyRating === option.value ? 'selected' : ''}`}
              onClick={() => setDifficultyRating(option.value)}
            >
              <div className="difficulty-number">{option.value}</div>
              <div className="difficulty-text">
                <div className="difficulty-label">{option.label}</div>
                <div className="difficulty-description">{option.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Q8: Challenge Factors (conditional) */}
      {difficultyRating >= 3 && (
        <div className="question-block">
          <h3>What made this puzzle challenging?</h3>
          <p className="question-hint">Check all that apply:</p>
          
          {errors.challengeFactors && <div className="error-message">{errors.challengeFactors}</div>}
          
          <div className="challenge-options">
            {challengeOptions.map(option => (
              <div key={option.value} className="challenge-item">
                <label>
                  <input
                    type="checkbox"
                    checked={challengeFactors.includes(option.value)}
                    onChange={() => handleChallengeToggle(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
                
                {option.needsText && challengeFactors.includes(option.value) && (
                  <div className="other-text-input">
                    <input
                      type="text"
                      placeholder="Describe what made it challenging..."
                      value={challengeOther}
                      onChange={(e) => setChallengeOther(e.target.value)}
                      maxLength={200}
                    />
                    {errors.challengeOther && (
                      <div className="error-message-small">{errors.challengeOther}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="continue-section">
        <button 
          className="continue-btn"
          onClick={handleSubmit}
        >
          Submit Response
        </button>
      </div>
    </div>
  );
};

export default Phase4Questions;