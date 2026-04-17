import React, { createContext, useContext, useState, useEffect } from 'react';

export type AIModel = {
  id: string;
  name: string;
  description: string;
  isHighAvailability: boolean;
};

export const AVAILABLE_MODELS: AIModel[] = [
  { 
    id: 'gemini-2.0-flash', 
    name: 'Gemini 2.0 Flash', 
    description: 'Stable 2.0 model with excellent free tier availability.', 
    isHighAvailability: true 
  },
  { 
    id: 'gemini-2.5-flash-lite', 
    name: 'Gemini 2.5 Flash Lite', 
    description: 'Fastest & most budget-friendly. Great for simple apps.', 
    isHighAvailability: true 
  },
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: 'Next gen fast model, perfect for rapid app iteration.', 
    isHighAvailability: false 
  },
  { 
    id: 'gemini-2.5-pro', 
    name: 'Gemini 2.5 Pro', 
    description: 'Highest intelligence for complex coding logic.', 
    isHighAvailability: false 
  },
];

interface SettingsContextType {
  apiKey: string;
  modelId: string;
  setApiKey: (key: string) => void;
  setModelId: (id: string) => void;
  getEffectiveApiKey: () => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyState] = useState<string>(() => sessionStorage.getItem('app-builder-api-key') || '');
  const [modelId, setModelIdState] = useState<string>(() => {
    const saved = sessionStorage.getItem('app-builder-model-id');
    const isValid = AVAILABLE_MODELS.some(m => m.id === saved);
    return isValid && saved ? saved : 'gemini-2.0-flash';
  });

  useEffect(() => {
    sessionStorage.setItem('app-builder-api-key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    sessionStorage.setItem('app-builder-model-id', modelId);
  }, [modelId]);

  const setApiKey = (key: string) => setApiKeyState(key);
  const setModelId = (id: string) => setModelIdState(id);

  const getEffectiveApiKey = () => {
    return apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  };

  return (
    <SettingsContext.Provider value={{ apiKey, modelId, setApiKey, setModelId, getEffectiveApiKey }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
