/**
 * DeploySuccess Tests
 *
 * Tests the deploy success component:
 * - URL display
 * - Clickable link to deployed app
 * - Copy-to-clipboard button
 * - Deployment ID display
 * - Project name display
 *
 * @module components/deploy/__tests__
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import DeploySuccess from '../DeploySuccess';
import type { DeployResult } from '../../../hooks/deploy/types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <span data-testid="icon-external">ExternalLink</span>,
  Copy: () => <span data-testid="icon-copy">Copy</span>,
  Check: () => <span data-testid="icon-check">Check</span>,
  Rocket: () => <span data-testid="icon-rocket">Rocket</span>,
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('DeploySuccess', () => {
  const sampleResult: DeployResult = {
    url: 'https://my-awesome-app.vercel.app',
    deploymentId: 'dep_abc123xyz',
    projectName: 'my-awesome-app',
  };

  const defaultProps = {
    result: sampleResult,
    onDone: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render deploy success component', () => {
      render(<DeploySuccess {...defaultProps} />);

      expect(document.querySelector('[data-testid="deploy-success"]')).not.toBeNull();
    });

    it('should display the deployed URL', () => {
      render(<DeploySuccess {...defaultProps} />);

      expect(document.body.innerHTML).toContain('https://my-awesome-app.vercel.app');
    });

    it('should display the project name', () => {
      render(<DeploySuccess {...defaultProps} />);

      expect(document.body.innerHTML).toContain('my-awesome-app');
    });

    it('should display the deployment ID', () => {
      render(<DeploySuccess {...defaultProps} />);

      expect(document.body.innerHTML).toContain('dep_abc123xyz');
    });

    it('should render a clickable link to the deployed app', () => {
      render(<DeploySuccess {...defaultProps} />);

      const link = document.querySelector('[data-testid="deploy-url-link"]') as HTMLAnchorElement;
      expect(link).not.toBeNull();
      expect(link?.href).toBe('https://my-awesome-app.vercel.app/');
      expect(link?.target).toBe('_blank');
      expect(link?.rel).toContain('noopener');
    });
  });

  describe('Copy to Clipboard', () => {
    it('should render a copy button', () => {
      render(<DeploySuccess {...defaultProps} />);

      expect(document.querySelector('[data-testid="btn-copy-url"]')).not.toBeNull();
    });

    it('should copy URL to clipboard when copy button clicked', async () => {
      render(<DeploySuccess {...defaultProps} />);

      const copyBtn = document.querySelector('[data-testid="btn-copy-url"]') as HTMLElement;
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'https://my-awesome-app.vercel.app'
      );
    });

    it('should show copied feedback after clicking copy', async () => {
      render(<DeploySuccess {...defaultProps} />);

      const copyBtn = document.querySelector('[data-testid="btn-copy-url"]') as HTMLElement;
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // After copy, the button should show "Copied!" feedback
      expect(document.body.innerHTML).toContain('Copied');
    });
  });

  describe('Done Button', () => {
    it('should render a done button', () => {
      render(<DeploySuccess {...defaultProps} />);

      expect(document.querySelector('[data-testid="btn-done"]')).not.toBeNull();
    });

    it('should call onDone when done button clicked', () => {
      const onDone = vi.fn();
      render(<DeploySuccess {...defaultProps} onDone={onDone} />);

      const doneBtn = document.querySelector('[data-testid="btn-done"]') as HTMLElement;
      fireEvent.click(doneBtn);
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });
});
