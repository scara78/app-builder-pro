import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Code2, Rocket, Settings } from 'lucide-react';
import SettingsModal from '../components/settings/SettingsModal';
import './LandingPage.css';

interface LandingPageProps {
  onStartBuild: (prompt: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartBuild }) => {
  const [prompt, setPrompt] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const examples = [
    "A modern SaaS dashboard with dark mode",
    "A personal portfolio for a creative developer",
    "A real-time crypto tracker with charts",
    "A minimal landing page for an AI product"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onStartBuild(prompt);
    }
  };

  return (
    <div className="landing-container">
      {/* Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      
      <header className="landing-header">
        <div className="logo-container">
          <Sparkles className="logo-icon" />
          <span className="logo-text">App Builder <span>Pro</span></span>
        </div>
        <nav className="landing-nav">
          <a href="#">Showcase</a>
          <a href="#">Templates</a>
          <div className="divider-h"></div>
          <button className="btn-icon-landing" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </button>
          <button className="btn-outline">Sign In</button>
        </nav>
      </header>

      <main className="landing-main">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge">
            <Rocket size={14} className="badge-icon" />
            <span>AI-First Builder v1.0</span>
          </div>
          <h1 className="hero-title">
            Build any app <br /> 
            <span className="gradient-text">with just a prompt</span>
          </h1>
          <p className="hero-description">
            The intelligent builder for non-technical founders and developers alike. 
            Describe it, vibe it, and our AI constructs the code in seconds.
          </p>

          <form className="prompt-form" onSubmit={handleSubmit}>
            <div className="prompt-input-wrapper glass">
              <Terminal className="input-icon" />
              <input 
                type="text" 
                placeholder="What do you want to build today?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn-primary" disabled={!prompt.trim()}>
                Build App
              </button>
            </div>
          </form>

          <div className="examples-container">
            <span className="examples-label">Try these:</span>
            <div className="examples-list">
              {examples.map((ex, i) => (
                <button 
                  key={i} 
                  className="example-chip glass"
                  onClick={() => setPrompt(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="feature-grid"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="feature-card glass">
            <Code2 className="feature-icon" />
            <h3>Real Code Generation</h3>
            <p>Generated React and Tailwind code you can actually own and export.</p>
          </div>
          <div className="feature-card glass">
            <Terminal className="feature-icon" />
            <h3>In-Browser Preview</h3>
            <p>Run your application instantly inside our sandboxed execution engine.</p>
          </div>
          <div className="feature-card glass">
            <Sparkles className="feature-icon" />
            <h3>Iterative Building</h3>
            <p>Refine your app by simply chatting with the AI agent.</p>
          </div>
        </motion.div>
      </main>

      <footer className="landing-footer">
        <p>© 2026 App Builder Pro AI Labs. Built with &lt;3 for builders.</p>
      </footer>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
};

export default LandingPage;
