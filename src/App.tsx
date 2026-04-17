import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import BuilderPage from './pages/BuilderPage';

function App() {
  const [activePage, setActivePage] = useState<'landing' | 'builder'>('landing');
  const [initialPrompt, setInitialPrompt] = useState<string>('');

  const handleStartBuild = (prompt: string) => {
    setInitialPrompt(prompt);
    setActivePage('builder');
  };

  return (
    <div className="app-container">
      {activePage === 'landing' ? (
        <LandingPage onStartBuild={handleStartBuild} />
      ) : (
        <BuilderPage initialPrompt={initialPrompt} />
      )}
    </div>
  );
}

export default App;
