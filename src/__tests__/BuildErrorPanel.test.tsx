import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BuildErrorPanel from '../components/common/BuildErrorPanel';

describe('BuildErrorPanel', () => {
  it('should render message and retry button', () => {
    const mockRetry = vi.fn();
    render(<BuildErrorPanel message="Test error" onRetry={mockRetry} />);

    // Panel container is present
    expect(screen.getByTestId('build-error-panel')).toBeInTheDocument();

    // Error message is displayed
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Retry button is present
    expect(screen.getByTestId('error-retry-btn')).toBeInTheDocument();

    // Clicking retry calls onRetry
    fireEvent.click(screen.getByTestId('error-retry-btn'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
