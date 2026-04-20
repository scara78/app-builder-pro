/**
 * BackendCreationModal Component
 *
 * Displays real-time progress during the 4-stage backend creation pipeline.
 * Shows visual indicators for each stage with progress bar and status messages.
 *
 * ## Pipeline Stages Displayed
 *
 * 1. ANALYZING - Code analysis indicator
 * 2. GENERATING - SQL generation indicator
 * 3. CREATING_PROJECT - Project creation indicator
 * 4. APPLYING_MIGRATION - Migration application indicator
 *
 * ## Features
 *
 * - Visual progress bar (0-100%)
 * - Stage-by-stage indicators with icons
 * - Error state with retry button
 * - Success state with continue button
 *
 * @module components/backend
 *
 * @example
 * ```tsx
 * <BackendCreationModal
 *   stage={PipelineStage.GENERATING}
 *   progress={50}
 *   error={null}
 *   isCreating={true}
 *   onRetry={() => retry()}
 *   onClose={() => setIsModalOpen(false)}
 * />
 * ```
 */

import React from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Database, FileCode, Server, Play } from 'lucide-react';
import { PipelineStage } from '../../hooks/backend/pipeline/types';
import './BackendCreationModal.css';

/**
 * Props for the BackendCreationModal component.
 */
interface BackendCreationModalProps {
	/** Current pipeline stage */
	stage: PipelineStage;
	/** Progress percentage (0-100) */
	progress: number;
	/** Error message if stage is ERROR */
	error: string | null;
	/** Whether pipeline is running */
	isCreating: boolean;
	/** Handler for retry button (called when user clicks Retry in ERROR state) */
	onRetry: () => void;
	/** Handler for close button */
	onClose: () => void;
}

/** Stage display configuration */
const STAGE_CONFIG: Record<PipelineStage, { label: string; icon: React.ReactNode; order: number }> = {
  [PipelineStage.IDLE]: { label: 'Ready', icon: <Play size={16} />, order: 0 },
  [PipelineStage.ANALYZING]: { label: 'Analyzing Code', icon: <FileCode size={16} />, order: 1 },
  [PipelineStage.GENERATING]: { label: 'Generating SQL', icon: <Database size={16} />, order: 2 },
  [PipelineStage.CREATING_PROJECT]: { label: 'Creating Project', icon: <Server size={16} />, order: 3 },
  [PipelineStage.APPLYING_MIGRATION]: { label: 'Applying Migration', icon: <Database size={16} />, order: 4 },
  [PipelineStage.COMPLETE]: { label: 'Complete', icon: <CheckCircle2 size={16} />, order: 5 },
  [PipelineStage.ERROR]: { label: 'Error', icon: <AlertCircle size={16} />, order: -1 },
};

const BackendCreationModal: React.FC<BackendCreationModalProps> = ({
  stage,
  progress,
  error,
  isCreating,
  onRetry,
  onClose,
}) => {
  const stages = [
    PipelineStage.ANALYZING,
    PipelineStage.GENERATING,
    PipelineStage.CREATING_PROJECT,
    PipelineStage.APPLYING_MIGRATION,
  ];

  const getCurrentStageOrder = () => STAGE_CONFIG[stage]?.order ?? 0;

  const getStageStatus = (stageEnum: PipelineStage): 'completed' | 'active' | 'pending' => {
    const currentOrder = getCurrentStageOrder();
    const stageOrder = STAGE_CONFIG[stageEnum]?.order ?? 0;
    
    if (stage === PipelineStage.ERROR) return 'pending';
    if (stageOrder < currentOrder) return 'completed';
    if (stageOrder === currentOrder) return 'active';
    return 'pending';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content glass backend-creation-modal" 
        onClick={(e) => e.stopPropagation()}
        data-testid="backend-creation-modal"
      >
        <div className="modal-header">
          <div className="header-title">
            {stage === PipelineStage.ERROR ? (
              <AlertCircle className="icon-error" size={20} />
            ) : stage === PipelineStage.COMPLETE ? (
              <CheckCircle2 className="icon-success" size={20} />
            ) : (
              <Loader2 className="icon-spin" size={20} />
            )}
            <h2>
              {stage === PipelineStage.ERROR 
                ? 'Backend Creation Failed' 
                : stage === PipelineStage.COMPLETE 
                  ? 'Backend Created!' 
                  : 'Creating Backend'}
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
            {stages.map((stageEnum, index) => {
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
                    {index < stages.length - 1 && (
                      <div className={`stage-connector ${status === 'completed' ? 'completed' : ''}`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="status-message" data-testid="status-message">
            {stage === PipelineStage.ERROR ? (
              <span className="error-message">{error}</span>
            ) : stage === PipelineStage.COMPLETE ? (
              <span className="success-message">
                Your Supabase backend is ready. Credentials will be displayed shortly.
              </span>
            ) : (
              <span className="loading-message">
                {STAGE_CONFIG[stage]?.label || 'Processing...'}
              </span>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {stage === PipelineStage.ERROR && (
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
          {stage === PipelineStage.COMPLETE && (
            <button className="btn-accent" onClick={onClose} data-testid="btn-continue">
              View Credentials
            </button>
          )}
          {isCreating && stage !== PipelineStage.ERROR && stage !== PipelineStage.COMPLETE && (
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackendCreationModal;
