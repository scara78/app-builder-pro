/**
 * DeployModal Tests
 *
 * Tests the Vercel deploy pipeline modal UI:
 * - Stage rendering (4 deploy stages)
 * - Progress bar display
 * - Error state with retry button
 * - Complete state with success
 * - Cancel button during deploy
 * - Close behavior
 *
 * @module components/deploy/__tests__
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import DeployModal from '../DeployModal';
import { DeployStage } from '../../../hooks/deploy/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Loader2: () => <span data-testid="icon-loader">Loader</span>,
  CheckCircle2: () => <span data-testid="icon-check">Check</span>,
  AlertCircle: () => <span data-testid="icon-alert">Alert</span>,
  Upload: () => <span data-testid="icon-upload">Upload</span>,
  Cloud: () => <span data-testid="icon-cloud">Cloud</span>,
  Timer: () => <span data-testid="icon-timer">Timer</span>,
  Globe: () => <span data-testid="icon-globe">Globe</span>,
  Rocket: () => <span data-testid="icon-rocket">Rocket</span>,
}));

describe('DeployModal', () => {
  const defaultProps = {
    stage: DeployStage.IDLE,
    progress: 0,
    error: null,
    isDeploying: false,
    onRetry: vi.fn(),
    onClose: vi.fn(),
    onAbort: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with correct structure', () => {
      render(<DeployModal {...defaultProps} />);

      expect(document.querySelector('[data-testid="deploy-modal"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="progress-bar"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="progress-percentage"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="status-message"]')).not.toBeNull();
    });

    it('should display initial state correctly', () => {
      render(<DeployModal {...defaultProps} />);

      const percentage = document.querySelector('[data-testid="progress-percentage"]');
      expect(percentage?.textContent).toBe('0%');
    });
  });

  describe('Progress Display', () => {
    it('should show progress percentage', () => {
      render(<DeployModal {...defaultProps} progress={50} />);

      const percentage = document.querySelector('[data-testid="progress-percentage"]');
      expect(percentage?.textContent).toBe('50%');
    });

    it('should animate progress bar width', () => {
      render(<DeployModal {...defaultProps} progress={75} />);

      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.getAttribute('style')).toContain('width: 75%');
    });
  });

  describe('Stage Indicators', () => {
    it('should render all 4 deploy stage indicators', () => {
      render(<DeployModal {...defaultProps} />);

      expect(document.querySelector('[data-testid="stage-preparing"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="stage-deploying"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="stage-waiting"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="stage-complete"]')).not.toBeNull();
    });

    it('should highlight active stage', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.PREPARING} />);

      const stageElement = document.querySelector('[data-testid="stage-preparing"]');
      expect(stageElement?.className).toContain('active');
    });

    it('should mark completed stages', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.DEPLOYING} />);

      const preparingStage = document.querySelector('[data-testid="stage-preparing"]');
      expect(preparingStage?.className).toContain('completed');
    });

    it('should show pending stages after active', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.DEPLOYING} />);

      const waitingStage = document.querySelector('[data-testid="stage-waiting"]');
      expect(waitingStage?.className).toContain('pending');
    });
  });

  describe('Error State', () => {
    it('should display error message when stage is ERROR', () => {
      render(
        <DeployModal {...defaultProps} stage={DeployStage.ERROR} error="Vercel API error: 401" />
      );

      expect(document.body.innerHTML).toContain('Deploy Failed');
      expect(document.body.innerHTML).toContain('401');
    });

    it('should show retry button on error', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.ERROR} error="Failed" />);

      expect(document.querySelector('[data-testid="btn-retry"]')).not.toBeNull();
    });

    it('should call onRetry when retry button clicked', () => {
      const onRetry = vi.fn();
      render(
        <DeployModal {...defaultProps} stage={DeployStage.ERROR} error="Failed" onRetry={onRetry} />
      );

      const retryBtn = document.querySelector('[data-testid="btn-retry"]') as HTMLElement;
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete State', () => {
    it('should display success message when stage is COMPLETE', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.COMPLETE} />);

      expect(document.body.innerHTML).toContain('Deployed!');
      expect(document.body.innerHTML).toContain('Your app is live on Vercel');
    });

    it('should show done button on complete', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.COMPLETE} />);

      expect(document.querySelector('[data-testid="btn-done"]')).not.toBeNull();
    });

    it('should call onClose when done button clicked', () => {
      const onClose = vi.fn();
      render(<DeployModal {...defaultProps} stage={DeployStage.COMPLETE} onClose={onClose} />);

      const doneBtn = document.querySelector('[data-testid="btn-done"]') as HTMLElement;
      fireEvent.click(doneBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deploying State', () => {
    it('should show cancel button while deploying', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.DEPLOYING} isDeploying={true} />);

      expect(document.querySelector('[data-testid="btn-cancel"]')).not.toBeNull();
    });

    it('should call onAbort when cancel button clicked', () => {
      const onAbort = vi.fn();
      render(
        <DeployModal
          {...defaultProps}
          stage={DeployStage.DEPLOYING}
          isDeploying={true}
          onAbort={onAbort}
        />
      );

      const cancelBtn = document.querySelector('[data-testid="btn-cancel"]') as HTMLElement;
      fireEvent.click(cancelBtn);
      expect(onAbort).toHaveBeenCalledTimes(1);
    });

    it('should not show cancel button when not deploying', () => {
      render(<DeployModal {...defaultProps} stage={DeployStage.IDLE} isDeploying={false} />);

      expect(document.querySelector('[data-testid="btn-cancel"]')).toBeNull();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<DeployModal {...defaultProps} onClose={onClose} />);

      const closeBtn = document.querySelector('.btn-close') as HTMLElement;
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when overlay clicked', () => {
      const onClose = vi.fn();
      render(<DeployModal {...defaultProps} onClose={onClose} />);

      const overlay = document.querySelector('.modal-overlay') as HTMLElement;
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });
});
