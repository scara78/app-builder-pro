/**
 * TopBar Tests - Create Backend Button
 * Phase 5 - TopBar Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import TopBar from '../TopBar';
import type { BuilderState } from '../../../types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sparkles: () => <span data-testid="icon-sparkles">Sparkles</span>,
  Share2: () => <span data-testid="icon-share">Share</span>,
  Play: () => <span data-testid="icon-play">Play</span>,
  Settings: () => <span data-testid="icon-settings">Settings</span>,
  ChevronDown: () => <span data-testid="icon-chevron">Chevron</span>,
  Rocket: () => <span data-testid="icon-rocket">Rocket</span>,
  Database: () => <span data-testid="icon-database">Database</span>,
  Loader2: () => <span data-testid="icon-loader">Loader</span>,
}));

// Mock QuotaStatus component
vi.mock('../QuotaStatus', () => ({
  QuotaStatus: () => <div data-testid="quota-status">Quota</div>,
}));

describe('TopBar', () => {
  const defaultProps = {
    projectName: 'Test Project',
    state: 'idle' as BuilderState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Backend Button - Disabled States', () => {
    it('should be disabled when no code has been generated (hasGeneratedCode=false)', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={false}
          hasOAuthToken={true}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('title')).toBe('Generate code first');
    });

    it('should be disabled when no OAuth token (hasOAuthToken=false)', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={false}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('title')).toBe('Login with Supabase');
    });

    it('should prioritize "no code" message over "no OAuth" when both conditions are true', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={false}
          hasOAuthToken={false}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      // "Generate code first" takes precedence over "Login with Supabase"
      expect(button.getAttribute('title')).toBe('Generate code first');
    });
  });

  describe('Create Backend Button - Enabled State', () => {
    it('should be enabled when code exists AND OAuth token exists', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={true}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button).not.toBeNull();
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('title')).toBe('Create Supabase backend');
    });
  });

  describe('Create Backend Button - Loading State', () => {
    it('should show spinner and "Creating..." text when isCreatingBackend=true', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={true}
          isCreatingBackend={true}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button).not.toBeNull();
      
      // Check for loading class
      expect(button.className).toContain('loading');
      
      // Check for spinner icon (Loader2)
      const spinner = button.querySelector('[data-testid="icon-loader"]');
      expect(spinner).not.toBeNull();
      
      // Check for "Creating..." text
      expect(button.textContent).toContain('Creating...');
    });

    it('should be disabled while creating backend', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={true}
          isCreatingBackend={true}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should show correct tooltip while creating', () => {
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={true}
          isCreatingBackend={true}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button.getAttribute('title')).toBe('Creating backend...');
    });
  });

  describe('Create Backend Button - Click Handler', () => {
    it('should call onCreateBackend callback when button is clicked', () => {
      const onCreateBackend = vi.fn();
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={true}
          onCreateBackend={onCreateBackend}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      fireEvent.click(button);
      
      expect(onCreateBackend).toHaveBeenCalledTimes(1);
    });

    it('should not call onCreateBackend when button is disabled (no code)', () => {
      const onCreateBackend = vi.fn();
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={false}
          hasOAuthToken={true}
          onCreateBackend={onCreateBackend}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      fireEvent.click(button);
      
      expect(onCreateBackend).not.toHaveBeenCalled();
    });

    it('should not call onCreateBackend when button is disabled (no OAuth)', () => {
      const onCreateBackend = vi.fn();
      render(
        <TopBar
          {...defaultProps}
          hasGeneratedCode={true}
          hasOAuthToken={false}
          onCreateBackend={onCreateBackend}
        />
      );

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      fireEvent.click(button);
      
      expect(onCreateBackend).not.toHaveBeenCalled();
    });
  });

  describe('Create Backend Button - Default Props', () => {
    it('should have correct defaults when optional props not provided', () => {
      render(<TopBar {...defaultProps} />);

      const button = document.querySelector('[data-testid="btn-create-backend"]') as HTMLButtonElement;
      expect(button).not.toBeNull();
      // Default: hasGeneratedCode=false, hasOAuthToken=false
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('title')).toBe('Generate code first');
    });
  });
});
