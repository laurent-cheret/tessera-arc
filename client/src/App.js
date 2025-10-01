import React, { useState, useEffect } from 'react';
import ARCGrid from './components/ARCGrid';
import InteractiveGrid from './components/InteractiveGrid';
import Phase1QuestionsHierarchical from './components/Phase1QuestionsHierarchical';
import Phase3Questions from './components/Phase3Questions';
import Phase4Questions from './components/Phase4Questions';
import LandingPage from './components/LandingPage';
import './App.css';

function App() {
  // NEW: Landing page state
  const [showLanding, setShowLanding] = useState(true);
  
  const [arcTask, setArcTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Participant management
  const [participantId, setParticipantId] = useState(null);
  
  // Phase tracking: viewing → phase1 → solving → phase3 → phase4 → complete
  const [currentPhase, setCurrentPhase] = useState('viewing');
  
  // All questionnaire data
  const [phase1Data, setPhase1Data] = useState(null);
  const [phase3Data, setPhase3Data] = useState(null);
  const [phase4Data, setPhase4Data] = useState(null);
  
  // Solving phase data
  const [userGrid, setUserGrid] = useState(null);
  const [testInputGrid, setTestInputGrid] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [solutionCorrect, setSolutionCorrect] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Submission status
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // MODIFIED: Only initialize participant when they start (not on landing page)
  useEffect(() => {
    if (!showLanding && !participantId) {
      initializeParticipant();
    }
  }, [showLanding, participantId]);

  // NEW: Handle starting participation from landing page
  const handleStartParticipation = () => {
    setShowLanding(false);
    // Participant will be initialized by the useEffect above
  };

  const initializeParticipant = async () => {
    try {
      // Check if participant ID exists in localStorage (optional)
      let storedParticipantId = localStorage.getItem('arc_participant_id');
      
      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: storedParticipantId,
          sessionId: generateSessionId(),
          demographics: {} // Could collect basic demographics here
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setParticipantId(data.participantId);
        localStorage.setItem('arc_participant_id', data.participantId);
        console.log(`👤 Participant: ${data.participantId} (${data.status})`);
      } else {
        console.error('Failed to initialize participant:', data.error);
        // Continue without participant ID - submissions will still work
      }
    } catch (error) {
      console.error('Error initializing participant:', error);
      // Continue without participant ID
    }
  };

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const fetchNewTask = () => {
    setLoading(true);
    setCurrentPhase('viewing');
    
    // Reset all data
    setPhase1Data(null);
    setPhase3Data(null);
    setPhase4Data(null);
    setSubmissionStatus(null);
    
    fetch('/api/arc-tasks')
      .then(res => res.json())
      .then(data => {
        setArcTask(data.task);
        setLoading(false);
        
        // Initialize solving data
        if (data.task.test && data.task.test[0]) {
          const testInput = data.task.test[0].input;
          setTestInputGrid(testInput);
          setUserGrid(testInput.map(row => [...row]));
        }
        
        // Reset solving state
        setActionLog([]);
        setStartTime(null);
        setSolutionCorrect(null);
        setShowSuccess(false);
      })
      .catch(err => {
        console.error('Error fetching ARC task:', err);
        setLoading(false);
      });
  };

  // MODIFIED: Only fetch task when not showing landing page
  useEffect(() => {
    if (!showLanding) {
      fetchNewTask();
    }
  }, [showLanding]);

  const handlePhase1Complete = (data) => {
    setPhase1Data(data);
    setCurrentPhase('solving');
    setStartTime(Date.now()); // Start timing when they begin solving
    console.log('Phase 1 Complete:', data);
  };

  const handlePhase3Complete = (data) => {
    setPhase3Data(data);
    setCurrentPhase('phase4');
    console.log('Phase 3 Complete:', data);
  };

  const handlePhase4Complete = async (data) => {
    setPhase4Data(data);
    
    // Compile all data and submit to database
    await submitCompleteResponse(data);
  };

  const submitCompleteResponse = async (phase4Data) => {
    if (!participantId) {
      console.error('No participant ID available');
      alert('Error: Could not identify participant. Please refresh and try again.');
      return;
    }
    
    setSubmitting(true);
    setSubmissionStatus('submitting');
    
    try {
      const completeSubmission = {
        participantId: participantId,
        taskId: arcTask.id,
        taskType: arcTask.type,
        taskName: arcTask.name,
        
        // Phase 1: Initial observations (BEFORE solving)
        phase1_initial_observations: phase1Data,
        
        // Phase 2: Solving behavior (action logs)
        phase2_solving_process: {
          actionLog: actionLog,
          solutionGrid: userGrid,
          durationSeconds: Math.floor((Date.now() - startTime) / 1000),
          isCorrect: solutionCorrect
        },
        
        // Phase 3: Post-solving questions
        phase3_post_solving: phase3Data,
        
        // Phase 4: Final reflection
        phase4_reflection: phase4Data,
        
        // Metadata
        submissionTimestamp: new Date().toISOString(),
        totalTimeSeconds: Math.floor((Date.now() - startTime) / 1000)
      };
      
      console.log('=== SUBMITTING TO DATABASE ===');
      console.log(JSON.stringify(completeSubmission, null, 2));
      
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeSubmission),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ Submission successful:', result);
        setSubmissionStatus('success');
        
        // Show success message
        alert('🎉 Thank you! Your response has been saved to the database.\n\nYour contribution helps advance AI research!');
        
        // Auto-load new task after short delay
        setTimeout(() => {
          setCurrentPhase('complete');
          setTimeout(() => {
            fetchNewTask();
          }, 2000);
        }, 1000);
        
      } else {
        console.error('❌ Submission failed:', result);
        setSubmissionStatus('error');
        alert(`❌ Submission failed: ${result.error}\n\nPlease try again or contact support.`);
      }
      
    } catch (error) {
      console.error('❌ Network error during submission:', error);
      setSubmissionStatus('error');
      alert('❌ Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = (action) => {
    setActionLog(prev => [...prev, action]);
  };

  const testSolution = () => {
    if (!arcTask.test || !arcTask.test[0] || !arcTask.test[0].output) {
      alert('No test output available for this task');
      return;
    }

    const correctOutput = arcTask.test[0].output;
    
    if (userGrid.length !== correctOutput.length || 
        userGrid[0].length !== correctOutput[0].length) {
      setSolutionCorrect(false);
      alert(`❌ Incorrect! Grid size doesn't match.\nYour grid: ${userGrid.length}×${userGrid[0].length}\nExpected: ${correctOutput.length}×${correctOutput[0].length}`);
      return;
    }

    let allMatch = true;
    for (let i = 0; i < userGrid.length; i++) {
      for (let j = 0; j < userGrid[0].length; j++) {
        if (userGrid[i][j] !== correctOutput[i][j]) {
          allMatch = false;
          break;
        }
      }
      if (!allMatch) break;
    }

    setSolutionCorrect(allMatch);
    
    if (allMatch) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert('❌ Not quite right! Keep trying!');
    }
  };

  const proceedToPhase3 = () => {
    setCurrentPhase('phase3');
  };

  const startPhase1 = () => {
    setCurrentPhase('phase1');
  };

  // NEW: Show landing page first
  if (showLanding) {
    return <LandingPage onStartParticipation={handleStartParticipation} />;
  }

  // Rest of the component remains exactly the same...
  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading ARC task...</p>
      </div>
    );
  }

  if (!arcTask) {
    return (
      <div className="loading">
        <div className="error-icon">⚠️</div>
        <p>No tasks available</p>
        <button onClick={fetchNewTask} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
      <img src="/logo192.png" alt="Tessera-ARC Logo" style={{ width: '60px', marginBottom: '10px' }} />
        <h1>Tessera ARC</h1>
        <p>Capturing human reasoning, one piece at a time</p>
        {participantId && (
          <div className="participant-info">
            👤 Participant: {participantId.substring(0, 20)}...
          </div>
        )}
      </header>

      <main className="main-content">
        {/* Progress Indicator */}
        {currentPhase !== 'complete' && (
          <div className="progress-indicator">
            <div className={`progress-step ${currentPhase === 'viewing' || currentPhase === 'phase1' ? 'active' : 'completed'}`}>
              <span className="step-number">1</span>
              <span className="step-label">Study Examples</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentPhase === 'phase1' ? 'active' : currentPhase === 'solving' || currentPhase === 'phase3' || currentPhase === 'phase4' ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Initial Thoughts</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentPhase === 'solving' ? 'active' : currentPhase === 'phase3' || currentPhase === 'phase4' ? 'completed' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Solve Puzzle</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentPhase === 'phase3' ? 'active' : currentPhase === 'phase4' ? 'completed' : ''}`}>
              <span className="step-number">4</span>
              <span className="step-label">Explain Solution</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${currentPhase === 'phase4' ? 'active' : ''}`}>
              <span className="step-number">5</span>
              <span className="step-label">Final Reflection</span>
            </div>
          </div>
        )}

        {/* Task Info - Always show training examples in viewing/phase1 */}
        {(currentPhase === 'viewing' || currentPhase === 'phase1') && (
          <section className="task-section">
            <div className="task-header">
              <h2>Task: {arcTask.name}</h2>
              <button 
                className="new-task-btn"
                onClick={fetchNewTask}
                type="button"
              >
                Load New Task
              </button>
            </div>
            
            <div className="training-examples">
              <h3>Training Examples</h3>
              <p>Study these input-output pairs to understand the pattern:</p>
              
              {arcTask.train.map((pair, index) => (
                <div key={index} className="training-pair">
                  <h4>Example {index + 1}</h4>
                  <div className="grids-container">
                    <ARCGrid grid={pair.input} title="Input" />
                    <ARCGrid grid={pair.output} title="Output" />
                  </div>
                </div>
              ))}
            </div>

            {currentPhase === 'viewing' && (
              <div className="phase-transition">
                <p className="transition-text">
                  Take your time to study the examples above. When you're ready, 
                  answer a few quick questions about what you notice!
                </p>
                <button 
                  className="start-phase1-btn"
                  onClick={startPhase1}
                  type="button"
                >
                  I'm Ready - Let's Begin! →
                </button>
              </div>
            )}
          </section>
        )}

        {currentPhase === 'phase1' && (
          <Phase1QuestionsHierarchical onComplete={handlePhase1Complete} initialData={phase1Data} />
        )}

        {/* Phase 2: Solving Interface */}
        {currentPhase === 'solving' && (
          <>
            <section className="solving-section">
              <h3>🎯 Now Solve the Test Case</h3>
              <p><strong>Instructions:</strong> Based on the pattern you observed, create the correct output for this test input:</p>
              
              <div className="test-case">
                {arcTask.test && arcTask.test[0] && (
                  <div className="solving-area">
                    <div className="input-display">
                      <ARCGrid grid={arcTask.test[0].input} title="Test Input (Read Only)" />
                    </div>
                    
                    <div className="solution-editor">
                      <h4>Your Solution (Click cells to edit):</h4>
                      {userGrid && testInputGrid && (
                        <InteractiveGrid
                          initialGrid={testInputGrid}
                          currentGrid={userGrid}
                          onGridChange={setUserGrid}
                          onAction={handleAction}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="response-section">
              {showSuccess && (
                <div className="success-animation">
                  <div className="success-content">
                    <div className="success-icon">🎉</div>
                    <h2>Correct Solution!</h2>
                    <p>Great job! You solved it!</p>
                  </div>
                </div>
              )}

              <div className="test-solution-section">
                <button 
                  className="test-solution-btn"
                  onClick={testSolution}
                  type="button"
                >
                  🧪 Test Solution
                </button>
                {solutionCorrect === true && (
                  <span className="solution-status correct">✓ Correct!</span>
                )}
                {solutionCorrect === false && (
                  <span className="solution-status incorrect">✗ Incorrect</span>
                )}
              </div>

              <div className="proceed-section">
                <p className="proceed-text">
                  When you're satisfied with your solution (or ready to move on), 
                  continue to answer more questions about your approach.
                </p>
                <button 
                  className="proceed-btn"
                  onClick={proceedToPhase3}
                  type="button"
                >
                  Continue to Next Questions →
                </button>
              </div>

              <div className="submission-stats">
                <p>📊 Actions taken: {actionLog.length}</p>
                <p>⏱️ Time elapsed: {startTime ? Math.floor((Date.now() - startTime) / 1000) : 0}s</p>
              </div>
            </section>
          </>
        )}

        {/* Phase 3: Post-Solving Questions */}
        {currentPhase === 'phase3' && (
          <Phase3Questions onComplete={handlePhase3Complete} />
        )}

        {/* Phase 4: Final Reflection Questions */}
        {currentPhase === 'phase4' && (
          <Phase4Questions onComplete={handlePhase4Complete} />
        )}

        {/* Completion Message */}
        {currentPhase === 'complete' && (
          <div className="completion-message">
            <div className="completion-content">
              <div className="completion-icon">✨</div>
              <h2>Thank You!</h2>
              <p>Your response has been saved to the database.</p>
              <p>Loading next task...</p>
              {submissionStatus === 'success' && (
                <div className="success-details">
                  ✅ Successfully submitted to database
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submission Status Overlay */}
        {submitting && (
          <div className="submission-overlay">
            <div className="submission-modal">
              <div className="submission-spinner"></div>
              <h3>Saving Your Response...</h3>
              <p>Please don't close this window</p>
              <div className="submission-progress">
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;