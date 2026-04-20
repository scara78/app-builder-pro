import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import { AppErrorBoundary } from '../components/common/AppErrorBoundary';

// Test helper component that throws during render
class ErrorTrigger extends Component<{ error: Error }> {
  override render(): ReactNode {
    throw this.props.error;
  }
}

// Test 1: No stack traces are shown in production
describe('AppErrorBoundary - security', () => {
  it('should NOT show technical error details or stack traces', () => {
    const errorWithStack = new Error('Network request failed');
    errorWithStack.stack =
      'Error: Network request failed\n    at Object.<anonymous> (C:\\fake\\file.ts:10:1)';

    expect(errorWithStack.stack).toContain('file.ts');

    // The component should never render the error.stack
    // Verify the implementation doesn't display stack
    const { container } = render(
      <AppErrorBoundary>
        <ErrorTrigger error={errorWithStack} />
      </AppErrorBoundary>
    );

    // Stack trace should NOT be in the DOM
    expect(container.innerHTML).not.toContain('file.ts');
    expect(container.innerHTML).not.toContain('at Object');
    expect(container.innerHTML).not.toContain('Error: Network');
  });

  // Test 2: Generic message is displayed
  it('should show user-friendly generic error message', () => {
    const networkError = new Error('fetch failed: network error');

    const { container } = render(
      <AppErrorBoundary>
        <ErrorTrigger error={networkError} />
      </AppErrorBoundary>
    );

    // Should show generic message, not technical
    expect(container.innerHTML).toContain('Network error');
    // Should NOT show technical error message
    expect(container.innerHTML).not.toContain('fetch failed');
  });

  // Test 3: Generic message for unknown errors
  it('should show generic message for unknown errors', () => {
    const unknownError = new Error('some random error xyz123');

    const { container } = render(
      <AppErrorBoundary>
        <ErrorTrigger error={unknownError} />
      </AppErrorBoundary>
    );

    // Should show generic fallback message for unknown errors
    expect(container.innerHTML).toContain('An unexpected error occurred');
  });

  // Test 4: Recovery action exists
  it('should provide a recovery action (retry button)', () => {
    const error = new Error('test error');

    const { container } = render(
      <AppErrorBoundary>
        <ErrorTrigger error={error} />
      </AppErrorBoundary>
    );

    // Should have a button
    expect(container.querySelector('button')).not.toBeNull();
    expect(container.innerHTML).toContain('Try Again');
  });

  // Test 5: Timeout error maps to generic message
  it('should show generic message for timeout errors', () => {
    const timeoutError = new Error('Request timed out after 30000ms');

    const { container } = render(
      <AppErrorBoundary>
        <ErrorTrigger error={timeoutError} />
      </AppErrorBoundary>
    );

    expect(container.innerHTML).toContain('Request timed out');
    expect(container.innerHTML).not.toContain('30000ms');
  });

  // Test 6: Auth error maps to generic message
  it('should show generic message for auth errors', () => {
    const authError = new Error('401 Unauthorized');

    const { container } = render(
      <AppErrorBoundary>
        <ErrorTrigger error={authError} />
      </AppErrorBoundary>
    );

    expect(container.innerHTML).toContain('Authentication failed');
    expect(container.innerHTML).not.toContain('401');
  });
});
