import { describe, it, expect } from 'vitest';
import type { ConsoleLogType, ConsoleLog } from '../index';

describe('ConsoleLog types', () => {
  it('ConsoleLogType should only accept valid log type values', () => {
    // Compile-time type check — these must be valid ConsoleLogType values
    const info: ConsoleLogType = 'info';
    const success: ConsoleLogType = 'success';
    const warn: ConsoleLogType = 'warn';
    const error: ConsoleLogType = 'error';

    // Runtime verification: all four values are valid
    const validTypes: string[] = [info, success, warn, error];
    expect(validTypes).toEqual(['info', 'success', 'warn', 'error']);
  });

  it('ConsoleLog interface should have type, text, and timestamp fields', () => {
    const log: ConsoleLog = {
      type: 'info',
      text: 'Test message',
      timestamp: '12:00:00',
    };

    expect(log.type).toBe('info');
    expect(log.text).toBe('Test message');
    expect(log.timestamp).toBe('12:00:00');
  });

  it('ConsoleLog type field accepts all ConsoleLogType values', () => {
    const logs: ConsoleLog[] = [
      { type: 'info', text: 'Info msg', timestamp: '10:00:00' },
      { type: 'success', text: 'Success msg', timestamp: '10:00:01' },
      { type: 'warn', text: 'Warn msg', timestamp: '10:00:02' },
      { type: 'error', text: 'Error msg', timestamp: '10:00:03' },
    ];

    expect(logs).toHaveLength(4);
    expect(logs.map((l) => l.type)).toEqual(['info', 'success', 'warn', 'error']);
  });
});
