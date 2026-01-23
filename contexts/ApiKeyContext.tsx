import React, { createContext, useContext, useState, useEffect } from 'react';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  isValid: boolean;
  clearApiKey: () => void;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export const ApiKeyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKeyInternal] = useState<string | null>(() => {
    return localStorage.getItem('primekg_gemini_api_key');
  });

  const [isValid, setIsValid] = useState<boolean>(!!apiKey);

  const setApiKey = (key: string) => {
    localStorage.setItem('primekg_gemini_api_key', key);
    setApiKeyInternal(key);
    setIsValid(true);
  };

  const clearApiKey = () => {
    localStorage.removeItem('primekg_gemini_api_key');
    setApiKeyInternal(null);
    setIsValid(false);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isValid, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = () => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};
