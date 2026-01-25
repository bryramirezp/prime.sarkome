import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  darkMode?: boolean;
}

const STORAGE_KEY = 'primekg_gemini_api_key';

export const getStoredApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
};

export const setStoredApiKey = (key: string): void => {
  localStorage.setItem(STORAGE_KEY, key);
};

export const clearStoredApiKey = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, darkMode = false }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existingKey = getStoredApiKey();
      if (existingKey) {
        setApiKey(existingKey);
        setHasExistingKey(true);
      } else {
        setApiKey('');
        setHasExistingKey(false);
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      setStoredApiKey(apiKey.trim());
      onSave(apiKey.trim());
      onClose();
      window.location.reload();
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey('');
    setHasExistingKey(false);
    onSave('');
    onClose();
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
    >
      <div 
        className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in bg-surface border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-key text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold">Bring Your Own LLM</h2>
              <p className="text-indigo-100 text-sm">Set your Google Gemini API key</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Security Warning */}
          <div className={`border rounded-xl p-4 ${darkMode ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${darkMode ? 'bg-red-800' : 'bg-red-100'}`}>
                <i className={`fas fa-exclamation-triangle text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}></i>
              </div>
              <div>
                <h4 className={`font-semibold text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>⚠️ Security Warning</h4>
                <ul className={`text-xs mt-1 space-y-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                  <li>• <strong>Never share your API key</strong> with anyone</li>
                  <li>• Don't paste your key in untrusted websites</li>
                  <li>• Review your API usage regularly at Google Cloud Console</li>
                  <li>• Revoke and regenerate if you suspect it's compromised</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transparency Notice */}
          <div className={`border rounded-xl p-4 ${darkMode ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${darkMode ? 'bg-emerald-800' : 'bg-emerald-100'}`}>
                <i className={`fas fa-shield-alt text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}></i>
              </div>
              <div>
                <h4 className={`font-semibold text-sm ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>🔒 100% Private and Transparent</h4>
                <ul className={`text-xs mt-1 space-y-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  <li>• Your API key is stored <strong>only in your browser</strong> (localStorage)</li>
                  <li>• It is <strong>never</strong> sent to our servers</li>
                  <li>• Gemini calls go <strong>directly</strong> from your browser</li>
                  <li>• You can delete it anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className={`block text-sm font-semibold mb-2 text-secondary`}>
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono bg-[rgb(var(--color-input-bg))] border-[rgb(var(--color-input-border))] text-foreground placeholder-tertiary`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary`}
              >
                <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <p className={`text-xs mt-2 text-tertiary`}>
              <i className="fas fa-info-circle mr-1"></i>
              Get your key for free at{' '}
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Status */}
          {hasExistingKey && (
            <div className={`border rounded-xl p-3 flex items-center gap-2 ${darkMode ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
              <i className={`fas fa-check-circle ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}></i>
              <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>You already have an API key configured</span>
            </div>
          )}

          {/* Technical Details (collapsible) */}
          <details className={`rounded-xl border overflow-hidden bg-[rgb(var(--color-bg-main))] border-border`}>
            <summary className={`cursor-pointer px-4 py-3 text-sm font-medium flex items-center justify-between text-secondary hover:bg-surface-hover`}>
              <span><i className="fas fa-code mr-2"></i>Technical details</span>
              <i className={`fas fa-chevron-down text-tertiary`}></i>
            </summary>
            <div className={`px-4 pb-4 text-xs space-y-2 font-mono text-tertiary`}>
              <p>• Storage: <code className={`px-1 rounded bg-surface`}>localStorage['primekg_gemini_api_key']</code></p>
              <p>• Endpoint: <code className={`px-1 rounded bg-surface`}>generativelanguage.googleapis.com</code></p>
              <p>• Models: Gemini 3.0 Flash / Pro</p>
              <p>• Code is open source—verify anytime</p>
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className={`px-6 py-4 flex items-center justify-between border-t bg-[rgb(var(--color-bg-main))] border-border`}>
          <div>
            {hasExistingKey && (
              <button
                onClick={handleClear}
                className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1"
              >
                <i className="fas fa-trash-alt"></i>
                Delete my key
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-secondary hover:bg-surface-hover`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className={`px-5 py-2 text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ${apiKey.trim() ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-surface-hover text-tertiary'} text-white`}
            >
              <i className="fas fa-save"></i>
              Save in my browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
