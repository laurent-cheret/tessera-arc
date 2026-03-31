import React, { useState, useMemo } from 'react';
import './StateSpaceGraph.css';

const ATTEMPT_COLORS = ['#58a6ff', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c', '#fd7e14'];

function hammingFromStart(grid) {
  // Count non-zero cells — dimension-agnostic distance from blank start
  return grid.reduce((sum, row) => sum + row.reduce((s, c) => s + (c !== 0 ? 1 : 0), 0), 0);
}

function hammingFromGoal(grid, groundTruth) {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const gtRows = groundTruth.length;
  const gtCols = groundTruth[0]?.length || 0;

  if (rows !== gtRows || cols !== gtCols) {
    // Wrong dimensions: every cell in ground truth is wrong
    return gtRows * gtCols;
  }

  let diff = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== groundTruth[r][c]) diff++;
    }
  }
  return diff;
}

// Mini grid as SVG — used in tooltip
function MiniGridSVG({ grid, size = 48 }) {
  if (!grid || grid.length === 0) return null;
  const ARC_COLORS = {
    0: '#000', 1: '#0074D9', 2: '#FF4136', 3: '#2ECC40', 4: '#FFDC00',
    5: '#AAA', 6: '#F012BE', 7: '#FF851B', 8: '#7FDBFF', 9: '#870C25'
  };
  const rows = grid.length;
  const cols = grid[0]?.length || 1;
  const cell = Math.floor(size / Math.max(rows, cols));
  const w = cols * cell;
  const h = rows * cell;
  return (
    <svg width={w} height={h} style={{ display: 'block', border: '1px solid #30363d' }}>
      {grid.map((row, ri) =>
        row.map((v, ci) => (
          <rect key={`${ri}-${ci}`} x={ci * cell} y={ri * cell}
            width={cell} height={cell}
            fill={ARC_COLORS[v] ?? '#000'}
            stroke="#111" strokeWidth={cell > 6 ? 0.5 : 0}
          />
        ))
      )}
    </svg>
  );
}

