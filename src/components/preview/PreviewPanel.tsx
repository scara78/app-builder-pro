import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Smartphone, Monitor, ShieldCheck, Globe } from 'lucide-react';
import { type BuilderState } from '../../types';
import './PreviewPanel.css';

interface PreviewPanelProps {
  state: BuilderState;
  url?: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ state, url }) => {
  const [hasError, setHasError] = useState(false);
  const isLoading = state === 'generating' || state === 'installing';
  const isRunning = state === 'running' && url;

  return (
    <div className="preview-panel">
      <div className="preview-toolbar">
        <div className="address-bar glass-accent">
          <Globe size={14} className="icon-globe" />
          <input type="text" value={url || 'localhost:5173'} readOnly />
          <ShieldCheck size={14} className="icon-secure" />
        </div>

        <div className="preview-actions">
          <button className="btn-icon-small" title="Refresh">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
          </button>
          <div className="divider-v"></div>
          <button className="btn-icon-small" title="Mobile View">
            <Smartphone size={14} />
          </button>
          <button className="btn-icon-small active" title="Desktop View">
            <Monitor size={14} />
          </button>
          <div className="divider-v"></div>
          <button className="btn-icon-small" title="Open in New Tab">
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      <div className="preview-viewport">
        {isLoading ? (
          <div className="preview-overlay">
            <div className="loader-container">
              <div className="loading-spinner"></div>
              <h3>{state === 'generating' ? 'Writing Code...' : 'Installing Dependencies...'}</h3>
              <p>Magic is happening in the background.</p>
            </div>
          </div>
        ) : isRunning ? (
          hasError ? (
            <div className="preview-error">
              <div className="error-icon">!</div>
              <p>Unable to load preview</p>
              <button onClick={() => setHasError(false)}>Retry</button>
            </div>
          ) : (
            <iframe
              src={url}
              sandbox="allow-scripts"
              title="App Preview"
              className="preview-iframe"
              onError={() => setHasError(true)}
            />
          )
        ) : (
          <div className="preview-empty">
            <div className="empty-content">
              <div className="preview-placeholder-art">
                <div className="art-rect rect-1"></div>
                <div className="art-rect rect-2"></div>
                <div className="art-rect rect-3"></div>
              </div>
              <h3>Your app will appear here</h3>
              <p>Type a prompt to start building your application.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
