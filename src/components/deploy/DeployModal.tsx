/**
 * DeployModal Component
 *
 * Displays real-time progress during the 4-stage Vercel deploy pipeline.
 * Mirrors the BackendCreationModal pattern for visual consistency.
 *
 * ## Pipeline Stages Displayed
 *
 * 1. PREPARING - File preparation indicator
 * 2. DEPLOYING - Deployment creation indicator
 * 3. WAITING - Polling for ready state indicator
 * 4. COMPLETE - Success indicator
 *
 * ## Features
 *
 * - Visual progress bar (0-100%)
 * - Stage-by-stage indicators with icons
 * - Error state with retry button
 * - Success state with done button
 * - Cancel (abort) button during deployment
 *
 * @module components/deploy
 *
 * @example
 * ```tsx
 * <DeployModal
 *   stage={DeployStage.DEPLOYING}
 *   progress={50}
 *   error={null}
 *   isDeploying={true}
 *   onRetry={() => retry()}
 *   onClose={() => setIsModalOpen(false)}
 *   onAbort={() => abort()}
 * />
 * ```
 */

import React from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Cloud,
  Timer,
  Globe,
  Rocket,
} from 'lucide-react';
import { DeployStage } from '../../hooks/deploy/types';
import './DeployModal.css';

/**
 * Props for the DeployModal component.
 */
interface DeployModalProps {
  /** Current pipeline stage */
  stage: DeployStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if stage is ERROR */
  error: string | null;
  /** Whether pipeline is running */
  isDeploying: boolean;
  /** Handler for retry button (called when user clicks Retry in ERROR state) */
  onRetry: () => void;
  /** Handler for close button */
  onClose: () => void;
  /** Handler for abort button (called when user clicks Cancel during deploy) */
  onAbort: () => void;
}

/** Stage display configuration */
const STAGE_CONFIG: Record<DeployStage, { label: string; icon: React.ReactNode; order: number }> = {
  [DeployStage.IDLE]: { label: 'Ready', icon: <Rocket size={16} />, order: 0 },
  [DeployStage.AUTHENTICATING]: { label: 'Authenticating', icon: <Cloud size={16} />, order: 1 },
  [DeployStage.PREPARING]: { label: 'Preparing Files', icon: <Upload size={16} />, order: 2 },
  [DeployStage.DEPLOYING]: { label: 'Deploying', icon: <Cloud size={16} />, order: 3 },
  [DeployStage.WAITING]: { label: 'Waiting for Ready', icon: <Timer size={16} />, order: 4 },
  [DeployStage.COMPLETE]: { label: 'Complete', icon: <Globe size={16} />, order: 5 },
  [DeployStage.ERROR]: { label: 'Error', icon: <AlertCircle size={16} />, order: -1 },
};

/** Pipeline stages displayed as indicators (excludes IDLE, AUTHENTICATING, ERROR) */
const PIPELINE_STAGES = [
  DeployStage.PREPARING,
  DeployStage.DEPLOYING,
  DeployStage.WAITING,
  DeployStage.COMPLETE,
];

const DeployModal: React.FC<DeployModalProps> = ({
  stage,
  progress,
  error,
  isDeploying,
  onRetry,
  onClose,
  onAbort,
}) => {
  const getCurrentStageOrder = () => STAGE_CONFIG[stage]?.order ?? 0;

  const getStageStatus = (stageEnum: DeployStage): 'completed' | 'active' | 'pending' => {
    const currentOrder = getCurrentStageOrder();
    const stageOrder = STAGE_CONFIG[stageEnum]?.order ?? 0;

    if (stage === DeployStage.ERROR) return 'pending';
    if (stageOrder < currentOrder) return 'completed';
    if (stageOrder === currentOrder) return 'active';
    return 'pending';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass deploy-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="deploy-modal"
      >
        <div className="modal-header">
          <div className="header-title">
            {stage === DeployStage.ERROR ? (
              <AlertCircle className="icon-error" size={20} />
            ) : stage === DeployStage.COMPLETE ? (
              <CheckCircle2 className="icon-success" size={20} />
            ) : (
              <Loader2 className="icon-spin" size={20} />
            )}
            <h2>
              {stage === DeployStage.ERROR
                ? 'Deploy Failed'
                : stage === DeployStage.COMPLETE
                  ? 'Deployed!'
                  : 'Deploying to Vercel'}
            </h2>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
                data-testid="progress-bar"
              />
            </div>
            <span className="progress-percentage" data-testid="progress-percentage">
              {progress}%
            </span>
          </div>

          {/* Stage Indicators */}
          <div className="stages-container">
            {PIPELINE_STAGES.map((stageEnum) => {
              const status = getStageStatus(stageEnum);
              const config = STAGE_CONFIG[stageEnum];

              return (
                <div
                  key={stageEnum}
                  className={`stage-item ${status}`}
                  data-testid={`stage-${stageEnum}`}
                >
                  <div className="stage-icon">
                    {status === 'completed' ? (
                      <CheckCircle2 size={20} className="icon-success" />
                    ) : status === 'active' ? (
                      <Loader2 size={20} className="icon-spin" />
                    ) : (
                      config.icon
                    )}
                  </div>
                  <div className="stage-info">
                    <span className="stage-label">{config.label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="status-message" data-testid="status-message">
            {stage === DeployStage.ERROR ? (
              <span className="error-message">{error}</span>
            ) : stage === DeployStage.COMPLETE ? (
              <span className="success-message">
                Your app is live on Vercel. Click done to see the result.
              </span>
            ) : (
              <span className="loading-message">
                {STAGE_CONFIG[stage]?.label || 'Processing...'}
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {stage === DeployStage.ERROR && (
            <>
              <button className="btn-retry" onClick={onRetry} data-testid="btn-retry">
                <Loader2 size={16} />
                Retry
              </button>
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </>
          )}
          {stage === DeployStage.COMPLETE && (
            <button className="btn-accent" onClick={onClose} data-testid="btn-done">
              Done
            </button>
          )}
          {isDeploying && stage !== DeployStage.ERROR && stage !== DeployStage.COMPLETE && (
            <button className="btn-secondary" onClick={onAbort} data-testid="btn-cancel">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeployModal;
