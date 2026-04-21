import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CookieConsentBanner from '../CookieConsentBanner';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the consent banner', () => {
    render(<CookieConsentBanner onAccept={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('We value your privacy')).toBeInTheDocument();
  });

  it('displays Accept All and Reject buttons', () => {
    render(<CookieConsentBanner onAccept={vi.fn()} onReject={vi.fn()} />);

    const acceptButton = screen.getByTestId('cookie-accept');
    const rejectButton = screen.getByTestId('cookie-reject');

    expect(acceptButton).toBeInTheDocument();
    expect(acceptButton).toHaveTextContent('Accept All');
    expect(rejectButton).toBeInTheDocument();
    expect(rejectButton).toHaveTextContent('Reject Non-Essential');
  });

  it('calls onAccept when Accept All is clicked', () => {
    const onAccept = vi.fn();
    render(<CookieConsentBanner onAccept={onAccept} onReject={vi.fn()} />);

    const acceptButton = screen.getByTestId('cookie-accept');
    fireEvent.click(acceptButton);

    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onReject when Reject Non-Essential is clicked', () => {
    const onReject = vi.fn();
    render(<CookieConsentBanner onAccept={vi.fn()} onReject={onReject} />);

    const rejectButton = screen.getByTestId('cookie-reject');
    fireEvent.click(rejectButton);

    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('has privacy policy link button', () => {
    const onCustomize = vi.fn();
    render(<CookieConsentBanner onAccept={vi.fn()} onReject={vi.fn()} onCustomize={onCustomize} />);

    const privacyLink = screen.getByRole('button', { name: /Privacy Policy/i });
    expect(privacyLink).toBeInTheDocument();
  });

  it('calls onCustomize when privacy policy link is clicked', () => {
    const onCustomize = vi.fn();
    render(<CookieConsentBanner onAccept={vi.fn()} onReject={vi.fn()} onCustomize={onCustomize} />);

    const privacyLink = screen.getByRole('button', { name: /Privacy Policy/i });
    fireEvent.click(privacyLink);

    expect(onCustomize).toHaveBeenCalledTimes(1);
  });

  it('displays cookie usage explanation', () => {
    render(<CookieConsentBanner onAccept={vi.fn()} onReject={vi.fn()} />);

    expect(
      screen.getByText(/We use cookies to enhance your browsing experience/)
    ).toBeInTheDocument();
  });
});

// Storage tests in separate file to avoid mock conflicts
describe('Consent Storage Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getConsent returns null when no consent stored', async () => {
    const { getConsent } = await import('../../../utils/consentStorage');
    const result = getConsent();
    expect(result).toBeNull();
  });

  it('getConsent returns stored consent', async () => {
    const { getConsent } = await import('../../../utils/consentStorage');
    const storedConsent = {
      analytics: true,
      essential: true,
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem('app-consent-state', JSON.stringify(storedConsent));

    const result = getConsent();
    expect(result).not.toBeNull();
    expect(result?.analytics).toBe(true);
    expect(result?.essential).toBe(true);
    expect(result?.version).toBe(1);
  });

  it('setConsent saves consent to localStorage', async () => {
    const { setConsent, getConsent } = await import('../../../utils/consentStorage');
    setConsent({ analytics: true, timestamp: Date.now() });

    const stored = localStorage.getItem('app-consent-state');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.analytics).toBe(true);
    expect(parsed.essential).toBe(true);
    expect(parsed.version).toBe(1);
  });

  it('clearConsent removes consent from localStorage', async () => {
    const { clearConsent, getConsent } = await import('../../../utils/consentStorage');
    const storedConsent = {
      analytics: true,
      essential: true,
      timestamp: Date.now(),
      version: 1,
    };
    localStorage.setItem('app-consent-state', JSON.stringify(storedConsent));

    clearConsent();

    expect(localStorage.getItem('app-consent-state')).toBeNull();
  });

  it('getConsent returns null for invalid stored data', async () => {
    const { getConsent } = await import('../../../utils/consentStorage');
    localStorage.setItem('app-consent-state', 'invalid-json');

    const result = getConsent();
    expect(result).toBeNull();
  });

  it('getConsent returns null for missing required fields', async () => {
    const { getConsent } = await import('../../../utils/consentStorage');
    localStorage.setItem('app-consent-state', JSON.stringify({ analytics: true }));

    const result = getConsent();
    expect(result).toBeNull();
  });
});
