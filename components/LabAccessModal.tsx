import React, { useState } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';
import { GoogleGenAI } from '@google/genai';
import { GeminiModel } from '../types';

export default function LabAccessModal() {
  const [keyInput, setKeyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setApiKey } = useApiKey();

  const handleVerify = async () => {
    if (!keyInput.trim()) return;
    
    setIsVerifying(true);
    setError(null);

    try {
      // Simple verification call to Gemini using the pattern from geminiService.ts
      const ai = new GoogleGenAI({ apiKey: keyInput });
      const chat = ai.chats.create({
        model: GeminiModel.FLASH,
        config: { maxOutputTokens: 10 }
      });
      await chat.sendMessage({ message: "Ping" });
      
      // If successful, save the key
      setApiKey(keyInput);
    } catch (err: any) {
      console.error("Verification failed:", err);
      setError("Invalid API Key or connection error. Please verify and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(var(--color-bg-main))]/90 backdrop-blur-md">
      <div className="w-full max-w-md p-8 bg-surface border border-accent/30 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.2)]">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-indigo-500/10 mb-4 border border-indigo-500/20">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">Lab Access Required</h2>
          <p className="text-tertiary text-sm">
            To unlock the High-Performance Biomedical Laboratory, please provide your Google Gemini API Key.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-widest mb-1.5">
              Gemini API Key
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full px-4 py-3 bg-surface-hover border border-border rounded-xl text-primary focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-tertiary"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying || !keyInput}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Security...
              </>
            ) : (
              'Initialize Laboratory'
            )}
          </button>

          <div className="pt-4 text-center">
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
            >
              Don't have a key? Get one for free at Google AI Studio →
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-[10px] text-tertiary text-center uppercase tracking-widest">
          Client-Side Security Guaranteed • API Keys are never stored on servers
        </div>
      </div>
    </div>
  );
}
