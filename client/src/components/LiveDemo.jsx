import React, { useState, useEffect, useRef } from 'react';
import './LiveDemo.css';

const ARC_COLORS = {
  0: '#000000', 1: '#0074D9', 2: '#FF4136', 3: '#2ECC40', 4: '#FFDC00',
  5: '#AAAAAA', 6: '#F012BE', 7: '#FF851B', 8: '#7FDBFF', 9: '#870C25'
};

function DemoGrid({ grid, maxPx = 140, highlight = false }) {
  if (!grid || grid.length === 0) return null;
  const rows = grid.length;
  const cols = grid[0]?.length || 0;
  const cell = Math.max(4, Math.floor(Math.min(maxPx / rows, maxPx / cols)));
  return (
    <svg
      width={cols * cell}
      height={rows * cell}
      style={{
        display: 'block',
        border: highlight ? '2px solid #3fb950' : '1px solid #30363d',
        borderRadius: 3,
        flexShrink: 0,
      }}
    >
      {grid.map((row, ri) =>
        row.map((c, ci) => (
          <rect
            key={`${ri}-${ci}`}
            x={ci * cell} y={ri * cell}
            width={cell} height={cell}
            fill={ARC_COLORS[c] ?? '#000'}
            stroke="#111" strokeWidth={0.4}
          />
        ))
      )}
    </svg>
  );
}

function Cursor() {
  return <span className="demo-cursor">|</span>;
}

