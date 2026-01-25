import React, { useState, useEffect } from 'react';
import { getBrowserFingerprint } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface RecoveryKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

const RecoveryKeyModal: React.FC<RecoveryKeyModalProps> = ({ isOpen, onClose, darkMode = false }) => {
  const [recoveryKey, setRecoveryKey] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [importKey, setImportKey] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const key = getBrowserFingerprint();
      setRecoveryKey(key);
      
      // Check if this is the first time showing the key
      const hasSeenKey = localStorage.getItem('primekg_has_seen_recovery_key');
      setIsFirstTime(!hasSeenKey);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey);
    toast.success('Recovery key copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    const data = {
      recoveryKey: recoveryKey,
      generatedAt: new Date().toISOString(),
      application: 'PrimeKG Precision Medicine Explorer',
      instructions: 'Keep this key safe. You can use it to restore your chat history if you clear your browser data.'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `primekg-recovery-key-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Recovery key downloaded!');
  };

  const handleImport = () => {
    if (!importKey.trim()) {
      toast.error('Please enter a recovery key');
      return;
    }

    // Validate format (basic check)
    if (!importKey.startsWith('fp_')) {
      toast.error('Invalid recovery key format');
      return;
    }

    // Store the imported key
    localStorage.setItem('primekg_fingerprint', importKey.trim());
    toast.success('Recovery key imported! Reloading to sync your chats...');
    
    // Reload the page to trigger data sync
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleMarkAsSeen = () => {
    localStorage.setItem('primekg_has_seen_recovery_key', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-700' 
          : 'bg-white border-gray-200'
      } animate-scale-in`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-2xl">vpn_key</span>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Recovery Key
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* First Time Warning */}
          {isFirstTime && (
            <div className={`p-4 rounded-xl border-2 ${
              darkMode 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-500 flex-shrink-0">warning</span>
                <div className="space-y-1">
                  <p className={`text-sm font-bold ${darkMode ? 'text-amber-400' : 'text-amber-900'}`}>
                    Important: Save This Key!
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-amber-300/80' : 'text-amber-800'}`}>
                    If you clear your browser data, you'll need this key to recover your chat history.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-surface/50 rounded-lg">
            <button
              onClick={() => setShowImport(false)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                !showImport
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              Export Key
            </button>
            <button
              onClick={() => setShowImport(true)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                showImport
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-secondary hover:text-foreground'
              }`}
            >
              Import Key
            </button>
          </div>

          {!showImport ? (
            /* Export View */
            <>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  Your Recovery Key
                </label>
                <div className={`p-4 rounded-xl font-mono text-sm break-all ${
                  darkMode 
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' 
                    : 'bg-gray-50 text-emerald-600 border border-gray-200'
                }`}>
                  {recoveryKey}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy Key
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    darkMode
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download JSON
                </button>
              </div>

              {/* Info */}
              <div className={`text-xs space-y-2 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">info</span>
                  <span>This key is stored in your browser's localStorage. Keep a backup in a safe place.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">security</span>
                  <span>Anyone with this key can access your chat history. Treat it like a password.</span>
                </p>
              </div>
            </>
          ) : (
            /* Import View */
            <>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${
                  darkMode ? 'text-zinc-400' : 'text-gray-600'
                }`}>
                  Paste Your Recovery Key
                </label>
                <textarea
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                  placeholder="fp_xxxxxxxxxx..."
                  className={`w-full h-24 px-4 py-3 rounded-xl font-mono text-sm resize-none ${
                    darkMode
                      ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  } border focus:ring-2 focus:ring-indigo-500/50 outline-none`}
                />
              </div>

              <button
                onClick={handleImport}
                disabled={!importKey.trim()}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  importKey.trim()
                    ? darkMode
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Import & Restore Chats
              </button>

              <div className={`text-xs space-y-2 ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] flex-shrink-0">info</span>
                  <span>After importing, the page will reload and sync your chats from the cloud.</span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {isFirstTime && !showImport && (
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-zinc-700' : 'border-gray-200'}`}>
            <button
              onClick={handleMarkAsSeen}
              className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                darkMode
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              I've saved my key, don't show this again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryKeyModal;
