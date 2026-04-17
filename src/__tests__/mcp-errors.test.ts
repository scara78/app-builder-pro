import { describe, it, expect } from 'vitest';
import { MCPError, MCPNetworkError, MCPAuthError, MCPRateLimitError, MCPNotFoundError, MCPValidationError } from '../services/supabase/errors';

describe('MCPError', () => {
  it('should create error with code and message', () => {
    const error = new MCPAuthError('Authentication failed');
    expect(error.code).toBe('AUTH');
    expect(error.message).toBe('Authentication failed');
  });

  it('should include context in error', () => {
    const context = { timestamp: '2024-01-01', requestId: '123' };
    const error = new MCPNetworkError('Network error', 0, 3, context);
    expect(error.context).toEqual(context);
  });

  it('should be instance of Error', () => {
    const error = new MCPAuthError('Test error');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have name set to class name', () => {
    const error = new MCPAuthError('Test');
    expect(error.name).toBe('MCPAuthError');
  });
});

describe('MCPNetworkError', () => {
  it('should track retry count', () => {
    const error = new MCPNetworkError('Connection failed', 2, 3);
    expect(error.retryCount).toBe(2);
    expect(error.maxRetries).toBe(3);
  });

  it('should be retryable when under max', () => {
    const error = new MCPNetworkError('Connection failed', 1, 3);
    expect(error.isRetryable()).toBe(true);
  });

  it('should not be retryable when at max', () => {
    const error = new MCPNetworkError('Connection failed', 3, 3);
    expect(error.isRetryable()).toBe(false);
  });
});

describe('MCPAuthError', () => {
  it('should have AUTH code', () => {
    const error = new MCPAuthError('Invalid token');
    expect(error.code).toBe('AUTH');
  });

  it('should not be retryable', () => {
    const error = new MCPAuthError('Invalid token');
    expect(error.isRetryable()).toBe(false);
  });
});

describe('MCPRateLimitError', () => {
  it('should have RATE_LIMIT code', () => {
    const error = new MCPRateLimitError(60);
    expect(error.code).toBe('RATE_LIMIT');
    expect(error.retryAfter).toBe(60);
  });

  it('should return retryAfter value', () => {
    const error = new MCPRateLimitError(30);
    expect(error.getRetryAfter()).toBe(30);
  });
});

describe('MCPNotFoundError', () => {
  it('should have NOT_FOUND code', () => {
    const error = new MCPNotFoundError('project');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toContain('project');
  });
});

describe('MCPValidationError', () => {
  it('should have VALIDATION code and field', () => {
    const error = new MCPValidationError('Invalid email', 'email');
    expect(error.code).toBe('VALIDATION');
    expect(error.field).toBe('email');
  });
});