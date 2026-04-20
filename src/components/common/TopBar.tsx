import React from 'react';
import { Sparkles, Share2, Play, Settings, ChevronDown, Rocket, Database, Loader2 } from 'lucide-react';
import { type BuilderState } from '../../types';
import { QuotaStatus } from './QuotaStatus';
import './TopBar.css';

interface TopBarProps {
  projectName: string;
  state: BuilderState;
  onOpenSettings?: () => void;
  /** Whether user has generated code from AI Builder */
  hasGeneratedCode?: boolean;
  /** Whether user is authenticated with Supabase OAuth */
  hasOAuthToken?: boolean;
  /** Whether backend creation is in progress */
  isCreatingBackend?: boolean;
  /** Callback when "Create Backend" button is clicked */
  onCreateBackend?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  projectName,
  state,
  onOpenSettings,
  hasGeneratedCode = false,
  hasOAuthToken = false,
  isCreatingBackend = false,
  onCreateBackend,
}) => {
  const isGenerating = state === 'generating' || state === 'installing';

  // Determine button state
  const isButtonDisabled = !hasOAuthToken || !hasGeneratedCode || isCreatingBackend;
  const buttonTooltip = !hasGeneratedCode
    ? 'Generate code first'
    : !hasOAuthToken
      ? 'Login with Supabase'
      : isCreatingBackend
        ? 'Creating backend...'
        : 'Create Supabase backend';

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
            {isGenerating && (
              <div className="loader-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            )}
            <span>
              {state === 'generating'
                ? 'Generating Code'
                : state === 'installing'
                  ? 'Installing Deps'
                  : state === 'running'
                    ? 'App Running'
                    : 'Error'}
            </span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Create Backend Button */}
        <button
          className={`btn-backend ${isCreatingBackend ? 'loading' : ''}`}
          onClick={onCreateBackend}
          disabled={isButtonDisabled}
          title={buttonTooltip}
          data-testid="btn-create-backend"
        >
          {isCreatingBackend ? (
            <Loader2 size={16} className="icon-spin" />
          ) : (
            <Database size={16} />
          )}
          <span>{isCreatingBackend ? 'Creating...' : 'Create Backend'}</span>
        </button>

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
