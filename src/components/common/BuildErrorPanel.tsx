import React from 'react';
import './BuildErrorPanel.css';

interface BuildErrorPanelProps {
  message: string;
  onRetry: () => void;
}

const BuildErrorPanel: React.FC<BuildErrorPanelProps> = ({ message, onRetry }) => {
  return (
    <div className="build-error-panel" data-testid="build-error-panel">
      <div className="build-error-content">
        <div className="build-error-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Build Error</h2>
        <p className="build-error-message">{message}</p>
        <button
          className="build-error-retry-btn"
          onClick={onRetry}
          data-testid="error-retry-btn"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default BuildErrorPanel;
