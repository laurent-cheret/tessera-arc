import React, { useState } from 'react';
import './Phase1QuestionsHierarchical.css';

const Phase1QuestionsHierarchical = ({ onComplete, initialData }) => {
  // State management
  const [primaryImpression, setPrimaryImpression] = useState(initialData?.primaryImpression || '');
  const [primaryFeatures, setPrimaryFeatures] = useState(initialData?.primaryFeatures || []);
  const [primaryOtherText, setPrimaryOtherText] = useState(initialData?.primaryOtherText || '');
  const [secondaryImpressions, setSecondaryImpressions] = useState(initialData?.secondaryImpressions || []);
  const [initialHypothesis, setInitialHypothesis] = useState(initialData?.initialHypothesis || '');
  const [hypothesisConfidence, setHypothesisConfidence] = useState(initialData?.hypothesisConfidence || null);
  const [showSecondary, setShowSecondary] = useState(false);
  const [showQ2, setShowQ2] = useState(false);
  const [showQ4, setShowQ4] = useState(false);
  const [errors, setErrors] = useState({});

  // Tier 1: Primary categories
  const primaryCategories = [
    {
      value: 'visual_appearance',
      label: 'Visual appearance',
      icon: '🎨',
      description: 'Colors, shapes, patterns, symmetry'
    },
    {
      value: 'spatial_arrangement',
      label: 'Spatial arrangement',
      icon: '📍',
      description: 'Where things are located, positions'
    },
    {
      value: 'structure_connections',
      label: 'Structure & connections',
      icon: '🔗',
      description: 'How things connect or contain each other'
    },
    {
      value: 'quantities_sizes',
      label: 'Quantities & sizes',
      icon: '🔢',
      description: 'Counting, comparing sizes'
    },
    {
      value: 'changes_movement',
      label: 'Changes & movement',
      icon: '➡️',
      description: "What's moving, transforming, changing"
    },
    {
      value: 'organization_grouping',
      label: 'Organization & grouping',
      icon: '📊',
      description: 'How things are sorted or grouped'
    },
    {
      value: 'rules_patterns',
      label: 'Rules & patterns',
      icon: '🧩',
      description: 'Conditional logic, multi-step processes'
    }
  ];

  // Tier 2: Subcategories for each primary category
  const subcategories = {
    visual_appearance: [
      { value: 'background_color', label: 'Background color' },
      { value: 'specific_colors', label: 'Specific colors present' },
      { value: 'shapes', label: 'Distinct shapes' },
      { value: 'symmetry', label: 'Symmetry' },
      { value: 'repeating_patterns', label: 'Repeating patterns or tiles' },
      { value: 'visual_other', label: 'Something else about appearance', needsText: true }
    ],
    spatial_arrangement: [
      { value: 'specific_positions', label: 'Objects in specific positions' },
      { value: 'alignment', label: 'Alignment of objects' },
      { value: 'clustering', label: 'Objects spread out vs. clustered' },
      { value: 'spacing', label: 'Distance or spacing between objects' },
      { value: 'spatial_other', label: 'Something else about position', needsText: true }
    ],
    structure_connections: [
      { value: 'containment', label: 'Objects inside other objects' },
      { value: 'touching_connected', label: 'Objects touching or connected' },
      { value: 'paths_lines', label: 'Lines or paths connecting things' },
      { value: 'holes_gaps', label: 'Holes or gaps within objects' },
      { value: 'grid_structure', label: 'Overall grid structure' },
      { value: 'structure_other', label: 'Something else about structure', needsText: true }
    ],
    quantities_sizes: [
      { value: 'counting_objects', label: 'Number of objects' },
      { value: 'counting_colors', label: 'Number of colors present' },
      { value: 'object_sizes', label: 'Different sizes of objects' },
      { value: 'size_comparison', label: 'Comparing relative sizes' },
      { value: 'quantity_other', label: 'Something else about quantity/size', needsText: true }
    ],
    changes_movement: [
      { value: 'position_change', label: 'Objects moving or shifting position' },
      { value: 'scale_change', label: 'Objects getting bigger or smaller' },
      { value: 'rotation_flip', label: 'Objects rotating or flipping' },
      { value: 'appearing_disappearing', label: 'Objects appearing or disappearing' },
      { value: 'directional_flow', label: 'Directional flow or progression' },
      { value: 'duplication', label: 'Objects being copied or duplicated' },
      { value: 'change_other', label: 'Something else about changes', needsText: true }
    ],
    organization_grouping: [
      { value: 'similarity_groups', label: 'Objects grouped by similarity' },
      { value: 'location_groups', label: 'Objects grouped by location' },
      { value: 'sorting_ranking', label: 'Objects sorted or ranked' },
      { value: 'matching', label: 'Matching or comparing elements' },
      { value: 'organization_other', label: 'Something else about organization', needsText: true }
    ],
    rules_patterns: [
      { value: 'conditional_rules', label: 'Conditional rules (if X, then Y)' },
      { value: 'context_dependent', label: 'Context-dependent transformations' },
      { value: 'multi_step', label: 'Multiple steps in sequence' },
      { value: 'complex_combination', label: 'Complex pattern combining operations' },
      { value: 'rules_other', label: 'Something else about rules', needsText: true }
    ]
  };

  // Handle primary category selection
  const handlePrimarySelect = (value) => {
    setPrimaryImpression(value);
    setPrimaryFeatures([]);
    setPrimaryOtherText('');
    setErrors({});
  };

  // Handle feature checkbox toggle
  const handleFeatureToggle = (feature) => {
    if (primaryFeatures.includes(feature)) {
      setPrimaryFeatures(primaryFeatures.filter(f => f !== feature));
      if (feature.endsWith('_other')) {
        setPrimaryOtherText('');
      }
    } else {
      setPrimaryFeatures([...primaryFeatures, feature]);
    }
  };

  // Handle secondary category selection
  const handleSecondaryToggle = (categoryValue) => {
    const existing = secondaryImpressions.find(s => s.category === categoryValue);
    
    if (existing) {
      setSecondaryImpressions(secondaryImpressions.filter(s => s.category !== categoryValue));
    } else {
      setSecondaryImpressions([...secondaryImpressions, {
        category: categoryValue,
        features: [],
        otherText: null
      }]);
    }
  };

  // Handle secondary feature toggle
  const handleSecondaryFeatureToggle = (categoryValue, feature) => {
    setSecondaryImpressions(secondaryImpressions.map(secondary => {
      if (secondary.category === categoryValue) {
        const features = secondary.features.includes(feature)
          ? secondary.features.filter(f => f !== feature)
          : [...secondary.features, feature];
        
        return {
          ...secondary,
          features,
          otherText: feature.endsWith('_other') && !features.includes(feature) ? null : secondary.otherText
        };
      }
      return secondary;
    }));
  };

  // Handle secondary other text
  const handleSecondaryOtherText = (categoryValue, text) => {
    setSecondaryImpressions(secondaryImpressions.map(secondary => {
      if (secondary.category === categoryValue) {
        return { ...secondary, otherText: text };
      }
      return secondary;
    }));
  };

  // Validation
  const validate = () => {
    const newErrors = {};
    
    if (!primaryImpression) {
      newErrors.primary = 'Please select what caught your attention most.';
    }
    
    if (primaryFeatures.length === 0) {
      newErrors.features = 'Please select at least one specific feature you noticed.';
    }
    
    const otherSelected = primaryFeatures.some(f => f.endsWith('_other'));
    if (otherSelected && !primaryOtherText.trim()) {
      newErrors.otherText = 'Please describe what else you noticed, or uncheck "Something else".';
    }
    
    // Validate secondary impressions
    secondaryImpressions.forEach(secondary => {
      if (secondary.features.length === 0) {
        newErrors[`secondary_${secondary.category}`] = 'Please select at least one feature or remove this category.';
      }
      
      const secondaryOther = secondary.features.some(f => f.endsWith('_other'));
      if (secondaryOther && !secondary.otherText?.trim()) {
        newErrors[`secondary_other_${secondary.category}`] = 'Please describe what you noticed.';
      }
    });
    
    if (showQ2) {
      const wordCount = initialHypothesis.trim().split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount < 10) {
        newErrors.hypothesis = 'Please write at least 10 words describing the pattern.';
      }
      if (wordCount > 100) {
        newErrors.hypothesis = 'Please keep your description under 100 words.';
      }
    }

    if (showQ4 && !hypothesisConfidence) {
      newErrors.confidence = 'Please select your confidence level.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle continue button
  const handleContinue = () => {
    if (!showQ2) {
      // Step 1: Q1 → Q2
      if (validate()) {
        setShowQ2(true);
        setErrors({});
      }
    } else if (!showQ4) {
      // Step 2: Q2 → Q4 (confidence)
      if (validate()) {
        setShowQ4(true);
        setErrors({});
      }
    } else {
      // Step 3: Complete Phase 1
      if (validate()) {
        const data = {
          primaryImpression,
          primaryFeatures,
          primaryOtherText: primaryOtherText.trim() || null,
          secondaryImpressions: secondaryImpressions.filter(s => s.features.length > 0),
          initialHypothesis: initialHypothesis.trim(),
          hypothesisConfidence
        };
        onComplete(data);
      }
    }
  };

  const currentSubcategories = primaryImpression ? subcategories[primaryImpression] : [];
  const availableSecondaryCategories = primaryCategories.filter(c => c.value !== primaryImpression);

  return (
    <div className="phase1-hierarchical">
      <h2>Initial Observations</h2>
      
      {/* Tier 1: Primary Impression */}
      <div className="tier1-section">
        <h3>When you FIRST looked at the puzzle examples, what caught your attention MOST?</h3>
        <p className="instruction">Select ONE:</p>
        
        {errors.primary && <div className="error-message">{errors.primary}</div>}
        
        <div className="primary-cards-grid">
          {primaryCategories.map(category => (
            <div
              key={category.value}
              className={`primary-card ${primaryImpression === category.value ? 'selected' : ''}`}
              onClick={() => handlePrimarySelect(category.value)}
            >
              <div className="card-icon">{category.icon}</div>
              <div className="card-label">{category.label}</div>
              <div className="card-description">{category.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier 2: Specific Features */}
      {primaryImpression && (
        <div className="tier2-section">
          <h3>What specifically did you notice about {primaryCategories.find(c => c.value === primaryImpression)?.label.toLowerCase()}?</h3>
          <p className="instruction">Check ALL that apply:</p>
          
          {errors.features && <div className="error-message">{errors.features}</div>}
          
          <div className="features-list">
            {currentSubcategories.map(feature => (
              <div key={feature.value} className="feature-item">
                <label>
                  <input
                    type="checkbox"
                    checked={primaryFeatures.includes(feature.value)}
                    onChange={() => handleFeatureToggle(feature.value)}
                  />
                  <span>{feature.label}</span>
                </label>
                
                {feature.needsText && primaryFeatures.includes(feature.value) && (
                  <div className="other-text-input">
                    <input
                      type="text"
                      placeholder="Describe what you noticed..."
                      value={primaryOtherText}
                      onChange={(e) => setPrimaryOtherText(e.target.value)}
                      maxLength={100}
                    />
                    {errors.otherText && <div className="error-message-small">{errors.otherText}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier 3: Secondary Impressions */}
      {primaryImpression && primaryFeatures.length > 0 && !showQ2 && (
        <div className="tier3-section">
          <button 
            className="expand-secondary-btn"
            onClick={() => setShowSecondary(!showSecondary)}
          >
            {showSecondary ? '▼' : '▶'} Did you notice anything else? (Optional)
          </button>
          
          {showSecondary && (
            <div className="secondary-content">
              <p className="secondary-hint">Select any additional categories you noticed:</p>
              
              <div className="secondary-categories-grid">
                {availableSecondaryCategories.map(category => {
                  const isSelected = secondaryImpressions.some(s => s.category === category.value);
                  
                  return (
                    <div key={category.value} className="secondary-category-wrapper">
                      <div
                        className={`secondary-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSecondaryToggle(category.value)}
                      >
                        <div className="card-icon-small">{category.icon}</div>
                        <div className="card-label-small">{category.label}</div>
                      </div>
                      
                      {isSelected && (
                        <div className="secondary-features">
                          {errors[`secondary_${category.value}`] && (
                            <div className="error-message-small">{errors[`secondary_${category.value}`]}</div>
                          )}
                          
                          {subcategories[category.value].map(feature => {
                            const secondary = secondaryImpressions.find(s => s.category === category.value);
                            const isChecked = secondary?.features.includes(feature.value);
                            
                            return (
                              <div key={feature.value} className="secondary-feature-item">
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleSecondaryFeatureToggle(category.value, feature.value)}
                                  />
                                  <span>{feature.label}</span>
                                </label>
                                
                                {feature.needsText && isChecked && (
                                  <div className="other-text-input">
                                    <input
                                      type="text"
                                      placeholder="Describe..."
                                      value={secondary?.otherText || ''}
                                      onChange={(e) => handleSecondaryOtherText(category.value, e.target.value)}
                                      maxLength={100}
                                    />
                                    {errors[`secondary_other_${category.value}`] && (
                                      <div className="error-message-small">{errors[`secondary_other_${category.value}`]}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Q2: Initial Hypothesis */}
      {showQ2 && !showQ4 && (
        <div className="q2-section">
          <h3>What pattern do you think connects the inputs to outputs?</h3>
          <p className="instruction">In simple terms, describe what rule or transformation you see:</p>
          
          {errors.hypothesis && <div className="error-message">{errors.hypothesis}</div>}
          
          <textarea
            className="hypothesis-textarea"
            value={initialHypothesis}
            onChange={(e) => setInitialHypothesis(e.target.value)}
            placeholder="Example: 'The colored squares move to the corners of the grid' or 'Red shapes become blue, and blue become red'"
            rows={4}
          />
          
          <div className="word-counter">
            {initialHypothesis.trim().split(/\s+/).filter(w => w.length > 0).length} / 100 words
            (minimum 10 words)
          </div>
          
          <div className="q2-examples">
            <p><strong>Good examples:</strong></p>
            <ul>
              <li>"The colored squares move to the corners of the grid"</li>
              <li>"Each object gets flipped upside down"</li>
              <li>"Red shapes become blue, and blue become red"</li>
            </ul>
            <p><strong>Avoid:</strong> Too vague ("Things change position") or too technical ("Applying a 90-degree rotational matrix transformation")</p>
          </div>
        </div>
      )}

      {/* Q4: Hypothesis Confidence (NEW - moved here) */}
      {showQ4 && (
        <div className="q4-section">
          <h3>How confident are you in your hypothesis?</h3>
          <p className="instruction">Before you try to solve it, how sure are you that your pattern idea is correct?</p>
          
          {errors.confidence && <div className="error-message">{errors.confidence}</div>}
          
          <div className="confidence-scale">
            {[
              { value: 1, label: 'Not confident at all', description: 'Just guessing / No idea' },
              { value: 2, label: 'Slightly confident', description: 'Not very sure / Probably wrong' },
              { value: 3, label: 'Moderately confident', description: 'Somewhat confident / Might be right' },
              { value: 4, label: 'Very confident', description: 'Pretty sure / Likely correct' },
              { value: 5, label: 'Extremely confident', description: 'Very sure / Definitely correct' }
            ].map(option => (
              <div
                key={option.value}
                className={`confidence-option ${hypothesisConfidence === option.value ? 'selected' : ''}`}
                onClick={() => setHypothesisConfidence(option.value)}
              >
                <div className="confidence-number">{option.value}</div>
                <div className="confidence-text">
                  <div className="confidence-label">{option.label}</div>
                  <div className="confidence-description">{option.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="continue-section">
        <button 
          className="continue-btn"
          onClick={handleContinue}
          disabled={!primaryImpression || primaryFeatures.length === 0}
        >
          {showQ4 ? 'Continue to Solving →' : showQ2 ? 'Next Question →' : 'Next Question →'}
        </button>
      </div>
    </div>
  );
};

export default Phase1QuestionsHierarchical;