import React from 'react';
import { Sparkles, Share2, Play, Settings, ChevronDown, Rocket } from 'lucide-react';
import { type BuilderState } from '../../types';
import { QuotaStatus } from './QuotaStatus';
import './TopBar.css';

interface TopBarProps {
  projectName: string;
  state: BuilderState;
  onOpenSettings?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ projectName, state, onOpenSettings }) => {
  const isGenerating = state === 'generating' || state === 'installing';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="logo-compact">
          <Sparkles className="logo-icon active" />
        </div>
        <div className="project-info">
          <h1 className="project-name">{projectName}</h1>
          <ChevronDown size={14} className="chevron" />
        </div>
        {state !== 'idle' && (
          <div className="status-badge fade-in">
            {isGenerating && <div className="loader-dots"><span>.</span><span>.</span><span>.</span></div>}
            <span>{state === 'generating' ? 'Generating Code' : state === 'installing' ? 'Installing Deps' : state === 'running' ? 'App Running' : 'Error'}</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <button className="btn-ghost">
          <Share2 size={18} />
          <span>Share</span>
        </button>
        <button className="btn-secondary">
          <Play size={16} />
          <span>Deploy</span>
        </button>
        <button className="btn-accent">
          <Rocket size={16} />
          <span>Publish App</span>
        </button>
        <div className="divider"></div>
        <QuotaStatus />
        <button className="btn-icon" onClick={onOpenSettings}>
          <Settings size={18} />
        </button>
        <div className="user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
