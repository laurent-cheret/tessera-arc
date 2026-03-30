import React, { useState, useEffect } from 'react';
import config from '../config';
import TaskExplorer from './TaskExplorer';
import './AnalyticsDashboard.css';

// ─── Small chart components ───────────────────────────────────────────────────

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DonutChart({ correct, incorrect }) {
  const total = Number(correct) + Number(incorrect);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const correctFrac = total > 0 ? Number(correct) / total : 0;
  const correctArc = correctFrac * circumference;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {/* Background (incorrect) ring */}
      <circle cx="80" cy="80" r={radius} fill="none" stroke="#e74c3c" strokeWidth="22" />
      {/* Correct arc */}
      {total > 0 && (
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="#2ecc71"
          strokeWidth="22"
          strokeDasharray={`${correctArc} ${circumference}`}
          transform="rotate(-90 80 80)"
        />
      )}
      <text x="80" y="74" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#e6edf3">
        {total > 0 ? `${Math.round(correctFrac * 100)}%` : '—'}
      </text>
      <text x="80" y="93" textAnchor="middle" fontSize="11" fill="#8b949e">accuracy</text>
      <text x="80" y="110" textAnchor="middle" fontSize="10" fill="#8b949e">
        {correct} correct / {incorrect} incorrect
      </text>
    </svg>
  );
}

function BarChart({ data, valueKey, labelKey, color = '#4ecdc4', height = 150 }) {
  if (!data || data.length === 0) return <div className="chart-empty">No data yet</div>;
  const max = Math.max(...data.map(d => Number(d[valueKey])));
  const W = 460;
  const barW = Math.floor(W / data.length);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 36}`} className="arc-svg">
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const barH = max > 0 ? (val / max) * height : 0;
        const x = i * barW;
        const label = String(d[labelKey]);
        return (
          <g key={i}>
            <rect x={x + 2} y={height - barH} width={barW - 4} height={barH} fill={color} rx={2} />
            {val > 0 && (
              <text x={x + barW / 2} y={height - barH - 5} textAnchor="middle" fontSize={9} fill="#e6edf3">
                {val}
              </text>
            )}
            <text x={x + barW / 2} y={height + 14} textAnchor="middle" fontSize={9} fill="#8b949e">
              {label.length > 8 ? label.substring(0, 8) + '…' : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HBarChart({ data, valueKey, labelKey, color = '#9b59b6' }) {
  if (!data || data.length === 0) return <div className="chart-empty">No data yet</div>;
  const max = Math.max(...data.map(d => Number(d[valueKey])));
  const rowH = 26;
  const labelW = 170;
  const barAreaW = 240;
  const totalH = data.length * rowH + 4;

  return (
    <svg width="100%" viewBox={`0 0 ${labelW + barAreaW + 40} ${totalH}`} className="arc-svg">
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const barW = max > 0 ? (val / max) * barAreaW : 0;
        const y = i * rowH;
        const label = String(d[labelKey]);
        return (
          <g key={i}>
            <text x={labelW - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize={10} fill="#cdd9e5">
              {label.length > 22 ? label.substring(0, 22) + '…' : label}
            </text>
            <rect x={labelW} y={y + 5} width={barW} height={rowH - 10} fill={color} rx={2} />
            <text x={labelW + barW + 5} y={y + rowH / 2 + 4} fontSize={10} fill="#8b949e">
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function TimelineChart({ data, height = 150 }) {
  if (!data || data.length === 0) return <div className="chart-empty">No submissions in last 90 days</div>;
  const max = Math.max(...data.map(d => Number(d.total)));
  const W = 460;
  const slotW = W / data.length;
  const barW = Math.max(2, slotW - 1);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height + 24}`} className="arc-svg">
      {data.map((d, i) => {
        const total = Number(d.total);
        const correct = Number(d.correct);
        const totalH = max > 0 ? (total / max) * height : 0;
        const correctH = max > 0 ? (correct / max) * height : 0;
        const x = i * slotW;
        return (
          <g key={i}>
            <rect x={x} y={height - totalH} width={barW} height={totalH} fill="#3498db" opacity={0.55} rx={1} />
            <rect x={x} y={height - correctH} width={barW} height={correctH} fill="#2ecc71" rx={1} />
          </g>
        );
      })}
      <text x={0} y={height + 18} fontSize={9} fill="#8b949e">{data[0]?.date}</text>
      <text x={W} y={height + 18} textAnchor="end" fontSize={9} fill="#8b949e">{data[data.length - 1]?.date}</text>
    </svg>
  );
}