export default function StateSpaceGraph({ attempts, groundTruth }) {
  const [hoveredAttempt, setHoveredAttempt] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, node, attemptIdx }

  const gtTotal = groundTruth
    ? groundTruth.length * (groundTruth[0]?.length || 0)
    : 0;

  // Compute node positions for every snapshot in every attempt
  const processedAttempts = useMemo(() => {
    if (!attempts || !groundTruth) return [];
    return attempts.map((attempt, ai) => {
      const nodes = attempt.path.map(snapshot => ({
        dx: hammingFromStart(snapshot.grid),      // x axis
        dy: hammingFromGoal(snapshot.grid, groundTruth), // y axis
        event: snapshot.event,
        result: snapshot.result || null,
        timestamp_ms: snapshot.timestamp_ms,
        grid: snapshot.grid,
      }));
      return {
        attempt_id: attempt.attempt_id,
        is_correct: attempt.is_correct,
        color: ATTEMPT_COLORS[ai % ATTEMPT_COLORS.length],
        nodes,
      };
    });
  }, [attempts, groundTruth]);

  // Axis ranges
  const { maxX, maxY } = useMemo(() => {
    let maxX = 1;
    let maxY = gtTotal || 1;
    processedAttempts.forEach(a =>
      a.nodes.forEach(n => {
        if (n.dx > maxX) maxX = n.dx;
        if (n.dy > maxY) maxY = n.dy;
      })
    );
    return { maxX, maxY };
  }, [processedAttempts, gtTotal]);

  // SVG layout
  const W = 620;
  const H = 380;
  const PAD = { top: 24, right: 24, bottom: 44, left: 44 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Data → SVG coords. Y=0 (goal) sits at the bottom of the plot.
  const toSVG = (dx, dy) => ({
    sx: PAD.left + (maxX > 0 ? (dx / maxX) * plotW : 0),
    sy: PAD.top  + (maxY > 0 ? ((maxY - dy) / maxY) * plotH : plotH),
  });

  // Axis tick helpers
  const xTicks = 5;
  const yTicks = 5;

  const handleNodeEnter = (e, node, attemptIdx) => {
    const rect = e.target.closest('svg').getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    // Flip to left side when cursor is in the right 40% of the container
    const flipLeft = relX > rect.width * 0.6;
    setTooltip({
      clientX: relX,
      clientY: relY,
      flipLeft,
      node,
      attemptIdx,
    });
    setHoveredAttempt(processedAttempts[attemptIdx]?.attempt_id);
  };

  const handleNodeLeave = () => {
    setTooltip(null);
    setHoveredAttempt(null);
  };

  const eventLabel = (node) => {
    switch (node.event) {
      case 'start': return 'Start';
      case 'edit': return 'Cell edit';
      case 'test_solution': return node.result === 'correct' ? 'Test ✓' : 'Test ✗';
      case 'reset': return 'Reset';
      case 'clear': return 'Clear';
      case 'resize': return 'Resize';
      case 'copy_from_input': return 'Copy Input';
      default: return node.event;
    }
  };

  // Detect shared states across attempts (same dx, dy)
  const sharedPositions = useMemo(() => {
    const pos = {};
    processedAttempts.forEach((a, ai) => {
      a.nodes.forEach(n => {
        const key = `${n.dx},${n.dy}`;
        if (!pos[key]) pos[key] = new Set();
        pos[key].add(ai);
      });
    });
    // Only return positions shared by 2+ attempts
    const shared = new Set();
    Object.entries(pos).forEach(([key, set]) => {
      if (set.size > 1) shared.add(key);
    });
    return shared;
  }, [processedAttempts]);

  if (processedAttempts.length === 0) return null;

  return (
    <div className="ssg-wrap">
      <div className="ssg-svg-container">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="ssg-svg">

          {/* Grid lines */}
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const dy = (maxY / yTicks) * i;
            const { sy } = toSVG(0, dy);
            return (
              <g key={`yg-${i}`}>
                <line x1={PAD.left} y1={sy} x2={PAD.left + plotW} y2={sy}
                  stroke="#21262d" strokeWidth={1} />
                <text x={PAD.left - 5} y={sy + 3} textAnchor="end" fontSize={9} fill="#6e7681">
                  {Math.round(dy)}
                </text>
              </g>
            );
          })}
          {Array.from({ length: xTicks + 1 }, (_, i) => {
            const dx = (maxX / xTicks) * i;
            const { sx } = toSVG(dx, 0);
            return (
              <g key={`xg-${i}`}>
                <line x1={sx} y1={PAD.top} x2={sx} y2={PAD.top + plotH}
                  stroke="#21262d" strokeWidth={1} />
                <text x={sx} y={PAD.top + plotH + 14} textAnchor="middle" fontSize={9} fill="#6e7681">
                  {Math.round(dx)}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH}
            stroke="#30363d" strokeWidth={1.5} />
          <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH}
            stroke="#30363d" strokeWidth={1.5} />

          {/* Goal zone — y=0 line at bottom */}
          <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH}
            stroke="#2ecc71" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.5} />
          <text x={PAD.left + plotW - 2} y={PAD.top + plotH - 5}
            textAnchor="end" fontSize={9} fill="#2ecc71" opacity={0.8}>
            ← correct answer
          </text>

          {/* Axis labels */}
          <text x={PAD.left + plotW / 2} y={H - 4}
            textAnchor="middle" fontSize={10} fill="#8b949e">
            Cells changed from start
          </text>
          <text
            x={12} y={PAD.top + plotH / 2}
            textAnchor="middle" fontSize={10} fill="#8b949e"
            transform={`rotate(-90, 12, ${PAD.top + plotH / 2})`}
          >
            Cells wrong (distance to goal)
          </text>

          {/* Shared state halos — render first so they appear behind paths */}
          {processedAttempts[0]?.nodes.map((_, ni) =>
            processedAttempts.map((attempt, ai) => {
              const node = attempt.nodes[ni];
              if (!node) return null;
              const key = `${node.dx},${node.dy}`;
              if (!sharedPositions.has(key)) return null;
              const { sx, sy } = toSVG(node.dx, node.dy);
              return (
                <circle key={`halo-${ai}-${ni}`}
                  cx={sx} cy={sy} r={12}
                  fill="#f39c12" opacity={0.12}
                />
              );
            })
          )}

          {/* Paths and nodes */}
          {processedAttempts.map((attempt, ai) => {
            const isHovered = hoveredAttempt === attempt.attempt_id;
            const isDimmed  = hoveredAttempt !== null && !isHovered;
            const pathOpacity = isDimmed ? 0.15 : 1;
            const strokeW = isHovered ? 2.5 : 1.5;

            return (
              <g key={attempt.attempt_id} opacity={pathOpacity} style={{ transition: 'opacity 0.15s' }}>
                {/* Edges */}
                {attempt.nodes.slice(0, -1).map((node, ni) => {
                  const next = attempt.nodes[ni + 1];
                  const { sx: x1, sy: y1 } = toSVG(node.dx, node.dy);
                  const { sx: x2, sy: y2 } = toSVG(next.dx, next.dy);
                  return (
                    <line key={`e-${ni}`}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={attempt.color}
                      strokeWidth={strokeW}
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredAttempt(attempt.attempt_id)}
                      onMouseLeave={() => setHoveredAttempt(null)}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}

                {/* Arrow heads on last edge */}
                {attempt.nodes.length >= 2 && (() => {
                  const last = attempt.nodes[attempt.nodes.length - 1];
                  const prev = attempt.nodes[attempt.nodes.length - 2];
                  const { sx: x2, sy: y2 } = toSVG(last.dx, last.dy);
                  const { sx: x1, sy: y1 } = toSVG(prev.dx, prev.dy);
                  const angle = Math.atan2(y2 - y1, x2 - x1);
                  const size = 7;
                  const ax = x2 - size * Math.cos(angle - 0.4);
                  const ay = y2 - size * Math.sin(angle - 0.4);
                  const bx = x2 - size * Math.cos(angle + 0.4);
                  const by = y2 - size * Math.sin(angle + 0.4);
                  return (
                    <polygon points={`${x2},${y2} ${ax},${ay} ${bx},${by}`}
                      fill={attempt.color} opacity={0.8} />
                  );
                })()}

                {/* Nodes */}
                {attempt.nodes.map((node, ni) => {
                  const { sx, sy } = toSVG(node.dx, node.dy);
                  const isTest  = node.event === 'test_solution';
                  const isStart = node.event === 'start';
                  const isReset = node.event === 'reset' || node.event === 'clear';
                  const isEdit  = node.event === 'edit';
                  const r = isTest ? 7 : isReset ? 6 : isStart ? 5 : isEdit ? 3 : 4;
                  const fill = isTest
                    ? (node.result === 'correct' ? '#2ecc71' : '#e74c3c')
                    : isReset ? '#e67e22'
                    : isEdit  ? attempt.color
                    : attempt.color;
                  const opacity = isEdit ? 0.55 : 1;

                  return (
                    <circle key={`n-${ni}`}
                      cx={sx} cy={sy} r={r}
                      fill={fill}
                      opacity={opacity}
                      stroke="#0d1117" strokeWidth={isEdit ? 0.5 : 1.5}
                      onMouseEnter={e => handleNodeEnter(e, node, ai)}
                      onMouseLeave={handleNodeLeave}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Start label */}
          {(() => {
            const { sx, sy } = toSVG(0, maxY);
            return (
              <text x={sx + 7} y={sy - 5} fontSize={9} fill="#8b949e">start</text>
            );
          })()}

        </svg>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            className="ssg-tooltip"
            style={tooltip.flipLeft
              ? { right: `calc(100% - ${tooltip.clientX - 14}px)`, top: tooltip.clientY - 10 }
              : { left: tooltip.clientX + 14, top: tooltip.clientY - 10 }
            }
          >
            <div className="ssg-tt-header">
              <span className="ssg-tt-dot"
                style={{ background: processedAttempts[tooltip.attemptIdx]?.color }} />
              Participant {tooltip.attemptIdx + 1} — {eventLabel(tooltip.node)}
            </div>
            <div className="ssg-tt-coords">
              Changed: {tooltip.node.dx} cells · Wrong: {tooltip.node.dy} cells
            </div>
            <MiniGridSVG grid={tooltip.node.grid} size={56} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="ssg-legend">
        <div className="ssg-legend-attempts">
          {processedAttempts.map((attempt, ai) => (
            <div key={attempt.attempt_id}
              className={`ssg-legend-item ${hoveredAttempt === attempt.attempt_id ? 'ssg-legend-active' : ''}`}
              onMouseEnter={() => setHoveredAttempt(attempt.attempt_id)}
              onMouseLeave={() => setHoveredAttempt(null)}
              style={{ cursor: 'pointer' }}
            >
              <span className="ssg-legend-line" style={{ background: attempt.color }} />
              Participant {ai + 1} — {attempt.is_correct ? '✓ correct' : '✗ incorrect'}
            </div>
          ))}
        </div>
        <div className="ssg-legend-nodes">
          <span className="ssg-node-dot" style={{ background: '#2ecc71' }} /> Test ✓
          <span className="ssg-node-dot" style={{ background: '#e74c3c', marginLeft: 10 }} /> Test ✗
          <span className="ssg-node-dot" style={{ background: '#e67e22', marginLeft: 10 }} /> Reset/Clear
          {sharedPositions.size > 0 && (
            <span style={{ marginLeft: 10, color: '#f39c12', fontSize: '0.78rem' }}>
              ● Shared state
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
