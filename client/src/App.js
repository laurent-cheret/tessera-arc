import React, { useState, useEffect, useRef } from 'react';
import ARCGrid from './components/ARCGrid';
import InteractiveGrid from './components/InteractiveGrid';
import Phase1QuestionsHierarchical from './components/Phase1QuestionsHierarchical';
import Phase3Questions from './components/Phase3Questions';
import Phase4Questions from './components/Phase4Questions';
import TaskReference from './components/TaskReference';
import LandingPage from './components/LandingPage';
import TurnstileVerification from './components/TurnstileVerification';
import HoneypotField from './components/HoneypotField';
import './App.css';
import config from './config';

function App() {
  // Landing page state
  const [showLanding, setShowLanding] = useState(true);
  
  // Bot protection state
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [verificationSessionId, setVerificationSessionId] = useState(null);
  const [honeypot1, setHoneypot1] = useState('');
  const [honeypot2, setHoneypot2] = useState('');
  const [showTurnstile, setShowTurnstile] = useState(false);
  
  const [arcTask, setArcTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Participant management
  const [participantId, setParticipantId] = useState(null);
  
  // Phase tracking
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
  const [solvingEndTime, setSolvingEndTime] = useState(null);
  const [solutionCorrect, setSolutionCorrect] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Test solution tracking
  const [testAttempts, setTestAttempts] = useState([]);
  const [lastTestedGrid, setLastTestedGrid] = useState(null);
  
  // Action limit tracking
  const ACTION_LIMIT = 1000;
  const ACTION_WARNING_THRESHOLD = 900;
  
  // Submission status
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // Ref for main content
  const mainContentRef = useRef(null);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Initialize participant when they pass Turnstile
  useEffect(() => {
    if (isTurnstileVerified && !participantId) {
      initializeParticipant();
    }
  }, [isTurnstileVerified, participantId]);

  const handleStartParticipation = () => {
    // TEMPORARY: Skip Turnstile in development
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Development mode: Skipping Turnstile verification');
      const devSessionId = `session_${Date.now()}_dev_bypass`;
      setIsTurnstileVerified(true);
      setVerificationSessionId(devSessionId);
      setShowLanding(false);
      setShowTurnstile(false);
    } else {
      // Production: Show Turnstile verification
      setShowLanding(false);
      setShowTurnstile(true);
    }
  };

  const handleTurnstileVerified = (sessionId) => {
    setIsTurnstileVerified(true);
    setVerificationSessionId(sessionId);
    setShowTurnstile(false);
    console.log('✅ Turnstile verification successful:', sessionId);
  };

  const handleTurnstileError = (error) => {
    console.error('❌ Turnstile error:', error);
    alert('Verification failed. Please refresh the page and try again.');
    // Reset to landing page
    setShowLanding(true);
    setShowTurnstile(false);
  };

  const initializeParticipant = async () => {
    try {
      let storedParticipantId = localStorage.getItem('arc_participant_id');
      
      const response = await fetch(`${config.API_URL}/api/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: storedParticipantId,
          sessionId: generateSessionId(),
          demographics: {}
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setParticipantId(data.participantId);
        localStorage.setItem('arc_participant_id', data.participantId);
        console.log(`Participant: ${data.participantId} (${data.status})`);
      } else {
        console.error('Failed to initialize participant:', data.error);
      }
    } catch (error) {
      console.error('Error initializing participant:', error);
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
    
    // Reset honeypots
    setHoneypot1('');
    setHoneypot2('');
    
    fetch(`${config.API_URL}/api/arc-tasks`)
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
        setTestAttempts([]);
        setLastTestedGrid(null);
        setStartTime(null);
        setSolvingEndTime(null);
        setSolutionCorrect(null);
        setShowSuccess(false);
      })
      .catch(err => {
        console.error('Error fetching ARC task:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isTurnstileVerified && !showLanding && !showTurnstile) {
      fetchNewTask();
    }
  }, [isTurnstileVerified, showLanding, showTurnstile]);

  const handlePhase1Complete = (data) => {
    setPhase1Data(data);
    setCurrentPhase('solving');
    setStartTime(Date.now());
    setSolvingEndTime(null);
    scrollToTop();
    console.log('Phase 1 Complete:', data);
  };

  const handlePhase3Complete = (data) => {
    setPhase3Data(data);
    setCurrentPhase('phase4');
    scrollToTop();
    console.log('Phase 3 Complete:', data);
  };

  const handlePhase4Complete = async (data) => {
    setPhase4Data(data);
    await submitCompleteResponse(data);
  };

  const submitCompleteResponse = async (phase4Data) => {
    if (!participantId) {
      console.error('No participant ID available');
      alert('Error: Could not identify participant. Please refresh and try again.');
      return;
    }

    // ========================================
    // BOT PROTECTION: Check honeypots FIRST
    // ========================================
    // Check React state
    if (honeypot1 || honeypot2) {
      console.warn('🤖 Bot detected via honeypot (React state)');
      console.log('Honeypot1:', honeypot1);
      console.log('Honeypot2:', honeypot2);
      
      // Silently fail - don't tell bot it was caught
      alert('Thank you for your submission!');
      
      // Reset and show landing
      setTimeout(() => {
        setShowLanding(true);
        setShowTurnstile(false);
        setIsTurnstileVerified(false);
        setVerificationSessionId(null);
      }, 2000);
      return;
    }

    // ADDITIONAL CHECK: Verify DOM inputs directly (catches bots that bypass React)
    const honeypotInputs = document.querySelectorAll('input[name="website"]');
    let honeypotFilled = false;
    honeypotInputs.forEach((input, index) => {
      if (input.value && input.value.trim() !== '') {
        console.warn(`🤖 Bot detected via honeypot DOM check (field ${index + 1})`);
        console.log(`Honeypot ${index + 1} value:`, input.value);
        honeypotFilled = true;
      }
    });

    if (honeypotFilled) {
      // Silently fail - don't tell bot it was caught
      alert('Thank you for your submission!');
      
      // Reset and show landing
      setTimeout(() => {
        setShowLanding(true);
        setShowTurnstile(false);
        setIsTurnstileVerified(false);
        setVerificationSessionId(null);
      }, 2000);
      return;
    }

    // ========================================
    // BOT PROTECTION: Check Turnstile session
    // ========================================
    if (!isTurnstileVerified || !verificationSessionId) {
      console.warn('🤖 No valid Turnstile session');
      alert('Your session has expired. Please start over.');
      setShowLanding(true);
      setShowTurnstile(false);
      return;
    }
    
    setSubmitting(true);
    setSubmissionStatus('submitting');
    
    try {
      const endTime = solvingEndTime || Date.now();
      const actualDuration = Math.floor((endTime - startTime) / 1000);
      
      const completeSubmission = {
        participantId: participantId,
        taskId: arcTask.id,
        taskType: arcTask.type,
        taskName: arcTask.name,
        
        // Include verification session for backend validation
        verificationSessionId: verificationSessionId,
        
        phase1_initial_observations: phase1Data,
        phase2_solving_process: {
          actionLog: actionLog,
          testAttempts: testAttempts,
          solutionGrid: userGrid,
          durationSeconds: actualDuration,
          isCorrect: solutionCorrect,
          reachedActionLimit: actionLog.length >= ACTION_LIMIT
        },
        phase3_post_solving: phase3Data,
        phase4_reflection: phase4Data,
        
        submissionTimestamp: new Date().toISOString(),
        totalTimeSeconds: actualDuration
      };
      
      console.log('=== SUBMITTING TO DATABASE ===');
      console.log(JSON.stringify(completeSubmission, null, 2));
      
      const response = await fetch(`${config.API_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeSubmission),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Submission successful:', result);
        setSubmissionStatus('success');
        
        alert('Thank you! Your response has been saved to the database.\n\nYour contribution helps advance AI research!');
        
        setTimeout(() => {
          setCurrentPhase('complete');
          setTimeout(() => {
            fetchNewTask();
          }, 2000);
        }, 1000);
        
      } else {
        console.error('Submission failed:', result);
        setSubmissionStatus('error');
        alert(`Submission failed: ${result.error}\n\nPlease try again or contact support.`);
      }
      
    } catch (error) {
      console.error('Network error during submission:', error);
      setSubmissionStatus('error');
      alert('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = (action) => {
    setActionLog(prev => {
      const actionNumber = prev.length + 1;
      const actionWithNumber = { ...action, actionNumber };
      const newLog = [...prev, actionWithNumber];
      
      if (newLog.length >= ACTION_LIMIT) {
        setTimeout(() => {
          setSolvingEndTime(Date.now());
          alert(`You've reached the maximum of ${ACTION_LIMIT} actions.\n\nMoving to the next phase...`);
          proceedToPhase3();
        }, 100);
      }
      else if (newLog.length === ACTION_WARNING_THRESHOLD) {
        alert(`You're approaching the action limit (${newLog.length}/${ACTION_LIMIT}).\n\nConsider moving to the next phase soon.`);
      }
      
      return newLog;
    });
  };

  const gridsAreEqual = (grid1, grid2) => {
    if (!grid1 || !grid2) return false;
    if (grid1.length !== grid2.length) return false;
    if (grid1[0]?.length !== grid2[0]?.length) return false;
    
    for (let i = 0; i < grid1.length; i++) {
      for (let j = 0; j < grid1[0].length; j++) {
        if (grid1[i][j] !== grid2[i][j]) return false;
      }
    }
    return true;
  };

  const testSolution = () => {
    if (!arcTask.test || !arcTask.test[0] || !arcTask.test[0].output) {
      alert('No test output available for this task');
      return;
    }

    if (lastTestedGrid && gridsAreEqual(userGrid, lastTestedGrid)) {
      console.log('Skipped redundant test: grid unchanged since last test');
      alert('No changes detected since last test. Make some changes before testing again.');
      return;
    }

    const correctOutput = arcTask.test[0].output;
    
    if (userGrid.length !== correctOutput.length || 
        userGrid[0].length !== correctOutput[0].length) {
      setSolutionCorrect(false);
      
      const testAttempt = {
        attemptNumber: testAttempts.length + 1,
        timestamp: Date.now(),
        result: 'incorrect_dimensions',
        userDimensions: `${userGrid.length}×${userGrid[0].length}`,
        expectedDimensions: `${correctOutput.length}×${correctOutput[0].length}`
      };
      setTestAttempts(prev => [...prev, testAttempt]);
      setLastTestedGrid(userGrid.map(row => [...row]));
      
      handleAction({
        type: 'test_solution',
        result: 'incorrect_dimensions',
        timestamp: Date.now()
      });
      
      alert(`Incorrect! Grid size doesn't match.\nYour grid: ${userGrid.length}×${userGrid[0].length}\nExpected: ${correctOutput.length}×${correctOutput[0].length}`);
      return;
    }

    let allMatch = true;
    let incorrectCells = 0;
    for (let i = 0; i < userGrid.length; i++) {
      for (let j = 0; j < userGrid[0].length; j++) {
        if (userGrid[i][j] !== correctOutput[i][j]) {
          allMatch = false;
          incorrectCells++;
        }
      }
    }

    setSolutionCorrect(allMatch);
    
    const testAttempt = {
      attemptNumber: testAttempts.length + 1,
      timestamp: Date.now(),
      result: allMatch ? 'correct' : 'incorrect_values',
      incorrectCells: incorrectCells,
      totalCells: userGrid.length * userGrid[0].length
    };
    setTestAttempts(prev => [...prev, testAttempt]);
    setLastTestedGrid(userGrid.map(row => [...row]));
    
    handleAction({
      type: 'test_solution',
      result: allMatch ? 'correct' : 'incorrect_values',
      incorrectCells: incorrectCells,
      timestamp: Date.now()
    });
    
    console.log('Test attempt logged:', testAttempt);
    
    if (allMatch) {
      setSolvingEndTime(Date.now());
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentPhase('phase3');
        scrollToTop();
      }, 2000);
      
    } else {
      alert(`Not quite right! ${incorrectCells} cell${incorrectCells !== 1 ? 's' : ''} incorrect. Keep trying!`);
    }
  };

  const proceedToPhase3 = () => {
    if (!solvingEndTime) {
      setSolvingEndTime(Date.now());
    }
    setCurrentPhase('phase3');
    scrollToTop();
  };

  const startPhase1 = () => {
    setCurrentPhase('phase1');
    scrollToTop();
  };

  const getElapsedTime = () => {
    if (!startTime) return 0;
    const endTime = solvingEndTime || Date.now();
    return Math.floor((endTime - startTime) / 1000);
  };

  // Show landing page first
  if (showLanding) {
    return <LandingPage onStartParticipation={handleStartParticipation} />;
  }

  // Show Turnstile verification after landing page
  if (showTurnstile) {
    return (
      <TurnstileVerification
        onVerified={handleTurnstileVerified}
        onError={handleTurnstileError}
      />
    );
  }

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
        <p>Capturing human reasoning, one piece at a time.</p>
        {participantId && (
          <div className="participant-info">
            Participant: {participantId.substring(0, 20)}...
          </div>
        )}
      </header>

      <main className="main-content" ref={mainContentRef}>
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

        {/* Task Reference */}
        {currentPhase === 'solving' && (
          <TaskReference
            trainingExamples={arcTask.train}
            userSolution={null}
            isCorrect={null}
            showUserSolution={false}
          />
        )}

        {currentPhase === 'phase3' && (
          <TaskReference
            trainingExamples={arcTask.train}
            userSolution={userGrid}
            isCorrect={solutionCorrect}
            showUserSolution={true}
          />
        )}

        {/* Task Info */}
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
            
            <TaskReference
              trainingExamples={arcTask.train}
              userSolution={null}
              isCorrect={null}
              showUserSolution={false}
            />

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
                  I'm Ready - Let's Begin!
                </button>
              </div>
            )}
          </section>
        )}

        {currentPhase === 'phase1' && (
          <div>
            <Phase1QuestionsHierarchical onComplete={handlePhase1Complete} initialData={phase1Data} />
            <HoneypotField value={honeypot1} onChange={setHoneypot1} />
          </div>
        )}

        {/* Phase 2: Solving Interface */}
        {currentPhase === 'solving' && (
          <>
            <section className="solving-section">
              <h3>Now Solve the Test Case</h3>
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
                    <p>Moving to next questions...</p>
                  </div>
                </div>
              )}

              <div className="test-solution-section">
                <button 
                  className="test-solution-btn"
                  onClick={testSolution}
                  type="button"
                  disabled={actionLog.length >= ACTION_LIMIT}
                >
                  Test Solution
                </button>
                {solutionCorrect === true && (
                  <span className="solution-status correct">Correct!</span>
                )}
                {solutionCorrect === false && (
                  <span className="solution-status incorrect">Incorrect</span>
                )}
                {testAttempts.length > 0 && (
                  <span className="test-attempts-count">
                    Attempts: {testAttempts.length}
                  </span>
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
                  Continue to Next Questions
                </button>
              </div>

              <div className="submission-stats">
                <p>Actions taken: {actionLog.length} / {ACTION_LIMIT}</p>
                <p>Time elapsed: {getElapsedTime()}s</p>
                {actionLog.length >= ACTION_WARNING_THRESHOLD && actionLog.length < ACTION_LIMIT && (
                  <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                    Approaching action limit!
                  </p>
                )}
                {solvingEndTime && (
                  <p style={{ color: '#28a745', fontWeight: 'bold' }}>Timer stopped</p>
                )}
              </div>
            </section>
          </>
        )}

        {/* Phase 3: Post-Solving Questions */}
        {currentPhase === 'phase3' && (
          <div>
            <Phase3Questions 
              onComplete={handlePhase3Complete}
              testInput={arcTask.test[0].input}
              userSolution={userGrid}
              isCorrect={solutionCorrect}
            />
            <HoneypotField value={honeypot2} onChange={setHoneypot2} />
          </div>
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
                  Successfully submitted to database
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