function ResponseDepthChart({ overview }) {
  const fields = [
    { label: 'Q1', value: overview?.avg_q1_length },
    { label: 'Q3a', value: overview?.avg_q3a_length },
    { label: 'Q3b', value: overview?.avg_q3b_length },
    { label: 'Q3c', value: overview?.avg_q3c_length },
    { label: 'Q3✗', value: overview?.avg_q3_incorrect_length },
  ].filter(f => f.value != null && Number(f.value) > 0);

  if (fields.length === 0) return <div className="chart-empty">No data yet</div>;

  return <BarChart data={fields} valueKey="value" labelKey="label" color="#f39c12" height={130} />;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [submissionsOverTime, setSubmissionsOverTime] = useState(null);
  const [difficultyDist, setDifficultyDist] = useState(null);
  const [challengeFactors, setChallengeFactors] = useState(null);
  const [topTasks, setTopTasks] = useState(null);
  const [durationDist, setDurationDist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const base = config.API_URL;
      const [ov, sot, dd, cf, tt, dur] = await Promise.all([
        fetch(`${base}/api/analytics/overview`).then(r => r.json()),
        fetch(`${base}/api/analytics/submissions-over-time`).then(r => r.json()),
        fetch(`${base}/api/analytics/difficulty-distribution`).then(r => r.json()),
        fetch(`${base}/api/analytics/challenge-factors`).then(r => r.json()),
        fetch(`${base}/api/analytics/top-tasks`).then(r => r.json()),
        fetch(`${base}/api/analytics/duration-distribution`).then(r => r.json()),
      ]);
      setOverview(ov);
      setSubmissionsOverTime(sot);
      setDifficultyDist(dd);
      setChallengeFactors(cf);
      setTopTasks(tt);
      setDurationDist(dur);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const fmtTime = (s) => {
    if (s == null) return '—';
    const n = Number(s);
    if (n < 60) return `${n}s`;
    const m = Math.floor(n / 60);
    const sec = n % 60;
    return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
  };

  const difficultyLabels = { 1: 'Very Easy', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Very Hard' };

  if (loading) {
    return (
      <div className="dash-overlay">
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-overlay">
        <div className="dash-error">
          <h2>Failed to load analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAll} className="dash-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-overlay">
      <div className="dash-container">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Tessera-ARC Analytics</h1>
            <p className="dash-subtitle">Live research dashboard · Updated {lastUpdated}</p>
          </div>
          <div className="dash-header-actions">
            <button className="dash-btn" onClick={fetchAll}>↻ Refresh</button>
            <a href="/" className="dash-btn dash-btn--ghost">← Platform</a>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="dash-tabs">
          <button
            className={`dash-tab ${activeTab === 'overview' ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`dash-tab ${activeTab === 'explorer' ? 'dash-tab--active' : ''}`}
            onClick={() => setActiveTab('explorer')}
          >
            Task Explorer
          </button>
        </div>

        {/* Task Explorer tab */}
        {activeTab === 'explorer' && <TaskExplorer />}

        {/* Overview tab */}
        {activeTab === 'overview' && <><div className="stats-grid">
          <StatCard label="Total Submissions" value={overview?.total_submissions} />
          <StatCard label="Participants" value={overview?.total_participants} />
          <StatCard label="Tasks Attempted" value={overview?.unique_tasks_attempted} />
          <StatCard label="Overall Accuracy" value={overview?.accuracy_percent != null ? `${overview.accuracy_percent}%` : '—'} />
          <StatCard label="Avg Solve Time" value={fmtTime(overview?.avg_duration_seconds)} />
          <StatCard label="Avg Difficulty" value={overview?.avg_difficulty != null ? `${Number(overview.avg_difficulty).toFixed(1)} / 5` : '—'} />
          <StatCard label="Revised Hypothesis" value={overview?.pct_revised_hypothesis != null ? `${overview.pct_revised_hypothesis}%` : '—'} />
          <StatCard label="Correct / Incorrect" value={`${overview?.correct_count ?? 0} / ${overview?.incorrect_count ?? 0}`} />
        </div>

        {/* Row 1: timeline + donut */}
        <div className="charts-row">
          <div className="chart-card chart-card--wide">
            <h3 className="chart-title">
              Submissions Over Time
              <span className="chart-sub"> — last 90 days</span>
            </h3>
            <div className="chart-legend">
              <span className="leg-dot" style={{ background: '#3498db' }}></span>Total
              <span className="leg-dot" style={{ background: '#2ecc71', marginLeft: 12 }}></span>Correct
            </div>
            <TimelineChart data={submissionsOverTime} />
          </div>

          <div className="chart-card chart-card--narrow">
            <h3 className="chart-title">Correct vs Incorrect</h3>
            <div className="donut-wrap">
              <DonutChart
                correct={overview?.correct_count ?? 0}
                incorrect={overview?.incorrect_count ?? 0}
              />
              <div className="donut-legend">
                <div><span className="leg-dot" style={{ background: '#2ecc71' }}></span>Correct: {overview?.correct_count ?? 0}</div>
                <div><span className="leg-dot" style={{ background: '#e74c3c' }}></span>Incorrect: {overview?.incorrect_count ?? 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: difficulty + duration */}
        <div className="charts-row">
          <div className="chart-card">
            <h3 className="chart-title">Perceived Difficulty<span className="chart-sub"> — Q7 ratings</span></h3>
            <BarChart
              data={(difficultyDist || []).map(d => ({
                ...d,
                label: difficultyLabels[d.rating] || `Rating ${d.rating}`
              }))}
              valueKey="count"
              labelKey="label"
              color="#e67e22"
            />
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Solve Time Distribution</h3>
            <BarChart
              data={durationDist || []}
              valueKey="count"
              labelKey="bucket"
              color="#9b59b6"
            />
          </div>
        </div>

        {/* Row 3: challenge factors + response depth */}
        <div className="charts-row">
          <div className="chart-card chart-card--wide">
            <h3 className="chart-title">Challenge Factors<span className="chart-sub"> — Q8 checkboxes</span></h3>
            <HBarChart
              data={challengeFactors || []}
              valueKey="count"
              labelKey="factor"
              color="#16a085"
            />
          </div>

          <div className="chart-card chart-card--narrow">
            <h3 className="chart-title">Response Depth<span className="chart-sub"> — avg chars per question</span></h3>
            <ResponseDepthChart overview={overview} />
            <p className="chart-note">
              Q1 = initial hypothesis · Q3a/b/c = teaching questions (correct) · Q3✗ = what was tried (incorrect)
            </p>
          </div>
        </div>

        {/* Top tasks table */}
        <div className="chart-card">
          <h3 className="chart-title">Top 15 Most Attempted Tasks</h3>
          <div className="table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task ID</th>
                  <th>Attempts</th>
                  <th>Accuracy</th>
                  <th>Avg Time</th>
                  <th>Avg Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {(topTasks || []).map((task, i) => (
                  <tr key={task.task_id}>
                    <td className="td-rank">{i + 1}</td>
                    <td className="td-id">{task.task_id}</td>
                    <td>{task.attempt_count}</td>
                    <td>
                      <span className={`acc-badge ${Number(task.accuracy_percent) >= 50 ? 'acc-good' : 'acc-bad'}`}>
                        {task.accuracy_percent != null ? `${task.accuracy_percent}%` : '—'}
                      </span>
                    </td>
                    <td>{fmtTime(task.avg_duration_seconds)}</td>
                    <td>{task.avg_difficulty != null ? `${task.avg_difficulty} / 5` : '—'}</td>
                  </tr>
                ))}
                {(!topTasks || topTasks.length === 0) && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6e7681', padding: '1.5rem' }}>No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="dash-footer">
          <p>Tessera-ARC · Data collected at tessera-arc.org · Human reasoning dataset for ARC puzzle research</p>
          <p style={{ marginTop: '0.25rem' }}>
            Human accuracy: 76–85% · Best AI (2024): ~55% · This dataset captures <em>how</em> humans reason, not just whether they're correct
          </p>
        </div>
        </>}

      </div>
    </div>
  );
}
