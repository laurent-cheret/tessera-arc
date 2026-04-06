import React, { useState, useEffect, useRef, useCallback } from 'react';
import MiniARCExample from './MiniARCExample';
import TypewriterAnimation from './TypewriterAnimation';
import PaintingGridAnimation from './PaintingGridAnimation';
import config from '../config';
import './LandingPage.css';

// ARC color palette (colors 0-9, skip black so cells are visible on dark bg)
const ARC_COLORS = [
  '#0074D9', '#FF4136', '#2ECC40', '#FFDC00',
  '#AAAAAA', '#F012BE', '#FF851B', '#7FDBFF', '#870C25'
];

function FallingCells() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const cellsRef = useRef([]);

  const makeCell = useCallback((canvasWidth, canvasHeight, fromTop = false) => {
    const size = Math.floor(Math.random() * 14) + 6; // 6–20 px
    return {
      x: Math.random() * canvasWidth,
      y: fromTop ? -size - Math.random() * canvasHeight : Math.random() * canvasHeight,
      size,
      color: ARC_COLORS[Math.floor(Math.random() * ARC_COLORS.length)],
      speed: Math.random() * 0.6 + 0.2,       // 0.2–0.8 px/frame
      drift: (Math.random() - 0.5) * 0.3,     // slight horizontal wobble
      alpha: Math.random() * 0.35 + 0.08,     // 0.08–0.43 opacity — subtle
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COUNT = 55;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed cells spread across full height
    cellsRef.current = Array.from({ length: COUNT }, () =>
      makeCell(canvas.width, canvas.height, false)
    );

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (const c of cellsRef.current) {
        ctx.save();
        ctx.globalAlpha = c.alpha;
        ctx.translate(c.x + c.size / 2, c.y + c.size / 2);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();

        c.y += c.speed;
        c.x += c.drift;
        c.rotation += c.rotSpeed;

        // Reset when off the bottom
        if (c.y > height + c.size) {
          Object.assign(c, makeCell(width, height, true));
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [makeCell]);

  return <canvas ref={canvasRef} className="falling-cells-canvas" />;
}

const LandingPage = ({ onStartParticipation }) => {
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [arcStats, setArcStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);

  useEffect(() => {
    fetch(`${config.API_URL}/api/arc-live-stats`)
      .then(r => r.json())
      .then(setArcStats)
      .catch(() => {});
    fetch(`${config.API_URL}/api/analytics/overview`)
      .then(r => r.json())
      .then(setPlatformStats)
      .catch(() => {});
  }, []);

  // Phrases for observe phase
  const observePhrases = [
    "I think the blue rectangles are moving right...",
    "I see objects being colored based on their size...",
    "The pattern is being extended to the right...",
    "It looks like shapes are rotating clockwise...",
    "All red cells seem to become blue while the...",
  ];

  // Phrases for TEACHING phase (updated)
  const teachPhrases = [
    "Look for the three blue rectangles in the top-left corner...",
    "Take each shape and rotate it 90 degrees clockwise...",
    "You should end up with all shapes touching each other...",
    "First, identify which objects are touching the border...",
    "The final output should have the same grid size as the input...",
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <FallingCells />
        <div className="hero-content">
          <div className="logo-container">
            <img src="/logo192.png" alt="Tessera Logo" className="hero-logo" />
          </div>
          <h1 className="project-title">Tessera-ARC</h1>
          <p className="tagline">Capturing human intelligence one piece at a time.</p>
          <div className="hero-links">
            <a href="https://github.com/laurent-cheret/tessera-arc" target="_blank" rel="noopener noreferrer" className="hero-link">
              <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
            <a href="https://x.com/TesseraARC" target="_blank" rel="noopener noreferrer" className="hero-link">
              <svg height="16" width="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Follow
            </a>
            <a href="#/dashboard" className="hero-link">
              <svg height="16" width="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Platform Stats Strip */}
      {platformStats && (
        <div className="stats-strip">
          <div className="stats-strip-inner">
            <div className="stats-strip-item">
              <span className="stats-strip-num">{Number(platformStats.total_submissions).toLocaleString()}</span>
              <span className="stats-strip-label">puzzles submitted</span>
            </div>
            <div className="stats-strip-divider" />
            <div className="stats-strip-item">
              <span className="stats-strip-num">{Number(platformStats.total_participants).toLocaleString()}</span>
              <span className="stats-strip-label">participants</span>
            </div>
            <div className="stats-strip-divider" />
            <div className="stats-strip-item">
              <span className="stats-strip-num">{Number(platformStats.unique_tasks_attempted).toLocaleString()}</span>
              <span className="stats-strip-label">tasks explored</span>
            </div>
            <div className="stats-strip-divider" />
            <div className="stats-strip-item">
              <span className="stats-strip-num">{Math.round(Number(platformStats.avg_duration_seconds))}s</span>
              <span className="stats-strip-label">avg. time per puzzle</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="content-section">
        
        {/* Introduction Section */}
        <div className="content-card challenge-card">
          <div className="challenge-layout">
            <div className="challenge-text">
              <h2>The ARC-AGI Challenge</h2>
              <p className="large-text">
                The <a href="https://arcprize.org/" target="_blank" rel="noopener noreferrer"><strong>Abstraction and Reasoning Corpus</strong></a> is AI's most stubborn benchmark. Despite years of effort, no AI has crossed the 85% threshold needed to claim the bonus prize on ARC-AGI-2 — and in March 2026, the challenge escalated further with the launch of <strong>ARC-AGI-3</strong>, where frontier models currently score <strong>0.26%</strong> against humans at 100%.
              </p>
              <p className="large-text">
                After just one "incorrect" signal, humans improve their accuracy by <strong>+25.9 points</strong>. The best AI systems cost $14–17 per puzzle to match human scores, yet GPT-4o only gains <strong>+9.1%</strong> from the same feedback. Something fundamental about how humans think is still missing from AI — and your participation helps us capture it.
              </p>
              <button
                onClick={() => setShowResearchModal(true)}
                className="read-more-button"
              >
                Read the Full Research Story
                <span className="arrow">↗</span>
              </button>
            </div>
            <div className="challenge-stats">
              <div className="stat-comparison">
                <div className="stat-label-row">
                  <span className="stat-label">
                    {arcStats ? arcStats.benchmark : 'ARC-AGI-2'} scores
                  </span>
                  {arcStats?.fetchedAt && (
                    <span className="stat-live-badge">● Live</span>
                  )}
                </div>
                <div className="stat-row">
                  <span className="stat-who human-label">Humans</span>
                  <div className="stat-bar-wrap">
                    <div className="stat-bar human-bar"
                      style={{ width: `${arcStats ? arcStats.humanScore : 100}%` }} />
                  </div>
                  <span className="stat-num human-num">{arcStats ? arcStats.humanScore : 100}%</span>
                  <span className="stat-cost human-cost">~$17/task</span>
                </div>
                {arcStats ? arcStats.topAI.slice(0, 3).map((ai, i) => (
                  <div className="stat-row" key={i}>
                    <span className="stat-who ai-label" title={ai.name}>
                      {ai.name.length > 12 ? ai.name.slice(0, 12) + '…' : ai.name}
                    </span>
                    <div className="stat-bar-wrap">
                      <div className="stat-bar ai-bar" style={{ width: `${ai.score}%` }} />
                    </div>
                    <span className="stat-num ai-num">{ai.score}%</span>
                    <span className="stat-cost ai-cost">${ai.costPerTask < 1 ? ai.costPerTask.toFixed(2) : Math.round(ai.costPerTask)}/task</span>
                  </div>
                )) : (
                  <div className="stat-row">
                    <span className="stat-who ai-label">Best AI</span>
                    <div className="stat-bar-wrap">
                      <div className="stat-bar ai-bar" style={{ width: '84%' }} />
                    </div>
                    <span className="stat-num ai-num">84%</span>
                    <span className="stat-cost ai-cost">$14/task</span>
                  </div>
                )}
                <div className="stat-footnote">
                  arcprize.org · updated live
                  {arcStats?.fetchedAt && (
                    <> · {new Date(arcStats.fetchedAt).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              <div className="stat-callout">
                <div className="stat-callout-num">97 sec</div>
                <div className="stat-callout-label">Average time for a human to solve a puzzle</div>
              </div>
            </div>
          </div>
        </div>

        {/* How You Can Contribute - UPDATED */}
        <div className="content-card highlight">
          <h2>📝 How You Can Contribute</h2>
          <div className="steps-grid-animated">
            
            {/* Step 1: Observe */}
            <div className="step-animated">
              <span className="step-number">1</span>
              <div className="step-content">
                <h3>🔍 Observe</h3>
                <p>Look at the example transformations and form your initial hypothesis about the pattern</p>
                <TypewriterAnimation 
                  phrases={observePhrases}
                  speed={50}
                  pauseDuration={2000}
                  isItalic={true}
                />
              </div>
            </div>

            {/* Step 2: Solve */}
            <div className="step-animated">
              <span className="step-number">2</span>
              <div className="step-content">
                <h3>🎨 Solve</h3>
                <p>Create your solution by clicking and coloring cells one by one</p>
                <PaintingGridAnimation />
              </div>
            </div>

            {/* Step 3: Teach - UPDATED */}
            <div className="step-animated">
              <span className="step-number">3</span>
              <div className="step-content">
                <h3>👨‍🏫 Instruct</h3>
                <p>Imagine instructing a friend who can only see the test input—guide them step-by-step to produce your exact solution</p>
                <TypewriterAnimation 
                  phrases={teachPhrases}
                  speed={50}
                  pauseDuration={2000}
                  isItalic={true}
                />
              </div>
            </div>

          </div>

          {/* Teaching Explanation Box */}
          <div className="instruction-rationale">
            <h4>
              <span>💡</span>
              Why the Instructing Approach?
            </h4>
            <p>
              The L-ARC study showed that when humans instruct each other how to solve ARC tasks, they naturally provide three essential components: <strong>framing</strong> (what to look for), <strong>procedure</strong> (how to transform), and <strong>validation</strong> (how to verify). This structured approach achieved 88% communication success.
            </p>
            <p>
              By asking you to teach rather than just describe, we capture the rich contextual information and verification strategies that make human reasoning so robust—the same information current AI systems are missing.
            </p>
          </div>

          <div className="time-commitment">
            <span className="time-icon">⏱️</span>
            <div>
              <strong>Time commitment:</strong> 5-10 minutes per puzzle<br />
              <span className="subtext">Solve as many or as few as you like!</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <p className="cta-eyebrow">5–10 minutes · Anonymous · Free</p>
          <h2>Your reasoning matters to science.</h2>
          <p className="cta-sub">Each puzzle you solve adds a piece to our understanding of human intelligence — the piece AI is still missing.</p>
          <button
            className="start-button"
            onClick={onStartParticipation}
          >
            Start Solving Puzzles →
          </button>
          <div className="privacy-badge">
            <span className="badge-icon">🔒</span>
            <div className="badge-text">
              <strong>Anonymous participation</strong> · No account needed · Open research
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="content-card footer-info">
          <h3>About This Research</h3>
          <h4>The Philosophy Behind Tessera-ARC</h4>
          <p>
            In order to build machines that succeed at feats of human intelligence, there's potentially value in the whole process—not just the final answer, but how we get there.
          </p>

          <div className="info-block">
            <h4>Abstraction: The Power of Multiple Perspectives</h4>
            <p style={{ marginBottom: 0 }}>
              When different humans look at the same ARC puzzle, they see different things. One person might see "a maze with a start point and endpoint." Another might see "a line passing through obstacles." Someone else might interpret it as "streets with a path being carved." This diversity of interpretation isn't noise—it's fundamental. By collecting these varied perspectives, we're building a more complete picture of how humans perform abstraction.
            </p>
          </div>

          <div className="info-block">
            <h4>Communication: Beyond Pure Procedures</h4>
            <p>
              Research shows that successful human-to-human communication about ARC tasks requires much more than just describing the transformation steps. The <a href="https://arxiv.org/abs/2106.07824" target="_blank" rel="noopener noreferrer">L-ARC study</a> revealed that approximately two-thirds of effective instructions consist of framing (setting context) and validation (providing checks)—not just the procedure itself.
            </p>
            <p style={{ marginBottom: 0 }}>
              This is why we ask you to <strong>instruct</strong>. Teaching naturally elicits the complete cognitive framework: what to focus on, how to transform it, and how to verify correctness.
            </p>
          </div>

          <p>
            <strong>Tessera-ARC isn't a solution to the ARC competition itself.</strong> Instead, it's a tool—a dataset that captures the rich diversity of human problem-solving paths, including the crucial meta-information (framing and validation) that AI systems currently miss.
          </p>

          <div className="dataset-status">
            <strong>📊 Dataset Status:</strong> We are currently in the initial development phase of this dataset. Once we gather a significant number of submissions for each task, we will begin sharing the data publicly with the research community.
          </div>

          <p className="research-citation">
            Based on François Chollet's <em>On the Measure of Intelligence</em> (2019)<br />
            <a href="https://arxiv.org/abs/1911.01547" target="_blank" rel="noopener noreferrer">
              arXiv:1911.01547
            </a>
          </p>
        </div>

        {/* About Us Section */}
        <div className="content-card">
          <h2>About Us</h2>
          <p className="large-text">
            My name is <strong>Laurent Cheret</strong>, and I'm a PhD candidate at the University of Ottawa, supervised by Professors <a href="https://frasermaia.github.io/" target="_blank" rel="noopener noreferrer">Maia Fraser</a> and <a href="https://www.uottawa.ca/faculty-engineering/school-electrical-engineering-computer-science/directory/hussein-al-osman" target="_blank" rel="noopener noreferrer">Hussein Al Osman</a>. My research explores the intersection of deep learning, generative models, and the integration of geometrical and topological knowledge into AI systems.
          </p>

          {/* Contact Section */}
          <div className="contact-box">
            <h3>Get in Touch</h3>
            <p>Interested in collaborating, contributing, or learning more about the project?</p>
            <div style={{ position: 'relative' }}>
              <button
                className="contact-btn"
                onClick={() => {
                  navigator.clipboard.writeText('tesseraarc@gmail.com');
                  setEmailCopied(true);
                  setTimeout(() => setEmailCopied(false), 2000);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                tesseraarc@gmail.com
              </button>
              {emailCopied && <span className="copy-toast">Copied!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Start Button */}
      <button className="sticky-cta" onClick={onStartParticipation}>
        Start Solving →
      </button>

      {/* Research Modal */}
      {showResearchModal && (
        <div className="research-modal-overlay" onClick={() => setShowResearchModal(false)}>
          <div className="research-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>The Full Research Story</h2>
              <button className="modal-close" onClick={() => setShowResearchModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              <div className="arc-status-2026">
                <h3>Where We Stand in 2026</h3>
                <p>
                  The ARC prize landscape has changed significantly since this project launched. Here is the current picture:
                </p>

                <div className="status-grid">
                  <div className="status-block status-v2">
                    <div className="status-block-title">ARC-AGI-2 (Kaggle 2026)</div>
                    <ul>
                      <li>Best AI approaches <strong>~84%</strong> on the public set — but the 85% bonus prize threshold (<strong>$150,000–$200,000</strong>) remains unclaimed on the private hidden set.</li>
                      <li>A <strong>guaranteed $500,000</strong> top-score award will be paid at the end of December 2026 to the #1 team, even without hitting 85%.</li>
                      <li>Models that over-fit to the public set consistently drop in score on the hidden evaluation — the "last mile" problem persists.</li>
                    </ul>
                  </div>
                  <div className="status-block status-v3">
                    <div className="status-block-title">ARC-AGI-3 (Launched March 25, 2026)</div>
                    <ul>
                      <li>A fundamentally new format: <strong>no instructions, no examples</strong>. AI agents must explore an interactive environment and infer the rules from scratch.</li>
                      <li>Frontier models (the ones topping every other benchmark) currently score <strong>0.26%</strong>. Humans score <strong>100%</strong>.</li>
                      <li>Total prize pool across all tracks is now over <strong>$2,000,000</strong>.</li>
                    </ul>
                  </div>
                </div>

                <p className="status-footer">
                  The four weaknesses described below still explain why V2 is stuck at its wall — and they become even more acute in V3, where compositional reasoning must happen without any demonstration at all.
                </p>
              </div>

              <h3>What is ARC-AGI?</h3>
              <p>
                The Abstraction and Reasoning Corpus presents simple visual puzzles: colored grids that transform according to hidden rules. You see 2-3 examples of input-output pairs, then must discover the rule and apply it to a new test case. These puzzles test core knowledge—concepts like symmetry, counting, containment, and pathfinding—without requiring specialized expertise.
              </p>

              <MiniARCExample />

              <p>
                The <a href="https://arxiv.org/abs/2409.01374" target="_blank" rel="noopener noreferrer">H-ARC study</a> tested over 1,700 people and found that <strong>790 out of 800 tasks (98.8%)</strong> were solvable by at least one person within three attempts, confirming these are genuine intelligence tests, not trick questions.
              </p>
              <p>
                The benchmark was specifically designed to resist the "scaling" approach that dominates modern AI. Early pure deep learning systems scored below 1% in the 2020 Kaggle competition. Even GPT-3 with direct prompting scored 0%. By the intense <a href="https://arxiv.org/abs/2412.04604" target="_blank" rel="noopener noreferrer">2024 ARC Prize competition</a>, the frontier reached 55.5% — and by 2026 the best systems are approaching ~84%. Yet the 85% bonus prize threshold remains unclaimed, and the gap on ARC-AGI-3 has reset back to near zero.
              </p>

              <h3>Why AI Struggles: Four Fundamental Weaknesses</h3>

              <div className="weakness-box weakness-1">
                <h4>1. The Forced Split: Symbolic vs. Perceptual</h4>
                <p>The best AI systems cannot commit to one way of reasoning. They split into two incompatible modes:</p>
                <ul>
                  <li><strong>Induction</strong> (symbolic/code-based): Tries to write explicit Python programs. Excels at precise operations like "count all the blue squares, then double that number, and then make a new row of yellow squares equal to that doubled count."</li>
                  <li><strong>Transduction</strong> (neural/fuzzy): Skips explicit rules and directly predicts the output. Better at perceptual tasks like recognizing implied rotations or judging whether an object is "more vertical than horizontal."</li>
                </ul>
                <p>Top systems must run both approaches separately and ensemble their results—a computational crutch proving neither method alone is robust enough. Humans don't make this conscious choice; we seamlessly integrate symbolic and visual reasoning.</p>
              </div>

              <div className="weakness-box weakness-2">
                <h4>2. The Conceptual Ceiling</h4>
                <p>State-of-the-art systems are trained on up to <strong>400,000 synthetic ARC-like problems</strong>. Yet these all derive from just <strong>100-160 human-written "seed" programs</strong>—basic concepts manually coded by <a href="https://arxiv.org/abs/2411.02272" target="_blank" rel="noopener noreferrer">researchers</a> like "move the largest object down" or "change color to blue."</p>
                <p>The AI becomes a brilliant remix artist using techniques like RAG (retrieval-augmented generation), combining concepts but unable to invent genuinely new ones. No amount of computational remixing can teach the AI about "yellow" if it was only given "red" and "blue" to start with.</p>
              </div>

              <div className="weakness-box weakness-3">
                <h4>3. Computational Inefficiency at Every Stage</h4>
                <p><strong>Program search inefficiency:</strong> Systems like <a href="https://redwoodresearch.substack.com/p/getting-50-sota-on-arc-agi-with-gpt" target="_blank" rel="noopener noreferrer">Ryan Greenblatt's approach</a> sample upwards of 20,000 candidate Python programs per task. Roughly 9% are "false positives"—programs that perfectly fit training examples but fail catastrophically on test cases.</p>
                <p><strong>Test-time training:</strong> Transduction systems temporarily update their own parameters for each problem using LoRA adapters, boosting accuracy from 18% to over 50% but requiring problem-specific retraining every single time.</p>
                <p>Humans solve these puzzles in approximately 97 seconds on average using minimal mental effort. The efficiency gap is staggering.</p>
              </div>

              <div className="weakness-box weakness-4">
                <h4>4. The Difficulty Inversion</h4>
                <p>AI performance curves are nearly perfectly inverted from human performance. AI actually <em>surpasses</em> humans on the hardest 20% of official ARC problems—complex, multi-step transformations that are perceptually confusing but can be expressed as concise deterministic code.</p>
                <p>Meanwhile, AI severely underperforms on tasks humans find trivially easy—simple pattern completions solved with a glance. If an AI must spin up massive program search and hierarchical voting just to solve a basic visual pattern that humans get in three seconds, something fundamental about efficient reasoning is missing.</p>
              </div>

              <h3>The Self-Correction Mystery</h3>
              <p>The most dramatic human advantage appears after minimal feedback. The <a href="https://arxiv.org/abs/2409.01374" target="_blank" rel="noopener noreferrer">H-ARC study</a> measured accuracy improvements when humans received just a binary "correct/incorrect" signal:</p>
              <div className="stats-highlight">
                <ul>
                  <li><strong>Training set improvement:</strong> +21.2 percentage points</li>
                  <li><strong>Evaluation set improvement:</strong> +25.9 percentage points</li>
                </ul>
              </div>
              <p>Humans leverage one bit of information to reconsider their entire approach and succeed. GPT-4o improves by only 9.1% with the same feedback—<strong>humans are nearly 3× more effective</strong> at self-correction.</p>

              <h3>The Language Gap: Why Human Communication Works</h3>
              <p>But there's another profound mystery: <strong>why can humans successfully communicate these solutions to each other in plain English, while AI struggles to understand the same instructions?</strong></p>
              <p>The groundbreaking <a href="https://arxiv.org/abs/2106.07824" target="_blank" rel="noopener noreferrer" style={{ fontWeight: '600' }}>Language-complete Abstraction and Reasoning Corpus (L-ARC)</a> study revealed something unexpected: when humans write instructions for solving ARC tasks in natural language, other humans achieve an <strong>88% success rate</strong> following those instructions—without ever seeing the training examples!</p>

              <div className="larc-insight-box">
                <h4>The Key Discovery: Meta-Information</h4>
                <p>L-ARC found that successful human instructions contain roughly <strong>equal parts</strong> of three components:</p>
                <ul>
                  <li><strong>Framing (~33%):</strong> Context-setting statements that establish what to focus on ("Look for the largest object", "Ignore the background colors")</li>
                  <li><strong>Procedure (~33%):</strong> The actual executable steps ("Rotate each shape 90 degrees", "Fill the center with blue")</li>
                  <li><strong>Validation (~33%):</strong> Checks to verify correctness ("You should end up with exactly 5 red cells", "The grid size stays the same")</li>
                </ul>
                <p className="insight-emphasis">This means <strong>two-thirds of human communication</strong> is dedicated to non-executable "meta-information"—the context and verification that makes ambiguous natural language work reliably.</p>
              </div>

              <p>AI systems trained on traditional program synthesis assume instructions are like computer code: precise, minimal, purely procedural. They fail because they can't interpret the rich contextual framework and validation checks that humans naturally provide.</p>
              <p>When you write "find the largest shape," another human instantly understands you mean the shape with the most cells, not the tallest or widest. AI systems struggle with this implied shared understanding—the massive "DSL-open" conceptual space that humans navigate effortlessly.</p>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;