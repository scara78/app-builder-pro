/**
 * Consent Storage Utility
 * Phase 4 - Privacy Controls
 *
 * Provides localStorage abstraction for managing user consent state
 * including analytics preferences and timestamp for GDPR compliance.
 */

/**
 * Consent state structure stored in localStorage
 */
export interface ConsentState {
  analytics: boolean;
  essential: true;
  timestamp: number;
  version: 1;
}

/**
 * LocalStorage key for consent state
 */
const STORAGE_KEY = 'app-consent-state';

/**
 * Retrieves the stored consent state from localStorage
 * @returns ConsentState if found, null if not set or invalid
 */
export function getConsent(): ConsentState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as ConsentState;

    // Validate required fields
    if (
      typeof parsed.analytics !== 'boolean' ||
      parsed.essential !== true ||
      typeof parsed.timestamp !== 'number' ||
      parsed.version !== 1
    ) {
      return null;
    }

    return parsed;
  } catch {
    // If parsing fails, return null
    return null;
  }
}

/**
 * Saves consent state to localStorage
 * @param state - Consent state without essential (always true) and version (always 1)
 */
export function setConsent(state: Omit<ConsentState, 'essential' | 'version'>): void {
  const consentState: ConsentState = {
    analytics: state.analytics,
    essential: true,
    timestamp: state.timestamp,
    version: 1,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentState));
  } catch {
    // localStorage might be full or disabled - fail silently
    console.warn('Failed to save consent state to localStorage');
  }
}

/**
 * Removes consent state from localStorage
 */
export function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('Failed to clear consent state from localStorage');
  }
}
