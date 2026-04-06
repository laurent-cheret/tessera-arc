import React, { useState, useEffect } from 'react';
import config from '../config';
import StateSpaceGraph from './StateSpaceGraph';
import './TaskExplorer.css';

// ARC official color palette (from InteractiveGrid.jsx)
const ARC_COLORS = {
  0: '#000000', 1: '#0074D9', 2: '#FF4136', 3: '#2ECC40', 4: '#FFDC00',
  5: '#AAAAAA', 6: '#F012BE', 7: '#FF851B', 8: '#7FDBFF', 9: '#870C25'
};

// ─── Mini grid rendered as SVG ────────────────────────────────────────────────

function MiniGrid({ grid, size = 64, highlight = false, highlightColor = '#58a6ff' }) {
  if (!grid || grid.length === 0) return <div className="mini-grid-empty" style={{ width: size, height: size }} />;

  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  if (cols === 0) return null;

  const cellSize = Math.floor(size / Math.max(rows, cols));
  const actualW = cols * cellSize;
  const actualH = rows * cellSize;

  return (
    <svg
      width={actualW}
      height={actualH}
      style={{
        display: 'block',
        border: highlight ? `2px solid ${highlightColor}` : '1px solid #30363d',
        borderRadius: 3,
        flexShrink: 0
      }}
    >
      {grid.map((row, ri) =>
        row.map((cell, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cellSize}
            y={ri * cellSize}
            width={cellSize}
            height={cellSize}
            fill={ARC_COLORS[cell] ?? '#000'}
            stroke="#1a1a1a"
            strokeWidth={cellSize > 8 ? 0.5 : 0}
          />
        ))
      )}
    </svg>
  );
}

// ─── Training examples display ────────────────────────────────────────────────

