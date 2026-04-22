/**
 * CredentialsModal Component
 *
 * Displays Supabase credentials after successful backend creation.
 * Allows users to copy credentials and provides setup instructions.
 *
 * ## Features
 *
 * - Copy-to-clipboard for all credentials
 * - Toggle visibility for sensitive data (anon key)
 * - Direct link to Supabase dashboard
 * - Step-by-step setup instructions
 *
 * @module components/backend
 *
 * @example
 * ```tsx
 * {result && (
 *   <CredentialsModal
 *     result={result}
 *     onClose={() => setShowCredentials(false)}
 *   />
 * )}
 * ```
 */

import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { BackendCreationResult } from '../../hooks/backend/pipeline/types';
import type { BackendRequirements } from '../../services/analyzer/types';
import { logErrorSafe } from '../../utils/logger';
import './CredentialsModal.css';

/**
 * Props for the CredentialsModal component.
 */
interface CredentialsModalProps {
  /** Backend creation result containing credentials */
  result: BackendCreationResult;
  /** Backend requirements detected during analysis (optional, for future use) */
  requirements?: BackendRequirements | null;
  /** Handler for close button */
  onClose: () => void;
  /** Handler for Apply to Project button (optional) */
  onApply?: () => void;
  /** Whether apply is in progress (disables button and shows loading) */
  isApplying?: boolean;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  result,
  requirements: _requirements,
  onClose,
  onApply,
  isApplying = false,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAnonKey, setShowAnonKey] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      logErrorSafe('CredentialsModal', err);
    }
  };

  const credentials = [
    {
      id: 'projectUrl',
      label: 'Project URL',
      value: result.projectUrl,
      visible: true,
    },
    {
      id: 'anonKey',
      label: 'Anonymous Key',
      value: result.anonKey,
      visible: showAnonKey,
      toggleable: true,
    },
    {
      id: 'projectName',
      label: 'Project Name',
      value: result.projectName,
      visible: true,
    },
    {
      id: 'migrationName',
      label: 'Migration Applied',
      value: result.migrationName,
      visible: true,
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass credentials-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="credentials-modal"
      >
        <div className="modal-header">
          <div className="header-title">
            <span className="icon-success">✓</span>
            <h2>Backend Credentials</h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Success Banner */}
          <div className="success-banner">
            <div className="banner-icon">🎉</div>
            <div className="banner-content">
              <h3>Backend Created Successfully!</h3>
              <p>
                Your Supabase backend is ready. Use the credentials below to connect your
                application.
              </p>
            </div>
          </div>

          {/* Credentials List */}
          <div className="credentials-list">
            {credentials.map((cred) => (
              <div key={cred.id} className="credential-item">
                <label className="credential-label">{cred.label}</label>
                <div className="credential-value-container">
                  <code
                    className={`credential-value ${!cred.visible ? 'masked' : ''}`}
                    data-testid={`credential-${cred.id}`}
                  >
                    {cred.visible ? cred.value : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <div className="credential-actions">
                    {cred.toggleable && (
                      <button
                        className="btn-icon"
                        onClick={() => setShowAnonKey(!showAnonKey)}
                        title={showAnonKey ? 'Hide' : 'Show'}
                        data-testid={`toggle-${cred.id}`}
                      >
                        {showAnonKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                    <button
                      className="btn-icon"
                      onClick={() => handleCopy(cred.value, cred.id)}
                      title="Copy to clipboard"
                      data-testid={`copy-${cred.id}`}
                    >
                      {copiedField === cred.id ? (
                        <Check size={16} className="icon-success" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Setup Instructions */}
          <div className="setup-instructions">
            <h4>
              <span className="icon-info">ℹ️</span> Next Steps
            </h4>
            <ol>
              <li>Copy your Project URL and Anonymous Key</li>
              <li>Add them to your environment variables</li>
              <li>
                <code>VITE_SUPABASE_URL=your-project-url</code>
              </li>
              <li>
                <code>VITE_SUPABASE_ANON_KEY=your-anon-key</code>
              </li>
              <li>Restart your development server</li>
            </ol>
          </div>

          {/* Open in Supabase Button */}
          <a
            href={result.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-supabase"
            data-testid="btn-open-supabase"
          >
            <ExternalLink size={16} />
            Open in Supabase Dashboard
          </a>
        </div>

      <div className="modal-footer">
        {onApply && (
          <button
            className="btn-accent btn-apply"
            onClick={onApply}
            disabled={isApplying}
            aria-busy={isApplying ? 'true' : undefined}
            data-testid="btn-apply"
          >
            {isApplying && <Loader2 className="spinner" size={16} />}
            {isApplying ? 'Applying...' : 'Apply to Project'}
          </button>
        )}
        <button className="btn-accent" onClick={onClose} data-testid="btn-done">
          Done
        </button>
      </div>
      </div>
    </div>
  );
};

export default CredentialsModal;
