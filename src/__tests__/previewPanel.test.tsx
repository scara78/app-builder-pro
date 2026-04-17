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