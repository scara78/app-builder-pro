import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PreviewPanel from '../components/preview/PreviewPanel';

describe('PreviewPanel', () => {
  it('should have sandbox="allow-scripts" on iframe', () => {
    const { container } = render(<PreviewPanel state="running" url="http://localhost:3000" />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
  });
});

describe('SEC-PS-003: Builder State Coverage', () => {
  it('TD-001: idle state shows empty state message', () => {
    const { container } = render(<PreviewPanel state="idle" />);
    expect(container.textContent).toContain('Your app will appear here');
  });

  it('TD-002: generating state shows Writing Code...', () => {
    const { container } = render(<PreviewPanel state="generating" />);
    expect(container.textContent).toContain('Writing Code...');
  });

  it('TD-003: installing state shows Installing Dependencies...', () => {
    const { container } = render(<PreviewPanel state="installing" />);
    expect(container.textContent).toContain('Installing Dependencies...');
  });

  it('TD-004: running state with url shows iframe with correct src', () => {
    const { container } = render(<PreviewPanel state="running" url="http://localhost:5173" />);
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('src')).toBe('http://localhost:5173');
  });
});

describe('SEC-PS-001: iframe Sandbox Security', () => {
  it('TD-005: sandbox does NOT include allow-top-navigation', () => {
    const { container } = render(<PreviewPanel state="running" url="http://localhost:3000" />);
    const sandbox = container.querySelector('iframe')?.getAttribute('sandbox');
    expect(sandbox).not.toContain('allow-top-navigation');
  });

  it('TD-006: sandbox does NOT include allow-same-origin', () => {
    const { container } = render(<PreviewPanel state="running" url="http://localhost:3000" />);
    const sandbox = container.querySelector('iframe')?.getAttribute('sandbox');
    expect(sandbox).not.toContain('allow-same-origin');
  });
});

describe('SEC-PS-002: Error State Handling', () => {
  it('TD-007: error state shows error message (not empty state)', () => {
    const { container } = render(<PreviewPanel state="error" />);
    expect(container.textContent).toContain('Unable to load preview');
    expect(container.textContent).not.toContain('Your app will appear here');
  });

  it('TD-008: error state does not show iframe', () => {
    const { container } = render(<PreviewPanel state="error" />);
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeNull();
  });
});
