/**
 * Cookie Consent Banner Component
 * Phase 4 - Privacy Controls
 *
 * Displays cookie consent options on first visit.
 * Follows Toast component patterns with standalone CSS.
 */

import React from 'react';
import { Shield } from 'lucide-react';
import './CookieConsentBanner.css';

export interface CookieConsentBannerProps {
  /** Callback when user accepts all cookies */
  onAccept?: () => void;
  /** Callback when user rejects non-essential cookies */
  onReject?: () => void;
  /** Callback to open customization (optional) */
  onCustomize?: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onAccept,
  onReject,
  onCustomize,
}) => {
  return (
    <div className="cookie-consent-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-consent-icon">
        <Shield size={24} />
      </div>
      <div className="cookie-consent-content">
        <h3 className="cookie-consent-title">We value your privacy</h3>
        <p className="cookie-consent-text">
          We use cookies to enhance your browsing experience, serve personalized content, and
          analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of
          cookies.{' '}
          <button type="button" className="cookie-consent-link" onClick={onCustomize}>
            Read our Privacy Policy
          </button>
        </p>
      </div>
      <div className="cookie-consent-actions">
        <button
          type="button"
          className="cookie-btn cookie-btn-secondary"
          onClick={onReject}
          data-testid="cookie-reject"
        >
          Reject Non-Essential
        </button>
        <button
          type="button"
          className="cookie-btn cookie-btn-primary"
          onClick={onAccept}
          data-testid="cookie-accept"
        >
          Accept All
        </button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