function TaskDisplay({ task }) {
  const inputGrids = task.input_grids || [];
  const outputGrids = task.output_grids || [];
  const testInput = task.test_input_grid;
  const groundTruth = task.ground_truth_output;

  return (
    <div className="task-display">
      <div className="task-display-label">Training examples</div>
      <div className="task-examples-row">
        {inputGrids.map((inputGrid, i) => (
          <div key={i} className="task-example-pair">
            <div className="example-pair-label">Example {i + 1}</div>
            <div className="example-pair-grids">
              <div className="example-grid-wrap">
                <div className="grid-sublabel">Input</div>
                <MiniGrid grid={inputGrid} size={80} />
              </div>
              <div className="example-arrow">→</div>
              <div className="example-grid-wrap">
                <div className="grid-sublabel">Output</div>
                <MiniGrid grid={outputGrids[i]} size={80} />
              </div>
            </div>
          </div>
        ))}

        {testInput && (
          <div className="task-example-pair task-example-test">
            <div className="example-pair-label">Test</div>
            <div className="example-pair-grids">
              <div className="example-grid-wrap">
                <div className="grid-sublabel">Input</div>
                <MiniGrid grid={testInput} size={80} />
              </div>
              <div className="example-arrow">→</div>
              <div className="example-grid-wrap">
                <div className="grid-sublabel">Answer</div>
                <MiniGrid grid={groundTruth} size={80} highlight highlightColor="#2ecc71" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Path timeline for one attempt ───────────────────────────────────────────

function PathTimeline({ path, convergentHashes }) {
  // Skip the 'start' snapshot if the grid is blank — not interesting
  const snapshots = path.filter((s, i) => {
    if (i === 0 && s.event === 'start') {
      const isBlank = s.grid.every(row => row.every(c => c === 0));
      return !isBlank || path.length === 1;
    }
    return true;
  });

  if (snapshots.length === 0) return <div className="path-empty">No action data</div>;

  const eventLabel = (s) => {
    switch (s.event) {
      case 'start': return 'Start';
      case 'test_solution': return s.result === 'correct' ? 'Test ✓' : 'Test ✗';
      case 'reset': return 'Reset';
      case 'clear': return 'Clear';
      case 'resize': return `Resize ${s.newRows}×${s.newCols}`;
      case 'copy_from_input': return 'Copy Input';
      default: return s.event;
    }
  };

  const eventClass = (s) => {
    if (s.event === 'test_solution') return s.result === 'correct' ? 'snap-correct' : 'snap-incorrect';
    if (s.event === 'reset' || s.event === 'clear') return 'snap-reset';
    if (s.event === 'start') return 'snap-start';
    return 'snap-neutral';
  };

  return (
    <div className="path-timeline">
      {snapshots.map((s, i) => {
        const hash = JSON.stringify(s.grid);
        const isConvergent = convergentHashes && convergentHashes.has(hash);
        return (
          <React.Fragment key={i}>
            {i > 0 && <div className="path-arrow">→</div>}
            <div className={`path-snapshot ${eventClass(s)} ${isConvergent ? 'snap-convergent' : ''}`}>
              <div className="snap-label">{eventLabel(s)}</div>
              <MiniGrid
                grid={s.grid}
                size={60}
                highlight={isConvergent}
                highlightColor="#f39c12"
              />
              {s.timestamp_ms > 0 && (
                <div className="snap-time">{Math.round(s.timestamp_ms / 1000)}s</div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Action breakdown bar ─────────────────────────────────────────────────────

function ActionBreakdown({ breakdown, total }) {
  const types = ['cell_change', 'test_solution', 'reset', 'clear', 'resize', 'select_region', 'fill_all', 'copy_from_input'];
  const colors = {
    cell_change: '#3498db',
    test_solution: '#2ecc71',
    reset: '#e74c3c',
    clear: '#e67e22',
    resize: '#9b59b6',
    select_region: '#1abc9c',
    fill_all: '#f39c12',
    copy_from_input: '#95a5a6'
  };
  const labels = {
    cell_change: 'Cell edits',
    test_solution: 'Tests',
    reset: 'Resets',
    clear: 'Clears',
    resize: 'Resizes',
    select_region: 'Selections',
    fill_all: 'Fill all',
    copy_from_input: 'Copy input'
  };

  const active = types.filter(t => breakdown[t] > 0);
  if (active.length === 0) return null;

  return (
    <div className="action-breakdown">
      <div className="breakdown-bar">
        {active.map(t => (
          <div
            key={t}
            className="breakdown-segment"
            style={{ width: `${(breakdown[t] / total) * 100}%`, background: colors[t] }}
            title={`${labels[t]}: ${breakdown[t]}`}
          />
        ))}
      </div>
      <div className="breakdown-legend">
        {active.map(t => (
          <span key={t} className="breakdown-item">
            <span className="breakdown-dot" style={{ background: colors[t] }} />
            {labels[t]}: {breakdown[t]}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Single attempt card ──────────────────────────────────────────────────────

function AttemptCard({ attempt, groundTruth, convergentHashes, index }) {
  const [expanded, setExpanded] = useState(true);

  const fmtTime = (s) => {
    if (!s) return '—';
    const n = Number(s);
    if (n < 60) return `${n}s`;
    return `${Math.floor(n / 60)}m ${n % 60}s`;
  };

  const testCount = attempt.action_breakdown?.test_solution || 0;
  const resetCount = (attempt.action_breakdown?.reset || 0) + (attempt.action_breakdown?.clear || 0);

  return (
    <div className={`attempt-card ${attempt.is_correct ? 'attempt-correct' : 'attempt-incorrect'}`}>
      <div className="attempt-header" onClick={() => setExpanded(e => !e)}>
        <div className="attempt-meta">
          <span className={`outcome-badge ${attempt.is_correct ? 'badge-correct' : 'badge-incorrect'}`}>
            {attempt.is_correct ? '✓ Correct' : '✗ Incorrect'}
          </span>
          <span className="attempt-stat">{fmtTime(attempt.duration_seconds)}</span>
          <span className="attempt-stat">{attempt.action_count} actions</span>
          <span className="attempt-stat">{testCount} test{testCount !== 1 ? 's' : ''}</span>
          {resetCount > 0 && <span className="attempt-stat">{resetCount} reset{resetCount !== 1 ? 's' : ''}</span>}
          {attempt.q7_difficulty_rating && (
            <span className="attempt-stat">Difficulty: {attempt.q7_difficulty_rating}/5</span>
          )}
        </div>
        <div className="attempt-toggle">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded && (
        <div className="attempt-body">

          {/* Q1 — Initial hypothesis */}
          <div className="response-block">
            <div className="response-label">Initial hypothesis (Q1)</div>
            <div className="response-text">{attempt.q1_main_idea || '—'}</div>
          </div>

          {/* Path timeline */}
          <div className="path-section">
            <div className="response-label">Solving path</div>
            <PathTimeline path={attempt.path} convergentHashes={convergentHashes} />
          </div>

          {/* Submitted solution vs ground truth */}
          <div className="solution-compare">
            <div className="solution-compare-item">
              <div className="response-label">Submitted answer</div>
              <MiniGrid grid={attempt.submitted_solution} size={80} />
            </div>
            <div className="solution-compare-arrow">vs</div>
            <div className="solution-compare-item">
              <div className="response-label">Correct answer</div>
              <MiniGrid grid={groundTruth} size={80} highlight highlightColor="#2ecc71" />
            </div>
          </div>

          {/* Action breakdown */}
          <div className="breakdown-section">
            <div className="response-label">Action breakdown</div>
            <ActionBreakdown breakdown={attempt.action_breakdown || {}} total={attempt.action_count} />
          </div>

          {/* Teaching responses (if correct) */}
          {attempt.is_correct && (
            <div className="teaching-block">
              <div className="response-label">Teaching responses</div>
              {attempt.q3a_what_to_look_for && (
                <div className="teaching-q">
                  <span className="teaching-q-label">Q3a — What to look for:</span>
                  <span className="teaching-q-text">{attempt.q3a_what_to_look_for}</span>
                </div>
              )}
              {attempt.q3b_how_to_transform && (
                <div className="teaching-q">
                  <span className="teaching-q-label">Q3b — How to transform:</span>
                  <span className="teaching-q-text">{attempt.q3b_how_to_transform}</span>
                </div>
              )}
              {attempt.q3c_how_to_verify && (
                <div className="teaching-q">
                  <span className="teaching-q-label">Q3c — How to verify:</span>
                  <span className="teaching-q-text">{attempt.q3c_how_to_verify}</span>
                </div>
              )}
            </div>
          )}

          {/* Incorrect path response */}
          {!attempt.is_correct && attempt.q3_what_you_tried && (
            <div className="response-block">
              <div className="response-label">What was tried (Q3)</div>
              <div className="response-text">{attempt.q3_what_you_tried}</div>
            </div>
          )}

          {/* Hypothesis revision */}
          {attempt.q9_hypothesis_revised !== null && (
            <div className="response-block">
              <div className="response-label">Revised initial hypothesis?</div>
              <div className="response-text">
                {attempt.q9_hypothesis_revised ? 'Yes' : 'No'}
                {attempt.q9_revision_reason && ` — ${attempt.q9_revision_reason}`}
              </div>
            </div>
          )}

          {/* Challenge factors */}
          {attempt.q8_challenge_factors && attempt.q8_challenge_factors.length > 0 && (
            <div className="response-block">
              <div className="response-label">Challenge factors (Q8)</div>
              <div className="challenge-tags">
                {attempt.q8_challenge_factors.map((f, i) => (
                  <span key={i} className="challenge-tag">{f}</span>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Similar tasks hover popup ────────────────────────────────────────────────

function SimilarTaskPopup({ task, anchorRect, onNavigate, onMouseEnter, onMouseLeave }) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const popupRef = React.useRef(null);

  React.useLayoutEffect(() => {
    if (!popupRef.current || !anchorRect) return;
    const popH = popupRef.current.offsetHeight;
    const popW = popupRef.current.offsetWidth;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer appearing above the card; fall back to below
    let top = anchorRect.top - popH - 10;
    if (top < 8) top = anchorRect.bottom + 10;

    // Keep horizontally within viewport
    let left = anchorRect.left + anchorRect.width / 2 - popW / 2;
    if (left < 8) left = 8;
    if (left + popW > vw - 8) left = vw - popW - 8;

    // Clamp vertically
    if (top + popH > vh - 8) top = vh - popH - 8;

    setPos({ top, left });
  }, [anchorRect]);

  const inputGrids = task.input_grids || [];
  const outputGrids = task.output_grids || [];

  return (
    <div
      ref={popupRef}
      className="similar-popup"
      style={{ top: pos.top, left: pos.left }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="similar-popup-header">
        <span className="similar-popup-id">{task.task_id}</span>
        <button className="similar-popup-nav" onClick={() => onNavigate(task.task_id)}>
          Go to task →
        </button>
      </div>
      <div className="similar-popup-examples">
        {inputGrids.map((grid, i) => (
          <div key={i} className="similar-popup-pair">
            <div className="similar-popup-pair-label">Ex {i + 1}</div>
            <div className="similar-popup-pair-grids">
              <MiniGrid grid={grid} size={90} />
              <span className="similar-arrow">→</span>
              <MiniGrid grid={outputGrids[i]} size={90} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Similar tasks panel ──────────────────────────────────────────────────────

function SimilarTasks({ taskId, onSelectTask }) {
  const [similar, setSimilar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null); // { task, anchorRect }
  const leaveTimer = React.useRef(null);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    setSimilar(null);
    setPopup(null);
    fetch(`${config.API_URL}/api/similar-tasks/${taskId}?k=5`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setSimilar(data))
      .catch(() => setSimilar([]))
      .finally(() => setLoading(false));
  }, [taskId]);

  const showPopup = (task, e) => {
    clearTimeout(leaveTimer.current);
    setPopup({ task, anchorRect: e.currentTarget.getBoundingClientRect() });
  };

  const hidePopup = () => {
    leaveTimer.current = setTimeout(() => setPopup(null), 120);
  };

  const keepPopup = () => clearTimeout(leaveTimer.current);

  if (loading) return (
    <div className="similar-tasks-section">
      <div className="similar-tasks-header">
        <span className="similar-tasks-title">Similar tasks</span>
      </div>
      <div className="similar-tasks-loading">
        <div className="dash-spinner" style={{ width: 16, height: 16 }} />
        <span>Finding similar tasks…</span>
      </div>
    </div>
  );

  if (!similar || similar.length === 0) return null;

  return (
    <>
      <div className="similar-tasks-section">
        <div className="similar-tasks-header">
          <span className="similar-tasks-title">Similar tasks</span>
          <span className="similar-tasks-hint">Top 5 closest tasks · Hover to preview · Click to navigate</span>
        </div>
        <div className="similar-tasks-strip">
          {similar.map(t => {
            const firstInput = t.input_grids?.[0];
            const firstOutput = t.output_grids?.[0];
            return (
              <button
                key={t.task_id}
                className="similar-task-card"
                onClick={() => onSelectTask(t.task_id)}
                onMouseEnter={e => showPopup(t, e)}
                onMouseLeave={hidePopup}
              >
                <div className="similar-task-preview">
                  <MiniGrid grid={firstInput} size={72} />
                  <span className="similar-arrow">→</span>
                  <MiniGrid grid={firstOutput} size={72} />
                </div>
                <div className="similar-task-footer">
                  <span className="similar-task-id">{t.task_id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {popup && (
        <SimilarTaskPopup
          task={popup.task}
          anchorRect={popup.anchorRect}
          onNavigate={id => { setPopup(null); onSelectTask(id); }}
          onMouseEnter={keepPopup}
          onMouseLeave={hidePopup}
        />
      )}
    </>
  );
}

// ─── Main TaskExplorer component ──────────────────────────────────────────────

export default function TaskExplorer() {
  const [taskList, setTaskList] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [explorerData, setExplorerData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTask, setLoadingTask] = useState(false);
  const [error, setError] = useState(null);

  // Load task list on mount
  useEffect(() => {
    fetch(`${config.API_URL}/api/analytics/tasks-with-attempts`)
      .then(r => r.json())
      .then(data => {
        setTaskList(data);
        if (data.length > 0) setSelectedTaskId(data[0].task_id);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingList(false));
  }, []);

  // Load explorer data when task changes
  useEffect(() => {
    if (!selectedTaskId) return;
    setLoadingTask(true);
    setExplorerData(null);
    fetch(`${config.API_URL}/api/analytics/task-explorer/${selectedTaskId}`)
      .then(r => r.json())
      .then(data => setExplorerData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoadingTask(false));
  }, [selectedTaskId]);

  // Build set of convergent grid hashes for highlighting
  const convergentHashes = React.useMemo(() => {
    if (!explorerData?.state_convergence?.length) return null;
    const hashes = new Set();
    explorerData.state_convergence.forEach(c => {
      hashes.add(c.grid_hash);
    });
    return hashes;
  }, [explorerData]);

  if (loadingList) {
    return (
      <div className="explorer-loading">
        <div className="dash-spinner"></div>
        <p>Loading task list…</p>
      </div>
    );
  }

  if (error) {
    return <div className="explorer-error">Error: {error}</div>;
  }

  if (taskList.length === 0) {
    return <div className="explorer-empty">No attempted tasks found.</div>;
  }

  const fmtTime = (s) => {
    if (!s) return '—';
    const n = Number(s);
    if (n < 60) return `${n}s`;
    return `${Math.floor(n / 60)}m ${n % 60}s`;
  };

  const groundTruth = explorerData?.task?.ground_truth_output;

  return (
    <div className="task-explorer">

      {/* Task selector */}
      <div className="explorer-selector-bar">
        <div className="selector-label">Select a task:</div>
        <select
          className="task-select"
          value={selectedTaskId}
          onChange={e => setSelectedTaskId(e.target.value)}
        >
          {taskList.map(t => (
            <option key={t.task_id} value={t.task_id}>
              {t.task_id} — {t.attempt_count} attempt{t.attempt_count !== '1' ? 's' : ''} · {t.accuracy_percent}% correct · avg {fmtTime(t.avg_duration_seconds)}
            </option>
          ))}
        </select>
        <div className="selector-count">{taskList.length} tasks with data</div>
      </div>

      {/* Task content */}
      {loadingTask && (
        <div className="explorer-loading">
          <div className="dash-spinner"></div>
          <p>Reconstructing solving paths…</p>
        </div>
      )}

      {explorerData && !loadingTask && (
        <>
          {/* Task grids */}
          <div className="explorer-section">
            <TaskDisplay task={explorerData.task} />
          </div>

          {/* Similar tasks strip */}
          <div className="explorer-section">
            <SimilarTasks taskId={selectedTaskId} onSelectTask={setSelectedTaskId} />
          </div>

          {/* State space graph */}
          {explorerData.attempts.length > 0 && (
            <div className="explorer-section">
              <div className="chart-card">
                <h3 className="chart-title">
                  State Space
                  <span className="chart-sub"> — each point is a unique grid configuration · hover nodes for details</span>
                </h3>
                <StateSpaceGraph
                  attempts={explorerData.attempts}
                  groundTruth={explorerData.task.ground_truth_output}
                />
              </div>
            </div>
          )}

          {/* State convergence notice */}
          {explorerData.state_convergence.length > 0 && (
            <div className="convergence-notice">
              <span className="convergence-dot" />
              {explorerData.state_convergence.length} shared grid state{explorerData.state_convergence.length !== 1 ? 's' : ''} found across attempts — highlighted in orange
            </div>
          )}

          {/* Attempt cards */}
          <div className="explorer-section">
            <div className="attempts-header">
              <h3 className="attempts-title">
                {explorerData.attempts.length} attempt{explorerData.attempts.length !== 1 ? 's' : ''} on this task
              </h3>
            </div>
            <div className="attempts-list">
              {explorerData.attempts.map((attempt, i) => (
                <AttemptCard
                  key={attempt.attempt_id}
                  attempt={attempt}
                  groundTruth={groundTruth}
                  convergentHashes={convergentHashes}
                  index={i}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
