import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import BuilderPage from './pages/BuilderPage';
import CookieConsentBanner from './components/privacy/CookieConsentBanner';
import { useCookieConsent } from './hooks/useCookieConsent';

function App() {
  const [activePage, setActivePage] = useState<'landing' | 'builder'>('landing');
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const { hasConsented, acceptAll, rejectNonEssential } = useCookieConsent();

  const handleStartBuild = (prompt: string) => {
    setInitialPrompt(prompt);
    setActivePage('builder');
  };

  return (
    <div className="app-container" data-testid="app-container">
      {activePage === 'landing' ? (
        <LandingPage onStartBuild={handleStartBuild} />
      ) : (
        <BuilderPage initialPrompt={initialPrompt} />
      )}
      {!hasConsented && <CookieConsentBanner onAccept={acceptAll} onReject={rejectNonEssential} />}
    </div>
  );
}

export default App;