export default function LiveDemo({ demo, onCycleEnd }) {
  const [phase, setPhase] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Phase 1
  const [q1Text, setQ1Text] = useState('');

  // Phase 2
  const [frameIdx, setFrameIdx] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  // Phase 3 — track per-sentence state
  // p3Idx: which sentence is currently being typed
  // p3Text: the partial text being typed for the active sentence
  // p3Texts: committed full text for each sentence once done
  const [p3Idx, setP3Idx] = useState(0);
  const [p3Text, setP3Text] = useState('');
  const [p3Texts, setP3Texts] = useState(['', '', '']);

  const timer = useRef(null);
  const clear = () => clearTimeout(timer.current);

  const goTo = (next) => {
    clear();
    setFadeIn(false);
    timer.current = setTimeout(() => {
      setPhase(next % 3);
      setFadeIn(true);
    }, 350);
  };

  useEffect(() => {
    if (!demo) return;
    clear();

    if (phase === 0) {
      setQ1Text('');
      const text = demo.q1 || '';
      let i = 0;
      const type = () => {
        if (i <= text.length) {
          setQ1Text(text.slice(0, i++));
          timer.current = setTimeout(type, 32);
        } else {
          timer.current = setTimeout(() => goTo(1), 2500);
        }
      };
      // Start typing immediately so pairs and text appear together
      timer.current = setTimeout(type, 300);
    }

    if (phase === 1) {
      setFrameIdx(0);
      setCelebrating(false);
      const frames = demo.frames || [];
      let i = 0;
      const step = () => {
        if (i < frames.length) {
          setFrameIdx(i++);
          timer.current = setTimeout(step, 75);
        } else {
          setCelebrating(true);
          // Stay on the grid + overlay for 2.2s then move on
          timer.current = setTimeout(() => goTo(2), 2200);
        }
      };
      timer.current = setTimeout(step, 300);
    }

    if (phase === 2) {
      setP3Idx(0);
      setP3Text('');
      setP3Texts(['', '', '']);
      const sentences = [demo.q3a || '', demo.q3b || '', demo.q3c || ''];

      const typeSentence = (si, ci) => {
        if (si >= sentences.length) {
          // All done — mark all rows as committed, hold 2.5s then fetch new demo + loop
          setP3Idx(sentences.length);
          timer.current = setTimeout(() => {
            if (onCycleEnd) onCycleEnd();
            goTo(0);
          }, 2500);
          return;
        }
        setP3Idx(si);
        const text = sentences[si];
        if (ci <= text.length) {
          setP3Text(text.slice(0, ci));
          timer.current = setTimeout(() => typeSentence(si, ci + 1), 28);
        } else {
          // Sentence finished — commit it and move to next WITHOUT clearing
          setP3Texts(prev => {
            const next = [...prev];
            next[si] = text;
            return next;
          });
          timer.current = setTimeout(() => {
            setP3Text('');
            typeSentence(si + 1, 0);
          }, 1200);
        }
      };
      timer.current = setTimeout(() => typeSentence(0, 0), 400);
    }

    return clear;
  }, [phase, demo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!demo) return null;

  const frames = demo.frames || [];
  const currentGrid = frames[Math.min(frameIdx, frames.length - 1)];
  const trainingInputs = demo.training_inputs || [];
  const trainingOutputs = demo.training_outputs || [];
  const sentences = [
    { label: 'What to look for', text: demo.q3a },
    { label: 'How to transform', text: demo.q3b },
    { label: 'How to verify',    text: demo.q3c },
  ];

  return (
    <div className="live-demo">
      {/* Step pills */}
      <div className="live-demo-steps">
        {['Observe', 'Solve', 'Instruct'].map((label, i) => (
          <React.Fragment key={i}>
            <div className={`live-demo-step-pill ${i === phase ? 'pill-active' : i < phase ? 'pill-done' : ''}`}>
              <span className="pill-num">{i + 1}</span>
              <span className="pill-label">{label}</span>
            </div>
            {i < 2 && <div className={`live-demo-step-line ${i < phase ? 'line-done' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className={`live-demo-body ${fadeIn ? 'demo-fade-in' : 'demo-fade-out'}`}>

        {/* ── Phase 1: Observe ── */}
        {phase === 0 && (
          <div className="demo-phase">
            <div className="demo-pairs-row">
              {trainingInputs.slice(0, 3).map((inp, i) => (
                <div key={i} className="demo-pair">
                  <DemoGrid grid={inp} maxPx={90} />
                  <span className="demo-arrow">→</span>
                  <DemoGrid grid={trainingOutputs[i]} maxPx={90} highlight />
                </div>
              ))}
            </div>
            <div className="demo-quote-line">
              <span className="demo-qmark">"</span>
              <span className="demo-typed">{q1Text}</span>
              <Cursor />
              <span className="demo-qmark">"</span>
            </div>
            <div className="demo-attribution">— real participant's first impression</div>
          </div>
        )}

        {/* ── Phase 2: Solve ── */}
        {phase === 1 && (
          <div className="demo-phase">
            {/* Grid always visible */}
            <div className="demo-solve-row">
              <div className="demo-grid-labeled">
                <div className="demo-grid-sublabel">Test input</div>
                <DemoGrid grid={demo.task_input} maxPx={150} />
              </div>
              <span className="demo-arrow demo-arrow-lg">→</span>
              <div className="demo-grid-labeled">
                <div className="demo-grid-sublabel">{celebrating ? 'Solved ✓' : 'Solving…'}</div>
                <div className="demo-solve-output-wrap">
                  <DemoGrid grid={currentGrid} maxPx={150} highlight={celebrating} />
                  {celebrating && (
                    <div className="demo-celebrate-overlay">
                      <div className="demo-celebrate-icon">🎉</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {celebrating && (
              <div className="demo-celebrate-text">Correct solution!</div>
            )}
          </div>
        )}

        {/* ── Phase 3: Instruct ── */}
        {phase === 2 && (
          <div className="demo-phase">
            <div className="demo-teach-rows">
              {sentences.map((s, i) => {
                const isDone = i < p3Idx;
                const isActive = i === p3Idx;
                const isPending = i > p3Idx;
                // Show committed text if done, partial if active, nbsp if pending
                const display = isDone ? p3Texts[i] : isActive ? p3Text : '\u00a0';
                return (
                  <div
                    key={i}
                    className={`demo-teach-row ${isDone ? 'teach-done' : ''} ${isActive ? 'teach-active' : ''} ${isPending ? 'teach-pending' : ''}`}
                  >
                    <span className="demo-teach-label">{s.label}</span>
                    <span className="demo-teach-text">
                      {display}
                      {isActive && <Cursor />}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="demo-attribution demo-attribution-correct">
              — real participant · correct solution ✓
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
