import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { SettingsProvider } from './contexts/SettingsContext';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
