import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsolePanel from '../components/common/ConsolePanel';
import type { ConsoleLog } from '../types';

const mockLogs: ConsoleLog[] = [
  { type: 'info', text: 'Starting server...', timestamp: '10:00:00' },
  { type: 'success', text: 'added 42 packages', timestamp: '10:00:01' },
  { type: 'warn', text: 'npm warn deprecated foo', timestamp: '10:00:02' },
  { type: 'error', text: 'Error: Cannot find module', timestamp: '10:00:03' },
];

describe('ConsolePanel', () => {
  describe('header rendering', () => {
    it('should render "Output Console" title', () => {
      render(<ConsolePanel logs={mockLogs} />);
      expect(screen.getByText('Output Console')).toBeInTheDocument();
    });

    it('should render Clear Logs button', () => {
      render(<ConsolePanel logs={mockLogs} />);
      expect(screen.getByTitle('Clear Logs')).toBeInTheDocument();
    });

    it('should render Close Console button', () => {
      render(<ConsolePanel logs={mockLogs} />);
      expect(screen.getByTitle('Close Console')).toBeInTheDocument();
    });

    it('should render console-panel container', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      expect(container.querySelector('[data-testid="console-panel"]')).not.toBeNull();
    });

    it('should render console-header', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      expect(container.querySelector('[data-testid="console-header"]')).not.toBeNull();
    });

    it('should render console-actions', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      expect(container.querySelector('[data-testid="console-actions"]')).not.toBeNull();
    });
  });

  describe('logs rendering', () => {
    it('should render custom logs when provided', () => {
      render(<ConsolePanel logs={mockLogs} />);
      expect(screen.getByText('Starting server...')).toBeInTheDocument();
      expect(screen.getByText('added 42 packages')).toBeInTheDocument();
    });

    it('should render error type data-attribute for error logs', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      const errorEntry = container.querySelector('[data-testid="log-entry"][data-type="error"]');
      expect(errorEntry).not.toBeNull();
    });

    it('should render warn type data-attribute for warning logs', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      const warnEntry = container.querySelector('[data-testid="log-entry"][data-type="warn"]');
      expect(warnEntry).not.toBeNull();
    });

    it('should render success type data-attribute for success logs', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      const successEntry = container.querySelector(
        '[data-testid="log-entry"][data-type="success"]'
      );
      expect(successEntry).not.toBeNull();
    });

    it('should render info type data-attribute for info logs', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      const infoEntry = container.querySelector('[data-testid="log-entry"][data-type="info"]');
      expect(infoEntry).not.toBeNull();
    });

    it('should render empty console when logs array is empty', () => {
      const { container } = render(<ConsolePanel logs={[]} />);
      const logEntries = container.querySelectorAll('[data-testid="log-entry"]');
      expect(logEntries).toHaveLength(0);
    });

    it('should render timestamps in brackets for logs', () => {
      render(<ConsolePanel logs={mockLogs} />);
      expect(screen.getByText(/\[10:00:00\]/)).toBeInTheDocument();
    });

    it('should render log-time and log-text spans in each entry', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      expect(container.querySelector('[data-testid="log-time"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="log-text"]')).not.toBeNull();
    });

    it('should render all four log type entries', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      expect(
        container.querySelectorAll('[data-testid="log-entry"][data-type="info"]')
      ).toHaveLength(1);
      expect(
        container.querySelectorAll('[data-testid="log-entry"][data-type="success"]')
      ).toHaveLength(1);
      expect(
        container.querySelectorAll('[data-testid="log-entry"][data-type="warn"]')
      ).toHaveLength(1);
      expect(
        container.querySelectorAll('[data-testid="log-entry"][data-type="error"]')
      ).toHaveLength(1);
    });
  });

  describe('onClear callback', () => {
    it('calls onClear when Clear button is clicked', async () => {
      const onClear = vi.fn();
      const user = userEvent.setup();
      render(<ConsolePanel logs={mockLogs} onClear={onClear} />);
      await user.click(screen.getByTestId('clear-button'));
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('does not crash when onClear is not provided', async () => {
      const user = userEvent.setup();
      render(<ConsolePanel logs={mockLogs} />);
      await user.click(screen.getByTestId('clear-button'));
    });
  });

  describe('onClose and collapsed state', () => {
    it('calls onClose and collapses when Close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<ConsolePanel logs={mockLogs} onClose={onClose} />);
      await user.click(screen.getByTestId('close-button'));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(container.querySelector('[data-testid="console-collapsed"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="console-panel"]')).toBeNull();
    });

    it('shows truncated last log text in collapsed bar', async () => {
      const user = userEvent.setup();
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      await user.click(screen.getByTestId('close-button'));
      const preview = container.querySelector('[data-testid="collapsed-preview"]');
      expect(preview?.textContent).toBe('Error: Cannot find module');
    });

    it('shows "No output yet" in collapsed bar when logs are empty', async () => {
      const user = userEvent.setup();
      render(<ConsolePanel logs={[]} />);
      await user.click(screen.getByTestId('close-button'));
      expect(screen.getByText('No output yet')).toBeInTheDocument();
    });

    it('re-expands when collapsed bar is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      await user.click(screen.getByTestId('close-button'));
      expect(container.querySelector('[data-testid="console-collapsed"]')).not.toBeNull();
      await user.click(screen.getByTestId('console-collapsed'));
      expect(container.querySelector('[data-testid="console-panel"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="console-collapsed"]')).toBeNull();
    });
  });

  describe('auto-scroll behavior', () => {
    it('scrolls to bottom when new logs arrive and already at bottom', () => {
      const { container, rerender } = render(<ConsolePanel logs={mockLogs} />);
      const contentEl = container.querySelector(
        '[data-testid="console-content"]'
      ) as HTMLDivElement;
      Object.defineProperty(contentEl, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(contentEl, 'scrollTop', {
        value: 980,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(contentEl, 'clientHeight', { value: 200, configurable: true });

      const newLogs = [
        ...mockLogs,
        { type: 'info' as const, text: 'New log', timestamp: '10:00:04' },
      ];
      rerender(<ConsolePanel logs={newLogs} />);
      expect(contentEl.scrollTop).toBe(1000);
    });

    it('does NOT scroll when user has scrolled up', () => {
      const { container, rerender } = render(<ConsolePanel logs={mockLogs} />);
      const contentEl = container.querySelector(
        '[data-testid="console-content"]'
      ) as HTMLDivElement;
      Object.defineProperty(contentEl, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(contentEl, 'scrollTop', { value: 100, configurable: true });
      Object.defineProperty(contentEl, 'clientHeight', { value: 200, configurable: true });

      contentEl.dispatchEvent(new Event('scroll'));

      const newLogs = [
        ...mockLogs,
        { type: 'info' as const, text: 'New log', timestamp: '10:00:04' },
      ];
      rerender(<ConsolePanel logs={newLogs} />);
      expect(contentEl.scrollTop).toBe(100);
    });

    it('resumes auto-scroll when user scrolls back to bottom', () => {
      const { container, rerender } = render(<ConsolePanel logs={mockLogs} />);
      const contentEl = container.querySelector(
        '[data-testid="console-content"]'
      ) as HTMLDivElement;

      // First: user scrolls up — auto-scroll pauses
      Object.defineProperty(contentEl, 'scrollHeight', { value: 1000, configurable: true });
      Object.defineProperty(contentEl, 'scrollTop', {
        value: 100,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(contentEl, 'clientHeight', { value: 200, configurable: true });
      contentEl.dispatchEvent(new Event('scroll'));

      // New log arrives while scrolled up — should NOT auto-scroll
      let newLogs = [
        ...mockLogs,
        { type: 'info' as const, text: 'Log while away', timestamp: '10:00:04' },
      ];
      rerender(<ConsolePanel logs={newLogs} />);
      expect(contentEl.scrollTop).toBe(100);

      // Now: user scrolls back to bottom — auto-scroll resumes
      Object.defineProperty(contentEl, 'scrollTop', {
        value: 800,
        writable: true,
        configurable: true,
      });
      contentEl.dispatchEvent(new Event('scroll'));

      // New log arrives while at bottom — SHOULD auto-scroll
      newLogs = [
        ...newLogs,
        { type: 'info' as const, text: 'Log after return', timestamp: '10:00:05' },
      ];
      rerender(<ConsolePanel logs={newLogs} />);
      expect(contentEl.scrollTop).toBe(1000);
    });
  });

  describe('button interactions', () => {
    it('should render Clear Logs and Close Console as buttons', () => {
      render(<ConsolePanel logs={mockLogs} />);
      const clearButton = screen.getByTitle('Clear Logs');
      const closeButton = screen.getByTitle('Close Console');
      expect(clearButton.tagName).toBe('BUTTON');
      expect(closeButton.tagName).toBe('BUTTON');
    });

    it('should render divider between action buttons', () => {
      const { container } = render(<ConsolePanel logs={mockLogs} />);
      const divider = container.querySelector('[data-testid="divider-v"]');
      expect(divider).not.toBeNull();
    });
  });
});
