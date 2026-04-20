import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

vi.mock('framer-motion', () => ({ motion: { div: 'div' } }));
vi.mock('../components/settings/SettingsModal', () => ({ default: () => null }));
vi.mock('../hooks/useWebContainer', () => ({ useWebContainer: () => ({}) }));
vi.mock('../hooks/useAIBuilder', () => ({ useAIBuilder: () => ({}) }));
vi.mock('../contexts/SettingsContext', () => ({ useSettings: () => ({}) }));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app-container')).not.toBeNull();
  });

  it('shows LandingPage by default', () => {
    render(<App />);
    expect(document.querySelector('.landing-container')).not.toBeNull();
  });

  it('shows landing header', () => {
    render(<App />);
    expect(document.querySelector('.landing-header')).not.toBeNull();
  });

  it('shows landing main content', () => {
    render(<App />);
    expect(document.querySelector('.landing-main')).not.toBeNull();
  });

  it('contains prompt input', () => {
    render(<App />);
    expect(document.querySelector('.prompt-input-wrapper input')).not.toBeNull();
  });

  it('contains build button', () => {
    render(<App />);
    expect(document.querySelector('.btn-primary')).not.toBeNull();
  });

  it('contains feature grid', () => {
    render(<App />);
    expect(document.querySelector('.feature-grid')).not.toBeNull();
  });
});