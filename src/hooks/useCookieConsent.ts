/**
 * Cookie Consent Hook
 * Phase 4 - Privacy Controls
 *
 * React hook for managing cookie consent state with hooks pattern following useSupabase.
 * @param externalConsent - Optional consent state for dependency injection in tests
 */

import { useState, useCallback, useEffect } from 'react';
import { getConsent, setConsent, clearConsent, type ConsentState } from '../utils/consentStorage';

/**
 * Consent type values
 */
export type ConsentType = 'accepted' | 'rejected' | null;

/**
 * Return value from useCookieConsent hook
 */
export interface UseCookieConsentReturn {
  hasConsented: boolean;
  consentType: ConsentType;
  analyticsEnabled: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  clearConsentChoice: () => void;
}

/**
 * Hook to manage cookie consent state
 * @param externalConsent - Optional consent state for testing/mocking
 */
export function useCookieConsent(externalConsent?: ConsentState | null): UseCookieConsentReturn {
  const [consentState, setConsentState] = useState<ConsentState | null>(() => {
    // Use external consent if provided (for testing)
    if (externalConsent !== undefined) {
      return externalConsent;
    }
    // Otherwise, load from storage
    return getConsent();
  });

  // Determine if user has consented
  const hasConsented = consentState !== null;
  const consentType: ConsentType = consentState
    ? consentState.analytics
      ? 'accepted'
      : 'rejected'
    : null;

  // Check if analytics is enabled based on consent
  const analyticsEnabled = consentState?.analytics ?? false;

  /**
   * Accept all cookies - enable analytics
   */
  const acceptAll = useCallback(() => {
    const newConsent = {
      analytics: true,
      timestamp: Date.now(),
    };
    setConsent(newConsent);
    setConsentState({
      ...newConsent,
      essential: true,
      version: 1,
    });
  }, []);

  /**
   * Reject non-essential cookies
   */
  const rejectNonEssential = useCallback(() => {
    const newConsent = {
      analytics: false,
      timestamp: Date.now(),
    };
    setConsent(newConsent);
    setConsentState({
      ...newConsent,
      essential: true,
      version: 1,
    });
  }, []);

  /**
   * Clear consent choice - reset to no consent
   */
  const clearConsentChoice = useCallback(() => {
    clearConsent();
    setConsentState(null);
  }, []);

  // If externalConsent changes, update state (for testing)
  useEffect(() => {
    if (externalConsent !== undefined) {
      setConsentState(externalConsent);
    }
  }, [externalConsent]);

  return {
    hasConsented,
    consentType,
    analyticsEnabled,
    acceptAll,
    rejectNonEssential,
    clearConsentChoice,
  };
}
