/**
 * Toast Component Tests
 * Phase 4 - Edge Cases & Error Handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast, Toast } from '../Toast';

// Test component to use the toast hook
function TestComponent() {
  const { showToast } = useToast();
  
  return (
    <div>
      <button 
        data-testid="btn-info" 
        onClick={() => showToast({ message: 'Info message', type: 'info' })}
      >
        Show Info
      </button>
      <button 
        data-testid="btn-error" 
        onClick={() => showToast({ message: 'Error message', type: 'error' })}
      >
        Show Error
      </button>
      <button 
        data-testid="btn-success" 
        onClick={() => showToast({ message: 'Success message', type: 'success' })}
      >
        Show Success
      </button>
    </div>
  );
}

describe('Toast System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ToastProvider', () => {
    it('should render children without crashing', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should provide useToast context', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByTestId('btn-info')).toBeInTheDocument();
    });
  });

  describe('showToast', () => {
    it('should display info toast with correct message', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-info'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should display error toast with correct message', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-error'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should display success toast with correct message', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-success'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should auto-dismiss toast after duration', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-info'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      expect(screen.getByText('Info message')).toBeInTheDocument();

      // Wait for the duration to pass (5000ms) plus the exit animation time (300ms)
      await act(async () => {
        vi.advanceTimersByTime(5000); // Duration
      });

      await act(async () => {
        vi.advanceTimersByTime(300); // Exit animation
      });

      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });

    it('should allow manual dismissal via close button', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-info'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();

      fireEvent.click(closeButton);

      await act(async () => {
        vi.advanceTimersByTime(300); // Animation time
      });

      expect(screen.queryByText('Info message')).not.toBeInTheDocument();
    });
  });

  describe('Toast component', () => {
    it('should render with error styling', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-error'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast-error');
    });

    it('should render with success styling', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-success'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast-success');
    });

    it('should render with info styling', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByTestId('btn-info'));

      await act(async () => {
        vi.advanceTimersByTime(0);
      });

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast-info');
    });
  });
});
