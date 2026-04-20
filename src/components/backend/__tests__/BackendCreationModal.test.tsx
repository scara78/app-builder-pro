/**
 * BackendCreationModal Tests
 * Phase 4 - UI Components for Backend Creation Pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import BackendCreationModal from '../BackendCreationModal';
import { PipelineStage } from '../../../hooks/backend/pipeline/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Loader2: () => <span data-testid="icon-loader">Loader</span>,
  CheckCircle2: () => <span data-testid="icon-check">Check</span>,
  AlertCircle: () => <span data-testid="icon-alert">Alert</span>,
  Database: () => <span data-testid="icon-database">Database</span>,
  FileCode: () => <span data-testid="icon-filecode">FileCode</span>,
  Server: () => <span data-testid="icon-server">Server</span>,
  Play: () => <span data-testid="icon-play">Play</span>,
}));

describe('BackendCreationModal', () => {
  const defaultProps = {
    stage: PipelineStage.IDLE,
    progress: 0,
    error: null,
    isCreating: false,
    onRetry: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal with correct structure', () => {
      render(<BackendCreationModal {...defaultProps} />);

      expect(document.querySelector('[data-testid="backend-creation-modal"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="progress-bar"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="progress-percentage"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="status-message"]')).not.toBeNull();
    });

    it('should display initial state correctly', () => {
      render(<BackendCreationModal {...defaultProps} />);

      const percentage = document.querySelector('[data-testid="progress-percentage"]');
      expect(percentage?.textContent).toBe('0%');
    });
  });

  describe('Progress Display', () => {
    it('should show progress percentage', () => {
      render(<BackendCreationModal {...defaultProps} progress={45} />);

      const percentage = document.querySelector('[data-testid="progress-percentage"]');
      expect(percentage?.textContent).toBe('45%');
    });

    it('should animate progress bar width', () => {
      render(<BackendCreationModal {...defaultProps} progress={75} />);

      const progressBar = document.querySelector('[data-testid="progress-bar"]');
      expect(progressBar?.getAttribute('style')).toContain('width: 75%');
    });
  });

  describe('Stage Indicators', () => {
    it('should render all stage indicators', () => {
      render(<BackendCreationModal {...defaultProps} />);

      expect(document.querySelector('[data-testid="stage-analyzing"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="stage-generating"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="stage-creating_project"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="stage-applying_migration"]')).not.toBeNull();
    });

    it('should highlight active stage', () => {
      render(<BackendCreationModal {...defaultProps} stage={PipelineStage.ANALYZING} />);

      const stageElement = document.querySelector('[data-testid="stage-analyzing"]');
      expect(stageElement?.className).toContain('active');
    });

    it('should mark completed stages', () => {
      render(
        <BackendCreationModal {...defaultProps} stage={PipelineStage.GENERATING} />
      );

      const analyzingStage = document.querySelector('[data-testid="stage-analyzing"]');
      expect(analyzingStage?.className).toContain('completed');
    });
  });

  describe('Error State', () => {
    it('should display error message when stage is ERROR', () => {
      render(
        <BackendCreationModal
          {...defaultProps}
          stage={PipelineStage.ERROR}
          error="Connection failed"
        />
      );

      const container = document.body;
      expect(container.innerHTML).toContain('Backend Creation Failed');
      expect(container.innerHTML).toContain('Connection failed');
    });

    it('should show retry button on error', () => {
      render(
        <BackendCreationModal
          {...defaultProps}
          stage={PipelineStage.ERROR}
          error="Failed"
        />
      );

      expect(document.querySelector('[data-testid="btn-retry"]')).not.toBeNull();
    });

    it('should call onRetry when retry button clicked', () => {
      const onRetry = vi.fn();
      render(
        <BackendCreationModal
          {...defaultProps}
          stage={PipelineStage.ERROR}
          error="Failed"
          onRetry={onRetry}
        />
      );

      const retryBtn = document.querySelector('[data-testid="btn-retry"]') as HTMLElement;
      fireEvent.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Complete State', () => {
    it('should display success message when stage is COMPLETE', () => {
      render(<BackendCreationModal {...defaultProps} stage={PipelineStage.COMPLETE} />);

      const container = document.body;
      expect(container.innerHTML).toContain('Backend Created!');
      expect(container.innerHTML).toContain('Your Supabase backend is ready');
    });

    it('should show continue button on complete', () => {
      render(<BackendCreationModal {...defaultProps} stage={PipelineStage.COMPLETE} />);

      expect(document.querySelector('[data-testid="btn-continue"]')).not.toBeNull();
    });
  });

  describe('Creating State', () => {
    it('should show cancel button while creating', () => {
      render(
        <BackendCreationModal
          {...defaultProps}
          stage={PipelineStage.ANALYZING}
          isCreating={true}
        />
      );

      const container = document.body;
      expect(container.innerHTML).toContain('Cancel');
    });

    it('should not show cancel button when not creating', () => {
      render(
        <BackendCreationModal
          {...defaultProps}
          stage={PipelineStage.ANALYZING}
          isCreating={false}
        />
      );

      const container = document.body;
      expect(container.innerHTML).not.toContain('Cancel');
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<BackendCreationModal {...defaultProps} onClose={onClose} />);

      const closeBtn = document.querySelector('.btn-close') as HTMLElement;
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when overlay clicked', () => {
      const onClose = vi.fn();
      render(<BackendCreationModal {...defaultProps} onClose={onClose} />);

      const overlay = document.querySelector('.modal-overlay') as HTMLElement;
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });
});
