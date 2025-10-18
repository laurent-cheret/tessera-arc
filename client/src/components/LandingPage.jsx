import React, { useState } from 'react';
import MiniARCExample from './MiniARCExample';
import TypewriterAnimation from './TypewriterAnimation';
import PaintingGridAnimation from './PaintingGridAnimation';
import './LandingPage.css';

const LandingPage = ({ onStartParticipation }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Phrases for observe phase
  const observePhrases = [
    "I think the blue rectangles are moving right...",
    "I see objects being colored based on their size...",
    "The pattern is being extended to the right...",
    "It looks like shapes are rotating clockwise...",
    "All red cells seem to become blue while the...",
  ];

  // Phrases for describe phase  
  const describePhrases = [
    "I realized that the most present color was green...",
    "I started by looking at the output and...",
    "My first attempt didn't work because ...",
    "The key insight was noticing that the largest shapes...",
    "I saw that the objects were falling...",
  ];

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-container">
            <img src="/logo192.png" alt="Tessera Logo" className="hero-logo" />
          </div>
          <h1 className="project-title">Tessera-ARC</h1>
          <p className="tagline">Capturing human intelligence one piece at a time.</p>
          <div style={{ marginTop: '25px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* GitHub Link */}
            <a 
              href="https://github.com/laurent-cheret/tessera-arc" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              {/* GitHub */}
            </a>

            {/* X (Twitter) Link */}
            <a 
              href="https://x.com/TesseraARC" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              {/* Follow Us */}
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-section">
        
        {/* Introduction Section */}
        <div className="content-card">
          <h2>🎯 The Challenge</h2>
          <p className="large-text">
            The <a href="https://arcprize.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>Abstraction and Reasoning Corpus (ARC-AGI)</a> is artificial intelligence's most stubborn challenge—a $600,000 prize that remains unclaimed despite years of effort from the world's best AI labs. While <a href="https://arxiv.org/abs/2409.01374" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>over 1,700 tested humans</a> solve these visual reasoning puzzles at 76.2% accuracy, the <a href="https://arxiv.org/abs/2412.04604" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>best AI systems</a> struggle to reach 55.5%.
          </p>
          <p className="large-text">
            This gap reveals something profound: current AI excels at precise, code-like operations but fails at the effortless intuition humans use to recognize patterns and self-correct mistakes. After receiving just a simple "incorrect" signal following their first attempt, humans improve their accuracy by <strong>25.9 percentage points</strong> on hard problems—GPT-4o improves by only <strong>9.1%</strong>.
          </p>
          <p className="large-text">
            <strong>Your participation helps us capture this mysterious human advantage</strong>, creating a dataset that could finally teach machines to think more like we do.
          </p>

          {/* Read More Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="read-more-button"
          >
            {isExpanded ? '📖 Show Less' : '📖 Read the Full Research Story'}
            <span className="arrow">{isExpanded ? '▲' : '▼'}</span>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="expanded-content">
              
              {/* What is ARC-AGI */}
              <h3>What is ARC-AGI?</h3>
              <p>
                The Abstraction and Reasoning Corpus presents simple visual puzzles: colored grids that transform according to hidden rules. You see 2-3 examples of input-output pairs, then must discover the rule and apply it to a new test case. These puzzles test core knowledge—concepts like symmetry, counting, containment, and pathfinding—without requiring specialized expertise.
              </p>
              
              <MiniARCExample />

              <p>
                The <a href="https://arxiv.org/abs/2409.01374" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>H-ARC study</a> tested over 1,700 people and found that <strong>790 out of 800 tasks (98.8%)</strong> were solvable by at least one person within three attempts, confirming these are genuine intelligence tests, not trick questions.
              </p>
              <p>
                The benchmark was specifically designed to resist the "scaling" approach that dominates modern AI. Early pure deep learning systems scored below 1% in the 2020 Kaggle competition. Even GPT-3 with direct prompting scored 0%. Five years and billions of dollars later, with the intense <a href="https://arxiv.org/abs/2412.04604" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>2024 ARC Prize competition</a>, the frontier has moved to only 55.5%, far short of the 85% needed to claim the grand prize.
              </p>

              {/* Four Fundamental Weaknesses */}
              <h3>Why AI Struggles: Four Fundamental Weaknesses</h3>

              {/* Weakness 1 */}
              <div className="weakness-box weakness-1">
                <h4>1. The Forced Split: Symbolic vs. Perceptual</h4>
                <p>
                  The best AI systems cannot commit to one way of reasoning. They split into two incompatible modes:
                </p>
                <ul>
                  <li><strong>Induction</strong> (symbolic/code-based): Tries to write explicit Python programs. Excels at precise operations like "count all the blue squares, then double that number, and then make a new row of yellow squares equal to that doubled count."</li>
                  <li><strong>Transduction</strong> (neural/fuzzy): Skips explicit rules and directly predicts the output. Better at perceptual tasks like recognizing implied rotations or judging whether an object is "more vertical than horizontal."</li>
                </ul>
                <p>
                  Top systems must run both approaches separately and ensemble their results—a computational crutch proving neither method alone is robust enough. Humans don't make this conscious choice; we seamlessly integrate symbolic and visual reasoning.
                </p>
              </div>

              {/* Weakness 2 */}
              <div className="weakness-box weakness-2">
                <h4>2. The Conceptual Ceiling</h4>
                <p>
                  State-of-the-art systems are trained on up to <strong>400,000 synthetic ARC-like problems</strong>. Yet these all derive from just <strong>100-160 human-written "seed" programs</strong>—basic concepts manually coded by researchers like "move the largest object down" or "change color to blue."
                </p>
                <p>
                  The AI becomes a brilliant remix artist using techniques like RRAG (retrieval-augmented generation), combining concepts but unable to invent genuinely new ones. No amount of computational remixing can teach the AI about "yellow" if it was only given "red" and "blue" to start with.
                </p>
              </div>

              {/* Weakness 3 */}
              <div className="weakness-box weakness-3">
                <h4>3. Computational Inefficiency at Every Stage</h4>
                <p>
                  <strong>Program search inefficiency:</strong> Systems like <a href="https://redwoodresearch.substack.com/p/getting-50-sota-on-arc-agi-with-gpt" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>Ryan Greenblatt's approach</a> sample upwards of 20,000 candidate Python programs per task. Roughly 9% are "false positives"—programs that perfectly fit training examples but fail catastrophically on test cases.
                </p>
                <p>
                  <strong>Test-time training:</strong> Transduction systems temporarily update their own parameters for each problem using LoRA adapters, boosting accuracy from 18% to over 50% but requiring problem-specific retraining every single time.
                </p>
                <p>
                  Humans solve these puzzles in approximately 97 seconds on average using minimal mental effort. The efficiency gap is staggering.
                </p>
              </div>

              {/* Weakness 4 */}
              <div className="weakness-box weakness-4">
                <h4>4. The Difficulty Inversion</h4>
                <p>
                  AI performance curves are nearly perfectly inverted from human performance. AI actually <em>surpasses</em> humans on the hardest 20% of official ARC problems—complex, multi-step transformations that are perceptually confusing but can be expressed as concise deterministic code.
                </p>
                <p>
                  Meanwhile, AI severely underperforms on tasks humans find trivially easy—simple pattern completions solved with a glance. If an AI must spin up massive program search and hierarchical voting just to solve a basic visual pattern that humans get in three seconds, something fundamental about efficient reasoning is missing.
                </p>
              </div>

              {/* Self-Correction Mystery */}
              <h3>The Self-Correction Mystery</h3>
              <p>
                The most dramatic human advantage appears after minimal feedback. The <a href="https://arxiv.org/abs/2409.01374" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>H-ARC study</a> measured accuracy improvements when humans received just a binary "correct/incorrect" signal:
              </p>
              <div className="stats-highlight">
                <ul>
                  <li><strong>Training set improvement:</strong> +21.2 percentage points</li>
                  <li><strong>Evaluation set improvement:</strong> +25.9 percentage points</li>
                </ul>
              </div>
              <p>
                Humans leverage one bit of information to reconsider their entire approach and succeed. GPT-4o improves by only 9.1% with the same feedback—<strong>humans are nearly 3× more effective</strong> at self-correction.
              </p>

              {/* Case Studies */}
              <h3>Recent AI Approaches and Their Limitations</h3>
              <p>
                The promising but flawed <a href="https://arxiv.org/abs/2506.21734" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>Hierarchical Reasoning Model (HRM)</a> study provides crucial lessons. Initially claiming high performance with a custom "brain-inspired" 27-million parameter architecture, <a href="https://arcprize.org/blog/hrm-analysis" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>independent verification</a> revealed:
              </p>
              <ul>
                <li><strong>Architecture was irrelevant:</strong> Replacing the specialized design with a standard transformer reduced performance by only ~5 percentage points.</li>
                <li><strong>Iterative refinement was everything:</strong> Performance jumped by 13 percentage points going from one to two outer loops (self-correction rounds).</li>
                <li><strong>Limited cross-task transfer:</strong> ~31% of the score came from encoding task-specific solutions rather than genuine generalization.</li>
              </ul>

              <p>
                The <a href="https://arxiv.org/abs/2411.08706" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>Latent Program Network (LPN)</a> experiments demonstrated similar patterns. When tested on out-of-distribution tasks—training on sparse patterns covering 50% of grids, then testing on dense patterns covering 100%:
              </p>
              <ul>
                <li><strong>Initial intuition failed completely:</strong> The encoder's first prediction had nearly 0% accuracy</li>
                <li><strong>Search rescued performance:</strong> Running 100 steps of gradient ascent recovered accuracy up to 88%</li>
              </ul>

              {/* What We're Collecting */}
              <h3 style={{ paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>What We're Collecting and Why</h3>

              <div className="collection-box collection-1">
                <h4>1. First Impressions & Initial Hypothesis</h4>
                <p className="collection-timing">
                  <strong>Collected:</strong> Immediately upon viewing the task, before any solving attempts
                </p>
                <p>
                  We ask you to describe your initial reaction and the transformation rule you think applies—in your own words, before testing whether you're correct. This captures the raw intuition and "aha moment" when you first grasp the pattern—the raw ingredient that synthetic program generators miss when the original seed set of 160 concepts didn't include that specific prior.
                </p>
              </div>

              <div className="collection-box collection-2">
                <h4>2. Step-by-Step Solution Actions</h4>
                <p className="collection-timing">
                  <strong>Collected:</strong> Automatically logged throughout your solving process
                </p>
                <p>
                  Every click, tool selection, and color change is recorded with timestamps. This reveals your exploration phase, when you commit to a hypothesis, and your execution sequence. If we can identify which strategies humans try first, we can train systems to minimize wasteful exploration—teaching them <em>where to look first</em> rather than brute-forcing the action space.
                </p>
              </div>

              <div className="collection-box collection-3">
                <h4>3. Solution Attempts & Revisions</h4>
                <p className="collection-timing">
                  <strong>Collected:</strong> All submissions and whether you changed your approach
                </p>
                <p>
                  We track each submission and whether your hypothesis needed revision after feedback. This maps the self-correction mechanism—that dramatic 25.9 percentage point improvement. By capturing the before/after hypothesis change, we're documenting the cognitive flexibility that current AI fundamentally lacks.
                </p>
              </div>

              <div className="collection-box collection-4">
                <h4>4. Perceived Difficulty</h4>
                <p className="collection-timing">
                  <strong>Collected:</strong> After task completion
                </p>
                <p>
                  Tasks you find trivially easy but AI finds hard reveal missing perceptual priors. The difficulty inversion tells us that perceptually obvious patterns—the ones you solve with effortless intuition—are precisely what's missing from the synthetic training data.
                </p>
              </div>

              {/* Expected Impact */}
              <h3>Expected Impact</h3>
              <p>
                Your data directly addresses the Pareto frontier problem in AI: achieving high accuracy <em>and</em> high efficiency simultaneously. The $600,000 ARC Prize isn't just about reaching 85% accuracy; it's about achieving it with human-like efficiency—your approximately 97 seconds of concentrated thought using minimal actions.
              </p>
              <p>
                The dataset we're building will:
              </p>
              <ul>
                <li><strong>Train efficient program search:</strong> Reduce the 20,000-program search space by orders of magnitude</li>
                <li><strong>Enable better hypothesis generation:</strong> Teach AI systems which hypothesis types humans generate for specific visual patterns</li>
                <li><strong>Identify missing conceptual priors:</strong> Reveal which fundamental concepts need to be added to seed sets</li>
                <li><strong>Quantify self-correction mechanisms:</strong> Map the cognitive process AI fundamentally lacks</li>
                <li><strong>Establish action efficiency baselines:</strong> Set benchmarks for future interactive reasoning systems</li>
              </ul>
              <p>
                The ARC-AGI benchmark has survived five years of intense effort from the world's best-funded labs. By making your problem-solving process explicit and measurable, you're providing the unprecedented leverage point that could finally bridge the human-machine intelligence gap.
              </p>

            </div>
          )}
        </div>

        {/* How You Can Contribute */}
        <div className="content-card highlight">
          <h2>📝 How You Can Contribute</h2>
          <p>
            Your participation involves three simple steps:
          </p>
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

            {/* Step 3: Describe */}
            <div className="step-animated">
              <span className="step-number">3</span>
              <div className="step-content">
                <h3>💭 Describe</h3>
                <p>Share your thought process, strategy, and reasoning in your own words</p>
                <TypewriterAnimation 
                  phrases={describePhrases}
                  speed={50}
                  pauseDuration={2000}
                  isItalic={true}
                />
              </div>
            </div>

          </div>
          <div className="time-commitment">
            <span className="time-icon">⏱️</span>
            <div>
              <strong>Time commitment:</strong> 10-15 minutes per puzzle<br />
              <span className="subtext">Solve as many or as few as you like!</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          <button 
            className="start-button"
            onClick={onStartParticipation}
          >
            Start Solving Puzzles →
          </button>
          <div className="privacy-badge">
            <span className="badge-icon">🔒</span>
            <div className="badge-text">
              <strong>Your privacy matters</strong><br />
              Anonymous participation • No personal data required • Open research
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div className="content-card">
          <h2>👥 About Us</h2>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057' }}>
              My name is <strong>Laurent Cheret</strong>, and I'm a PhD candidate at the University of Ottawa. My research explores the intersection of deep learning, generative models, and the integration of geometrical and topological knowledge into AI systems.
            </p>
          </div>
          
          <h3 style={{ color: '#282c34', fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
            The Philosophy Behind Tessera-ARC
          </h3>
          <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057' }}>
            I believe that to build machines with human-like intelligence, we must teach them the <em>whole process</em>—not just the final answer, but how we get there.
          </p>
          
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h4 style={{ color: '#282c34', fontSize: '18px', fontWeight: '600', marginTop: '0', marginBottom: '10px' }}>
              Abstraction: The Power of Multiple Perspectives
            </h4>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '0' }}>
              When different humans look at the same ARC puzzle, they see different things. One person might see "a maze with a start point and endpoint." Another might see "a line passing through obstacles." Someone else might interpret it as "streets with a path being carved." This diversity of interpretation isn't noise—it's fundamental. Different humans use rich sets of vocabulary to capture aspects of a task that a single person might struggle to articulate. By collecting these varied perspectives, we're building a more complete picture of how humans perform abstraction.
            </p>
          </div>

          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
            <h4 style={{ color: '#282c34', fontSize: '18px', fontWeight: '600', marginTop: '0', marginBottom: '10px' }}>
              Reasoning: Breaking Down Complexity
            </h4>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '0' }}>
              Beyond abstraction, we need to understand how humans decompose complex tasks into smaller, manageable parts—and how we sequence these parts to move from problem to solution. This step-by-step reasoning process is what transforms an initial insight into a concrete answer.
            </p>
          </div>

          <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057' }}>
            <strong>Tessera-ARC isn't a solution to the ARC competition itself.</strong> Instead, it's a tool—a dataset that captures the rich diversity of human problem-solving paths. The quality and impact of this contribution depends entirely on the <strong>quantity and richness</strong> of the approaches you share with us.
          </p>

          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ffc107', margin: '20px 0' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '0' }}>
              <strong>📊 Dataset Status:</strong> We are currently in the initial development phase of this dataset. Once we gather a significant number of submissions for each task, we will begin sharing the data publicly with the research community.
            </p>
          </div>
          
          <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '0' }}>
            Your unique perspective, your reasoning process, and your way of seeing these puzzles could be the piece that helps future AI systems finally bridge the gap between human and machine intelligence.
          </p>
        </div>

        {/* Footer Info */}
        <div className="content-card footer-info">
          <h3>About This Research</h3>
          <p>
            Tessera-ARC is an independent research project collecting human reasoning descriptions on abstract visual puzzles. The resulting dataset will be released as an open-source resource to help researchers worldwide improve AI reasoning capabilities and understand human intelligence better.
          </p>
          <p className="research-citation">
            Based on François Chollet's <em>On the Measure of Intelligence</em> (2019)<br />
            <a href="https://arxiv.org/abs/1911.01547" target="_blank" rel="noopener noreferrer">
              arXiv:1911.01547
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;