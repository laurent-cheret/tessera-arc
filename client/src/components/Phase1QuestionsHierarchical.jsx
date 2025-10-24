import React, { useState } from 'react';
import './Phase1QuestionsHierarchical.css';
import ColorAutocompleteTextarea from './ColorAutocompleteTextarea';

const Phase1QuestionsHierarchical = ({ onComplete, initialData }) => {
  // State management
  const [currentStep, setCurrentStep] = useState('primary'); // 'primary', 'secondary', 'hypothesis', 'confidence'
  const [primaryImpression, setPrimaryImpression] = useState(initialData?.primaryImpression || '');
  const [primaryFeatures, setPrimaryFeatures] = useState(initialData?.primaryFeatures || []);
  const [primaryOtherText, setPrimaryOtherText] = useState(initialData?.primaryOtherText || '');
  const [secondaryImpressions, setSecondaryImpressions] = useState(initialData?.secondaryImpressions || []);
  const [initialHypothesis, setInitialHypothesis] = useState(initialData?.initialHypothesis || '');
  const [hypothesisConfidence, setHypothesisConfidence] = useState(initialData?.hypothesisConfidence || null);
  const [errors, setErrors] = useState({});

  // Tier 1: Primary categories
  const primaryCategories = [
    {
      value: 'visual_appearance',
      label: 'Colored figures, shapes, or patterns',
      icon: '🎨',
      description: ''
    },
    {
      value: 'spatial_arrangement',
      label: 'Where objects are located in the grid',
      icon: '📍',
      description: ''
    },
    {
      value: 'structure_connections',
      label: 'How objects are connected or linked to others',
      icon: '🔗',
      description: ''
    },
    {
      value: 'quantities_sizes',
      label: 'How many, or how large?',
      icon: '🔢',
      description: ''
    },
    {
      value: 'changes_movement',
      label: 'Flow & movement',
      icon: '➡️',
      description: ""
    },
    {
      value: 'organization_grouping',
      label: 'How things seem to be grouped',
      icon: '📊',
      description: ''
    },
    {
      value: 'rules_patterns',
      label: 'Rules or recipes to follow',
      icon: '🧩',
      description: ''
    }
  ];

  // Tier 2: Subcategories for each primary category
  const subcategories = {
    visual_appearance: [
      { value: 'specific_colors', label: 'Specific colors' },
      { value: 'color_changes', label: 'Changes in colors' },
      { value: 'shapes', label: 'Distinct shapes' },
      { value: 'symmetry', label: 'Symmetry' },
      { value: 'repeating_patterns', label: 'Repeating patterns' },
      { value: 'visual_other', label: 'Something else about appearance', needsText: true }
    ],
    spatial_arrangement: [
      { value: 'specific_positions', label: 'Specific positions' },
      { value: 'alignment', label: 'Alignment' },
      { value: 'clustering', label: 'Spread out vs. clustered' },
      { value: 'spacing', label: 'Distance or spacing' },
      { value: 'spatial_other', label: 'Something else about position', needsText: true }
    ],
    structure_connections: [
      { value: 'containment', label: 'Containment or enclosure' },
      { value: 'touching_connected', label: 'Contact or connections' },
      { value: 'paths_lines', label: 'Paths or lines' },
      { value: 'holes_gaps', label: 'Holes or gaps' },
      { value: 'grid_structure', label: 'Grid divided in distinct areas' },
      { value: 'structure_other', label: 'Something else about structure', needsText: true }
    ],
    quantities_sizes: [
      { value: 'counting_objects', label: 'Number of objects' },
      { value: 'counting_colors', label: 'Number of colors present' },
      { value: 'object_sizes', label: 'Different sizes' },
      { value: 'size_change', label: 'Objects growing or shrinking' },
      { value: 'grid_size', label: 'Grid size changing' },
      { value: 'quantity_other', label: 'Something else about quantity/size', needsText: true }
    ],
    changes_movement: [
      { value: 'position_change', label: 'Moving or shifting position' },
      { value: 'rotation_flip', label: 'Rotating or flipping' },
      { value: 'appearing_disappearing', label: 'Appearing or disappearing' },
      { value: 'directional_flow', label: 'Physics like gravity, bouncing or falling' },
      { value: 'duplication', label: 'Copying or duplicating' },
      { value: 'change_other', label: 'Something else about changes', needsText: true }
    ],
    organization_grouping: [
      { value: 'similarity_groups', label: 'Grouped by similarity' },
      { value: 'location_groups', label: 'Grouped by location' },
      { value: 'sorting_ranking', label: 'Sorting or ranking' },
      { value: 'object_layers', label: 'Stacked layers' },
      { value: 'organization_other', label: 'Something else about organization', needsText: true }
    ],
    rules_patterns: [
      { value: 'conditional_rules', label: 'If X, then Y rules' },
      { value: 'context_dependent', label: 'Changes depend on pattern' },
      { value: 'multi_step', label: 'Sequence of steps like a recipe' },
      { value: 'complex_combination', label: 'Several operations together' },
      { value: 'logical_operations', label: 'Logical changes (AND, OR, NOT, XOR)' },
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
      // If clicking on an already selected category, remove it
      setSecondaryImpressions(secondaryImpressions.filter(s => s.category !== categoryValue));
    } else {
      // When selecting a new category, remove any categories with no features selected
      const cleanedImpressions = secondaryImpressions.filter(s => s.features.length > 0);
      
      // Add the new category
      setSecondaryImpressions([...cleanedImpressions, {
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

  // Validation for each step
  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (currentStep === 'primary') {
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
    }
    
    if (currentStep === 'secondary') {
      // Only validate secondary impressions that have at least one feature selected
      // Ignore empty categories - they'll be filtered out on submit
      secondaryImpressions.filter(s => s.features.length > 0).forEach(secondary => {
        const secondaryOther = secondary.features.some(f => f.endsWith('_other'));
        if (secondaryOther && !secondary.otherText?.trim()) {
          newErrors[`secondary_other_${secondary.category}`] = 'Please describe what you noticed.';
        }
      });
    }
    
    if (currentStep === 'hypothesis') {
      const wordCount = initialHypothesis.trim().split(/\s+/).filter(w => w.length > 0).length;
      if (wordCount < 10) {
        newErrors.hypothesis = 'Please write at least 10 words describing the pattern.';
      }
      if (wordCount > 100) {
        newErrors.hypothesis = 'Please keep your description under 100 words.';
      }
    }

    if (currentStep === 'confidence') {
      if (!hypothesisConfidence) {
        newErrors.confidence = 'Please select your confidence level.';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next button click
  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    if (currentStep === 'primary') {
      setCurrentStep('secondary');
      setErrors({});
    } else if (currentStep === 'secondary') {
      setCurrentStep('hypothesis');
      setErrors({});
    } else if (currentStep === 'hypothesis') {
      setCurrentStep('confidence');
      setErrors({});
    } else if (currentStep === 'confidence') {
      // Complete Phase 1
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
  };

  // Handle skip (only for secondary)
  const handleSkipSecondary = () => {
    setSecondaryImpressions([]);
    setCurrentStep('hypothesis');
    setErrors({});
  };

  const currentSubcategories = primaryImpression ? subcategories[primaryImpression] : [];
  const availableSecondaryCategories = primaryCategories.filter(c => c.value !== primaryImpression);

  return (
    <div className="phase1-hierarchical">
      <h2>Initial Observations</h2>
      
      {/* STEP 1: Primary Impression */}
      {currentStep === 'primary' && (
        <div className="step-container">
          <div className="tier1-section">
            <h3>When you FIRST looked at the puzzle examples, what caught your attention MOST?</h3>
            <p className="instruction">Select ONE category:</p>
            
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

          <div className="button-section">
            <button 
              className="continue-btn"
              onClick={handleNext}
              disabled={!primaryImpression || primaryFeatures.length === 0}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Secondary Impressions (PROMINENT) */}
      {currentStep === 'secondary' && (
        <div className="step-container">
          <div className="secondary-prominent-section">
            <h3>Did anything else catch your attention?</h3>
            <p className="secondary-instruction">
              <strong>This is optional!</strong> You can select additional things you noticed, or skip this step.
            </p>
            <p className="secondary-hint">
              Select as many categories as you want.
            </p>
            
            <div className="secondary-categories-grid">
              {availableSecondaryCategories.map(category => {
                const secondaryData = secondaryImpressions.find(s => s.category === category.value);
                const isSelected = secondaryData !== undefined;
                const hasFeatures = secondaryData && secondaryData.features.length > 0;
                
                return (
                  <div key={category.value} className="secondary-category-wrapper">
                    <div
                      className={`secondary-card-prominent ${hasFeatures ? 'selected' : ''}`}
                      onClick={() => handleSecondaryToggle(category.value)}
                    >
                      <div className="card-icon">{category.icon}</div>
                      <div className="card-label">{category.label}</div>
                      <div className="card-description">{category.description}</div>
                      {hasFeatures && <div className="selected-checkmark">✓</div>}
                    </div>
                    
                    {isSelected && (
                      <div className="secondary-features-prominent">
                        <p className="features-prompt">What did you notice about {category.label.toLowerCase()}?</p>
                        
                        {errors[`secondary_${category.value}`] && (
                          <div className="error-message">{errors[`secondary_${category.value}`]}</div>
                        )}
                        
                        {subcategories[category.value].map(feature => {
                          const isChecked = secondaryData?.features.includes(feature.value);
                          
                          return (
                            <div key={feature.value} className="feature-item">
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
                                    value={secondaryData?.otherText || ''}
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

          <div className="button-section">
            <button 
              className={secondaryImpressions.some(s => s.features.length > 0) ? "continue-btn" : "skip-btn"}
              onClick={secondaryImpressions.some(s => s.features.length > 0) ? handleNext : handleSkipSecondary}
            >
              {secondaryImpressions.some(s => s.features.length > 0)
                ? "Next Question →" 
                : "Skip (Nothing else caught my attention)"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Initial Hypothesis */}
      {currentStep === 'hypothesis' && (
        <div className="step-container">
          <div className="q2-section">
            <h3>What pattern do you think connects the inputs to outputs?</h3>
            <p className="instruction">In simple terms, describe what rule or transformation you see:</p>
            
            {errors.hypothesis && <div className="error-message">{errors.hypothesis}</div>}
            
            <ColorAutocompleteTextarea
              value={initialHypothesis}
              onChange={(e) => setInitialHypothesis(e.target.value)}
              placeholder="Example: 'The colored squares move to the corners of the grid' or 'Red shapes become blue, and blue become red'"
              rows={4}
              className="hypothesis-textarea"
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

          <div className="button-section">
            <button 
              className="continue-btn"
              onClick={handleNext}
            >
              Next Question →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Hypothesis Confidence */}
      {currentStep === 'confidence' && (
        <div className="step-container">
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

          <div className="button-section">
            <button 
              className="continue-btn"
              onClick={handleNext}
            >
              Continue to Solving →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Phase1QuestionsHierarchical;