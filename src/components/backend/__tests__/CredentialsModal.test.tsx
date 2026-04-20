/**
 * CredentialsModal Tests
 * Phase 4 - UI Components for Backend Creation Pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CredentialsModal from '../CredentialsModal';
import type { BackendCreationResult } from '../../../hooks/backend/pipeline/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span data-testid="icon-x">X</span>,
  Copy: () => <span data-testid="icon-copy">Copy</span>,
  Check: () => <span data-testid="icon-check">Check</span>,
  ExternalLink: () => <span data-testid="icon-external">External</span>,
  Eye: () => <span data-testid="icon-eye">Eye</span>,
  EyeOff: () => <span data-testid="icon-eyeoff">EyeOff</span>,
  Loader2: () => <span data-testid="icon-loader">Loading</span>,
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

describe('CredentialsModal', () => {
  const mockResult: BackendCreationResult = {
    projectUrl: 'https://test-project.supabase.co',
    anonKey: 'test-anon-key-12345',
    projectName: 'test-project',
    migrationName: 'initial_migration',
  };

  const defaultProps = {
    result: mockResult,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should render modal with correct structure', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByTestId('credentials-modal')).toBeInTheDocument();
      expect(screen.getByText('Backend Credentials')).toBeInTheDocument();
    });

    it('should display success banner', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByText('Backend Created Successfully!')).toBeInTheDocument();
      expect(
        screen.getByText(/Your Supabase backend is ready/)
      ).toBeInTheDocument();
    });
  });

  describe('Credentials Display', () => {
    it('should display all credentials', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByTestId('credential-projectUrl')).toBeInTheDocument();
      expect(screen.getByTestId('credential-anonKey')).toBeInTheDocument();
      expect(screen.getByTestId('credential-projectName')).toBeInTheDocument();
      expect(screen.getByTestId('credential-migrationName')).toBeInTheDocument();
    });

    it('should show project URL in plain text', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByText('https://test-project.supabase.co')).toBeInTheDocument();
    });

    it('should mask anon key by default', () => {
      render(<CredentialsModal {...defaultProps} />);

      const anonKeyElement = screen.getByTestId('credential-anonKey');
      expect(anonKeyElement).toHaveClass('masked');
      expect(anonKeyElement).toHaveTextContent('•');
    });

    it('should show project name', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByText('test-project')).toBeInTheDocument();
    });

    it('should show migration name', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByText('initial_migration')).toBeInTheDocument();
    });
  });

  describe('Visibility Toggle', () => {
    it('should have toggle button for anon key', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByTestId('toggle-anonKey')).toBeInTheDocument();
    });

    it('should reveal anon key when toggle clicked', () => {
      render(<CredentialsModal {...defaultProps} />);

      const toggleButton = screen.getByTestId('toggle-anonKey');
      fireEvent.click(toggleButton);

      const anonKeyElement = screen.getByTestId('credential-anonKey');
      expect(anonKeyElement).not.toHaveClass('masked');
    });

    it('should hide anon key when toggle clicked again', () => {
      render(<CredentialsModal {...defaultProps} />);

      const toggleButton = screen.getByTestId('toggle-anonKey');

      // Show
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('credential-anonKey')).not.toHaveClass('masked');

      // Hide
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('credential-anonKey')).toHaveClass('masked');
    });
  });

  describe('Copy to Clipboard', () => {
    it('should have copy buttons for all credentials', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByTestId('copy-projectUrl')).toBeInTheDocument();
      expect(screen.getByTestId('copy-anonKey')).toBeInTheDocument();
      expect(screen.getByTestId('copy-projectName')).toBeInTheDocument();
      expect(screen.getByTestId('copy-migrationName')).toBeInTheDocument();
    });

    it('should copy value to clipboard when copy button clicked', async () => {
      render(<CredentialsModal {...defaultProps} />);

      const copyButton = screen.getByTestId('copy-projectUrl');
      fireEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        'https://test-project.supabase.co'
      );
    });

    it('should show check icon after successful copy', async () => {
      render(<CredentialsModal {...defaultProps} />);

      const copyButton = screen.getByTestId('copy-projectUrl');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByTestId('icon-check')).toBeInTheDocument();
      });
    });
  });

  describe('Supabase Dashboard Link', () => {
    it('should have link to Supabase dashboard', () => {
      render(<CredentialsModal {...defaultProps} />);

      const link = screen.getByTestId('btn-open-supabase');
      expect(link).toHaveAttribute('href', 'https://test-project.supabase.co');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Setup Instructions', () => {
    it('should display setup instructions', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByText('Next Steps')).toBeInTheDocument();
      expect(
        screen.getByText(/Copy your Project URL and Anonymous Key/)
      ).toBeInTheDocument();
    });

    it('should show environment variable examples', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.getByText(/VITE_SUPABASE_URL/)).toBeInTheDocument();
      expect(screen.getByText(/VITE_SUPABASE_ANON_KEY/)).toBeInTheDocument();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button clicked', () => {
      const onClose = vi.fn();
      render(<CredentialsModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('icon-x').closest('button');
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when overlay clicked', () => {
      const onClose = vi.fn();
      render(<CredentialsModal {...defaultProps} onClose={onClose} />);

      const overlay = document.querySelector('.modal-overlay');
      if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when Done button clicked', () => {
      const onClose = vi.fn();
      render(<CredentialsModal {...defaultProps} onClose={onClose} />);

      fireEvent.click(screen.getByTestId('btn-done'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ===== Phase 3: Apply to Project Button Tests (RA-003, RA-005) =====

  describe('Apply to Project Button', () => {
    it('should render Apply to Project button when onApply is provided', () => {
      const onApply = vi.fn();
      render(<CredentialsModal {...defaultProps} onApply={onApply} />);

      expect(screen.getByTestId('btn-apply')).toBeInTheDocument();
    });

    it('should NOT render Apply button when onApply is not provided', () => {
      render(<CredentialsModal {...defaultProps} />);

      expect(screen.queryByTestId('btn-apply')).not.toBeInTheDocument();
    });

    it('should call onApply when Apply button is clicked', () => {
      const onApply = vi.fn();
      render(<CredentialsModal {...defaultProps} onApply={onApply} />);

      const applyButton = screen.getByTestId('btn-apply');
      fireEvent.click(applyButton);

      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it('should have Apply button enabled when isApplying is false or undefined', () => {
      const onApply = vi.fn();
      render(<CredentialsModal {...defaultProps} onApply={onApply} isApplying={false} />);

      const applyButton = screen.getByTestId('btn-apply') as HTMLButtonElement;
      expect(applyButton.disabled).toBe(false);
    });

    it('should have Apply button disabled when isApplying is true', () => {
      const onApply = vi.fn();
      render(<CredentialsModal {...defaultProps} onApply={onApply} isApplying={true} />);

      const applyButton = screen.getByTestId('btn-apply') as HTMLButtonElement;
      expect(applyButton.disabled).toBe(true);
    });

    it('should show loading spinner when isApplying is true', () => {
      const onApply = vi.fn();
      render(<CredentialsModal {...defaultProps} onApply={onApply} isApplying={true} />);

      // The button should have aria-busy attribute for accessibility
      const applyButton = screen.getByTestId('btn-apply');
      expect(applyButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should NOT have aria-busy when isApplying is false', () => {
      const onApply = vi.fn();
      render(<CredentialsModal {...defaultProps} onApply={onApply} isApplying={false} />);

      const applyButton = screen.getByTestId('btn-apply');
      expect(applyButton).not.toHaveAttribute('aria-busy', 'true');
    });
  });
});
