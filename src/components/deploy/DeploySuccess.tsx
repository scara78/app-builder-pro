/**
 * DeploySuccess Component
 *
 * Displays deploy result after a successful Vercel deployment.
 * Shows the deployed URL with a clickable link and copy-to-clipboard button.
 *
 * ## Features
 *
 * - Deployed URL as clickable external link
 * - Copy-to-clipboard with visual feedback
 * - Deployment ID display
 * - Project name display
 * - Done button to dismiss
 *
 * @module components/deploy
 *
 * @example
 * ```tsx
 * <DeploySuccess
 *   result={{ url: 'https://my-app.vercel.app', deploymentId: 'dep_123', projectName: 'my-app' }}
 *   onDone={() => setModalOpen(false)}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import { ExternalLink, Copy, Check, Rocket } from 'lucide-react';
import type { DeployResult } from '../../hooks/deploy/types';
import './DeploySuccess.css';

/**
 * Props for the DeploySuccess component.
 */
interface DeploySuccessProps {
  /** Deploy result containing URL, deployment ID, and project name */
  result: DeployResult;
  /** Handler for done button */
  onDone: () => void;
}

const DeploySuccess: React.FC<DeploySuccessProps> = ({ result, onDone }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text for manual copy
    }
  }, [result.url]);

  return (
    <div className="deploy-success" data-testid="deploy-success">
      <div className="deploy-success-header">
        <Rocket size={24} className="icon-success" />
        <h2>Your App is Live!</h2>
      </div>

      <div className="deploy-success-body">
        {/* Project Name */}
        <div className="deploy-info-row">
          <span className="deploy-info-label">Project</span>
          <span className="deploy-info-value">{result.projectName}</span>
        </div>

        {/* Deployment ID */}
        <div className="deploy-info-row">
          <span className="deploy-info-label">Deployment</span>
          <span className="deploy-info-value deploy-info-mono">{result.deploymentId}</span>
        </div>

        {/* URL with link and copy */}
        <div className="deploy-url-row">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="deploy-url-link"
            data-testid="deploy-url-link"
          >
            {result.url}
            <ExternalLink size={14} />
          </a>
          <button
            className="btn-copy-url"
            onClick={handleCopy}
            data-testid="btn-copy-url"
            title="Copy URL to clipboard"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="deploy-success-footer">
        <button className="btn-accent" onClick={onDone} data-testid="btn-done">
          Done
        </button>
      </div>
    </div>
  );
};

export default DeploySuccess;
