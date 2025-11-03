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

              {/* NEW: The Language Gap Section */}
              <h3>The Language Gap: Why Human Communication Works</h3>
              <p>
                But there's another profound mystery: <strong>why can humans successfully communicate these solutions to each other in plain English, while AI struggles to understand the same instructions?</strong>
              </p>
              <p>
                The groundbreaking <a href="https://arxiv.org/abs/2106.07824" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '600' }}>Language-complete Abstraction and Reasoning Corpus (L-ARC)</a> study revealed something unexpected: when humans write instructions for solving ARC tasks in natural language, other humans achieve an <strong>88% success rate</strong> following those instructions—without ever seeing the training examples!
              </p>
              
              <div className="larc-insight-box">
                <h4>🔑 The Key Discovery: Meta-Information</h4>
                <p>
                  L-ARC found that successful human instructions contain roughly <strong>equal parts</strong> of three components:
                </p>
                <ul>
                  <li><strong>Framing (~33%):</strong> Context-setting statements that establish what to focus on ("Look for the largest object", "Ignore the background colors")</li>
                  <li><strong>Procedure (~33%):</strong> The actual executable steps ("Rotate each shape 90 degrees", "Fill the center with blue")</li>
                  <li><strong>Validation (~33%):</strong> Checks to verify correctness ("You should end up with exactly 5 red cells", "The grid size stays the same")</li>
                </ul>
                <p className="insight-emphasis">
                  This means <strong>two-thirds of human communication</strong> is dedicated to non-executable "meta-information"—the context and verification that makes ambiguous natural language work reliably.
                </p>
              </div>

              <p>
                AI systems trained on traditional program synthesis assume instructions are like computer code: precise, minimal, purely procedural. They fail because they can't interpret the rich contextual framework and validation checks that humans naturally provide. 
              </p>
              <p>
                When you write "find the largest shape," another human instantly understands you mean the shape with the most cells, not the tallest or widest. AI systems struggle with this implied shared understanding—the massive "DSL-open" conceptual space that humans navigate effortlessly.
              </p>

            </div>
          )}
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

          {/* NEW: Teaching Explanation Box */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '25px',
            borderRadius: '12px',
            marginTop: '30px',
            color: 'white'
          }}>
            <h4 style={{ 
              color: 'white',
              marginTop: '0',
              marginBottom: '15px',
              fontSize: '20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '28px' }}>💡</span>
              Why the Instructing Approach?
            </h4>
            <p style={{ 
              fontSize: '16px',
              lineHeight: '1.7',
              marginBottom: '15px',
              color: 'rgba(255,255,255,0.95)'
            }}>
              The L-ARC study showed that when humans instruct each other how to solve ARC tasks, they naturally provide three essential components: <strong style={{ color: '#ffd700' }}>framing</strong> (what to look for), <strong style={{ color: '#ffd700' }}>procedure</strong> (how to transform), and <strong style={{ color: '#ffd700' }}>validation</strong> (how to verify). This structured approach achieved 88% communication success.
            </p>
            <p style={{ 
              fontSize: '16px',
              lineHeight: '1.7',
              marginBottom: '0',
              color: 'rgba(255,255,255,0.95)'
            }}>
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

        {/* Footer Info - UPDATED */}
        <div className="content-card footer-info">
          <h3>About This Research</h3>
          <h4 style={{ color: '#282c34', fontSize: '20px', fontWeight: '600', marginBottom: '15px' }}>
            The Philosophy Behind Tessera-ARC
          </h4>
          <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057' }}>
            In order to build machines with human-like intelligence, we must teach them the <em>whole process</em>—not just the final answer, but how we get there.
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
              Communication: Beyond Pure Procedures
            </h4>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '12px' }}>
              Research shows that successful human-to-human communication about ARC tasks requires much more than just describing the transformation steps. The <a href="https://arxiv.org/abs/2106.07824" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>L-ARC study</a> revealed that approximately two-thirds of effective instructions consist of framing (setting context) and validation (providing checks)—not just the procedure itself.
            </p>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '0' }}>
              This is why we ask you to <strong>instruct</strong>. Teaching naturally elicits the complete cognitive framework: what to focus on, how to transform it, and how to verify correctness. This structured communication captures the rich, ambiguous, yet remarkably effective way humans share complex reasoning.
            </p>
          </div>

          <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057' }}>
            <strong>Tessera-ARC isn't a solution to the ARC competition itself.</strong> Instead, it's a tool—a dataset that captures the rich diversity of human problem-solving paths, including the crucial meta-information (framing and validation) that AI systems currently miss. The quality and impact of this contribution depends entirely on the <strong>quantity and richness</strong> of the teaching approaches you share with us.
          </p>

          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #ffc107', margin: '20px 0' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057', marginBottom: '0' }}>
              <strong>📊 Dataset Status:</strong> We are currently in the initial development phase of this dataset. Once we gather a significant number of submissions for each task, we will begin sharing the data publicly with the research community.
            </p>
          </div>
          
          <p className="research-citation">
            Based on François Chollet's <em>On the Measure of Intelligence</em> (2019)<br />
            <a href="https://arxiv.org/abs/1911.01547" target="_blank" rel="noopener noreferrer">
              arXiv:1911.01547
            </a>
          </p>
        </div>

        {/* About Us Section */}
        <div className="content-card" style={{ marginTop: '40px' }}>
          <h2>👥 About Us</h2>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#495057' }}>
              My name is <strong>Laurent Cheret</strong>, and I'm a PhD candidate at the University of Ottawa. My research explores the intersection of deep learning, generative models, and the integration of geometrical and topological knowledge into AI systems.
            </p>
          </div>
          
          {/* Contact Section */}
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '25px',
            borderRadius: '12px',
            marginTop: '25px',
            color: 'white'
          }}>
            <h3 style={{ 
              color: 'white',
              marginTop: '0',
              marginBottom: '15px',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              💬 Get in Touch
            </h3>
            <p style={{ 
              fontSize: '16px',
              lineHeight: '1.7',
              marginBottom: '15px',
              color: 'rgba(255,255,255,0.95)'
            }}>
              Interested in collaborating, contributing, or learning more about the project?
            </p>
            <a 
              href="mailto:tesseraarc@gmail.com"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255,255,255,0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              tesseraarc@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;