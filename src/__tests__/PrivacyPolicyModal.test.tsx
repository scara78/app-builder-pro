import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacyPolicyModal from '../components/privacy/PrivacyPolicyModal';

describe('PrivacyPolicyModal', () => {
  describe('rendering', () => {
    it('should render nothing when isOpen is false', () => {
      const { container } = render(<PrivacyPolicyModal isOpen={false} onClose={() => {}} />);

      expect(container.querySelector('[data-testid="privacy-modal-overlay"]')).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should render with dialog role and aria-label', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      const dialog = screen.getByRole('dialog', { name: /privacy policy/i });
      expect(dialog).toBeInTheDocument();
    });

    it('should render close button with aria-label', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render Close button in footer', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      // The footer has a button with text "Close"
      const closeButtons = screen.getAllByRole('button');
      const footerCloseButton = closeButtons.find((btn) => btn.textContent === 'Close');
      expect(footerCloseButton).not.toBeUndefined();
    });
  });

  describe('privacy content', () => {
    it('should render Introduction section', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    it('should render Information We Collect section', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Information We Collect')).toBeInTheDocument();
    });

    it('should render Data Security section', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Data Security')).toBeInTheDocument();
    });

    it('should render Your Rights section', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Your Rights')).toBeInTheDocument();
    });

    it('should render Cookie Policy section', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    });

    it('should render Contact Us section', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('should render GDPR rights text', () => {
      render(<PrivacyPolicyModal isOpen={true} onClose={() => {}} />);

      expect(screen.getByText(/GDPR and similar regulations/)).toBeInTheDocument();
    });
  });

  describe('close interactions', () => {
    it('should call onClose when close button (X) is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when footer Close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

      // The footer "Close" button is different from the X button
      const closeButtons = screen.getAllByRole('button');
      const footerCloseButton = closeButtons.find((btn) => btn.textContent === 'Close');
      await user.click(footerCloseButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

      const overlay = container.querySelector('[data-testid="privacy-modal-overlay"]');
      expect(overlay).not.toBeNull();
      await user.click(overlay!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onClose when modal content is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<PrivacyPolicyModal isOpen={true} onClose={onClose} />);

      const modalContent = container.querySelector('[data-testid="privacy-modal-content"]');
      expect(modalContent).not.toBeNull();
      await user.click(modalContent!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
