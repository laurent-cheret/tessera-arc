import React from 'react';
import MiniARCExample from './MiniARCExample';
import TypewriterAnimation from './TypewriterAnimation';
import PaintingGridAnimation from './PaintingGridAnimation';
import FallingCells from './FallingCells';
import './LandingPage.css';

const LandingPage = ({ onStartParticipation }) => {
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
        </div>
      </div>

      {/* Main Content */}
      <div className="content-section">
        
        {/* What is Tessera-ARC */}
        <div className="content-card highlight-primary">
          <h2>🎯 What is Tessera-ARC?</h2>
          <p className="large-text">
            Tessera-ARC is a <strong>research initiative</strong> designed to collect and study 
            how humans approach abstract reasoning tasks. We focus on capturing the unique 
            problem-solving strategies that make human intelligence special. It's not just about correct answers, but 
            also about the little steps we take to get there.
          </p>
          <div className="key-points">
            <div className="key-point">
              <span className="key-icon">🧠</span>
              <div>
                <strong>Human reasoning is extraordinary:</strong> We can look at a puzzle 
                and instantly grasp patterns that the most advanced AI systems struggle with. For example, 
                seeing that a piece of a whole is missing; that things are moving or falling; that a certain color is present more than others; etc.
              </div>
            </div>
            <div className="key-point">
              <span className="key-icon">📊</span>
              <div>
                <strong>We're building a dataset:</strong> By gathering descriptions of what we see and how we think, we can help researchers understand and improve AI reasoning.
              </div>
            </div>
            <div className="key-point">
              <span className="key-icon">🌍</span>
              <div>
                <strong>Open-source contribution:</strong> All data collected will be released 
                publicly to accelerate AI research worldwide.
              </div>
            </div>
          </div>
        </div>

        {/* What is ARC */}
        <div className="content-card">
          <h2>🧩 What is the Abstraction and Reasoning Corpus (ARC)?</h2>
          <p>
            The <strong>Abstraction and Reasoning Corpus (ARC)</strong> was created by 
            François Chollet in 2019 as a benchmark for measuring general intelligence 
            in AI systems.
          </p>
          <p>
            Unlike traditional AI benchmarks that can be solved through pattern memorization, 
            ARC requires <strong>genuine understanding</strong> and <strong>abstract reasoning</strong> 
            — skills that come naturally to humans but are extremely difficult for machines.
          </p>
          <div className="arc-links">
            <a 
              href="https://github.com/fchollet/ARC-AGI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              📚 Visit the original ARC repository
            </a>
            <a 
              href="https://arxiv.org/abs/1911.01547" 
              target="_blank" 
              rel="noopener noreferrer"
              className="external-link"
            >
              📄 Read the research paper
            </a>
          </div>
        </div>

        {/* Visual Example */}
        <div className="content-card">
          <h2>👀 What Does an ARC Task Look Like?</h2>
          <p>
            Each ARC task presents you with training examples that show input grids 
            transforming into output grids. Your goal is to discover the pattern and 
            apply it to a new test input.
          </p>
          <MiniARCExample />
          {/* <p className="explanation-text">
            In this example, you would study the training pairs to understand the transformation 
            rule, then apply that same rule to create the correct output for the test input. 
            Simple for humans, challenging for AI!
          </p> */}
        </div>

        {/* What You'll Do */}
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

        {/* The Human Advantage */}
        <div className="content-card">
          <h2>💡 Why Humans Are Better at This</h2>
          <p>
            While artificial intelligence has made incredible progress in many areas, 
            abstract reasoning remains a significant challenge. Here's the current state:
          </p>
          <div className="comparison-stats">
            <div className="stat-card human">
              <div className="stat-icon">👤</div>
              <div className="stat-number">76%</div>
              <div className="stat-label">Human Accuracy</div>
              <div className="stat-detail">With just 2-4 examples</div>
            </div>
            <div className="stat-divider">vs</div>
            <div className="stat-card ai">
              <div className="stat-icon">🤖</div>
              <div className="stat-number">34%</div>
              <div className="stat-label">Best AI Accuracy</div>
              <div className="stat-detail">Despite massive computation</div>
            </div>
          </div>
          <p className="highlight-text">
            This gap exists because humans have <strong>core knowledge</strong> about objects, 
            space, and patterns that AI systems must learn from scratch. Your intuition is the 
            key to bridging this gap!
          </p>
        </div>

        {/* CTA Section */}
        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          {/* <p className="cta-description">
            Join researchers worldwide in building a better understanding of human intelligence
          </p> */}
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

        {/* Footer Info */}
        <div className="content-card footer-info">
          <h3>About This Research</h3>
          <p>
            Tessera-ARC is an independent research project collecting human reasoning 
            descriptions on abstract visual puzzles. The resulting dataset will be released 
            as an open-source resource to help researchers worldwide improve AI reasoning 
            capabilities and understand human intelligence better.
          </p>
          <p className="research-citation">
            Based on François Chollet's <em>Abstraction and Reasoning Corpus</em> (2019)<br />
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