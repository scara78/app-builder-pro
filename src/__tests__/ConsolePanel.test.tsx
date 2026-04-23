import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsolePanel from '../components/common/ConsolePanel';

describe('ConsolePanel', () => {
  describe('header rendering', () => {
    it('should render "Output Console" title', () => {
      render(<ConsolePanel />);

      expect(screen.getByText('Output Console')).toBeInTheDocument();
    });

    it('should render Clear Logs button', () => {
      render(<ConsolePanel />);

      expect(screen.getByTitle('Clear Logs')).toBeInTheDocument();
    });

    it('should render Close Console button', () => {
      render(<ConsolePanel />);

      expect(screen.getByTitle('Close Console')).toBeInTheDocument();
    });

    it('should render console-panel container', () => {
      const { container } = render(<ConsolePanel />);

      expect(container.querySelector('[data-testid="console-panel"]')).not.toBeNull();
    });

    it('should render console-header', () => {
      const { container } = render(<ConsolePanel />);

      expect(container.querySelector('[data-testid="console-header"]')).not.toBeNull();
    });

    it('should render console-actions', () => {
      const { container } = render(<ConsolePanel />);

      expect(container.querySelector('[data-testid="console-actions"]')).not.toBeNull();
    });
  });

  describe('default logs rendering', () => {
    it('should render default logs when no logs prop provided', () => {
      render(<ConsolePanel />);

      expect(screen.getByText('Initializing WebContainer core...')).toBeInTheDocument();
      expect(screen.getByText('WebContainer process ready.')).toBeInTheDocument();
    });

    it('should render timestamps for each log entry', () => {
      render(<ConsolePanel />);

      expect(screen.getByText(/\[09:42:01\]/)).toBeInTheDocument();
      expect(screen.getByText(/\[09:42:03\]/)).toBeInTheDocument();
    });

    it('should render default logs with correct log type classes', () => {
      const { container } = render(<ConsolePanel />);

      const infoEntries = container.querySelectorAll('[data-testid="log-entry"][data-type="info"]');
      const successEntries = container.querySelectorAll(
        '[data-testid="log-entry"][data-type="success"]'
      );
      const warnEntries = container.querySelectorAll('[data-testid="log-entry"][data-type="warn"]');

      expect(infoEntries.length).toBeGreaterThan(0);
      expect(successEntries.length).toBeGreaterThan(0);
      expect(warnEntries.length).toBeGreaterThan(0);
    });
  });

  describe('custom logs rendering', () => {
    it('should render custom logs when provided', () => {
      const customLogs = [
        { type: 'info' as const, text: 'Custom info message', timestamp: '10:00:00' },
        { type: 'error' as const, text: 'Custom error message', timestamp: '10:00:01' },
      ];

      render(<ConsolePanel logs={customLogs} />);

      expect(screen.getByText('Custom info message')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('should render error type CSS class for error logs', () => {
      const customLogs = [
        { type: 'error' as const, text: 'Something went wrong', timestamp: '10:00:00' },
      ];

      const { container } = render(<ConsolePanel logs={customLogs} />);

      const errorEntry = container.querySelector('[data-testid="log-entry"][data-type="error"]');
      expect(errorEntry).not.toBeNull();
    });

    it('should render warn type CSS class for warning logs', () => {
      const customLogs = [
        { type: 'warn' as const, text: 'Deprecation warning', timestamp: '10:00:00' },
      ];

      const { container } = render(<ConsolePanel logs={customLogs} />);

      const warnEntry = container.querySelector('[data-testid="log-entry"][data-type="warn"]');
      expect(warnEntry).not.toBeNull();
    });

    it('should render success type CSS class for success logs', () => {
      const customLogs = [
        { type: 'success' as const, text: 'Build complete', timestamp: '10:00:00' },
      ];

      const { container } = render(<ConsolePanel logs={customLogs} />);

      const successEntry = container.querySelector(
        '[data-testid="log-entry"][data-type="success"]'
      );
      expect(successEntry).not.toBeNull();
    });

    it('should render info type CSS class for info logs', () => {
      const customLogs = [
        { type: 'info' as const, text: 'Starting server', timestamp: '10:00:00' },
      ];

      const { container } = render(<ConsolePanel logs={customLogs} />);

      const infoEntry = container.querySelector('[data-testid="log-entry"][data-type="info"]');
      expect(infoEntry).not.toBeNull();
    });

    it('should render empty console when logs array is empty', () => {
      const { container } = render(<ConsolePanel logs={[]} />);

      const logEntries = container.querySelectorAll('[data-testid="log-entry"]');
      expect(logEntries).toHaveLength(0);
    });

    it('should render timestamps in brackets for custom logs', () => {
      const customLogs = [{ type: 'info' as const, text: 'Test message', timestamp: '12:34:56' }];

      render(<ConsolePanel logs={customLogs} />);

      expect(screen.getByText(/\[12:34:56\]/)).toBeInTheDocument();
    });
  });

  describe('log entry structure', () => {
    it('should render log-time and log-text spans in each entry', () => {
      const customLogs = [{ type: 'info' as const, text: 'Test message', timestamp: '12:00:00' }];

      const { container } = render(<ConsolePanel logs={customLogs} />);

      const logTime = container.querySelector('[data-testid="log-time"]');
      const logText = container.querySelector('[data-testid="log-text"]');

      expect(logTime).not.toBeNull();
      expect(logText).not.toBeNull();
    });

    it('should render all four log type entries', () => {
      const customLogs = [
        { type: 'info' as const, text: 'Info log', timestamp: '10:00:00' },
        { type: 'success' as const, text: 'Success log', timestamp: '10:00:01' },
        { type: 'warn' as const, text: 'Warn log', timestamp: '10:00:02' },
        { type: 'error' as const, text: 'Error log', timestamp: '10:00:03' },
      ];

      const { container } = render(<ConsolePanel logs={customLogs} />);

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

  describe('button interactions', () => {
    it('should render Clear Logs and Close Console as buttons', () => {
      render(<ConsolePanel />);

      const clearButton = screen.getByTitle('Clear Logs');
      const closeButton = screen.getByTitle('Close Console');

      expect(clearButton.tagName).toBe('BUTTON');
      expect(closeButton.tagName).toBe('BUTTON');
    });

    it('should render divider between action buttons', () => {
      const { container } = render(<ConsolePanel />);

      const divider = container.querySelector('[data-testid="divider-v"]');
      expect(divider).not.toBeNull();
    });
  });
});
