import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onStartParticipation }) => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-container">
            <img src="/logo192.png" alt="Tessera Logo" className="hero-logo" />
          </div>
          <h1 className="project-title">Tessera-ARC</h1>
          <p className="tagline">Help us understand how humans solve puzzles</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-section">
        <div className="content-card">
          <h2>🧩 What is ARC?</h2>
          <p>
            The <strong>Abstraction and Reasoning Corpus (ARC)</strong> is a 
            benchmark designed to test general intelligence through visual pattern 
            recognition puzzles. While humans solve these puzzles easily, AI systems 
            struggle significantly.
          </p>
        </div>

        <div className="content-card highlight">
          <h2>🎯 Why Your Help Matters</h2>
          <p>
            We're building a dataset of <strong>human reasoning descriptions</strong> 
            to help train the next generation of AI systems. Your thought process while 
            solving these puzzles provides invaluable insights that current AI lacks.
          </p>
          <div className="stats-row">
            <div className="stat">
              <div className="stat-number">76%</div>
              <div className="stat-label">Human Accuracy</div>
            </div>
            <div className="stat">
              <div className="stat-number">34%</div>
              <div className="stat-label">Best AI Accuracy</div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2>📝 What You'll Do</h2>
          <div className="steps-grid">
            <div className="step">
              <span className="step-number">1</span>
              <h3>Observe</h3>
              <p>Study example patterns and form a hypothesis</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <h3>Solve</h3>
              <p>Create the solution by clicking and coloring cells</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <h3>Describe</h3>
              <p>Share your reasoning and problem-solving approach</p>
            </div>
          </div>
          <p className="time-estimate">
            ⏱️ <strong>Time commitment:</strong> 10-15 minutes per puzzle
          </p>
        </div>

        <div className="content-card">
          <h2>🎓 Your Contribution Helps</h2>
          <ul className="benefits-list">
            <li>🤖 <strong>Advance AI research</strong> by providing human reasoning data</li>
            <li>📚 <strong>Create an open-source dataset</strong> for the research community</li>
            <li>🧠 <strong>Understand your own thinking</strong> through reflection</li>
            <li>🌍 <strong>Join a global effort</strong> to develop more intelligent AI</li>
          </ul>
        </div>

        <div className="cta-section">
          <button 
            className="start-button"
            onClick={onStartParticipation}
          >
            Start Solving Puzzles →
          </button>
          <p className="privacy-note">
            🔒 Anonymous participation • No personal data collected • Open-source research
          </p>
        </div>

        <div className="content-card footer-info">
          <h3>About This Project</h3>
          <p>
            Tessera-ARC is a research project collecting human reasoning descriptions 
            on abstract visual puzzles. The data collected will be released as an 
            open-source dataset to help researchers worldwide improve AI reasoning 
            capabilities.
          </p>
          <p className="research-note">
            Based on François Chollet's <em>Abstraction and Reasoning Corpus</em> (2019)
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;