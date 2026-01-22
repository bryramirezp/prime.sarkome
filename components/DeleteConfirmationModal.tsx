import React, { useEffect } from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  darkMode?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Chat",
  description = "Are you sure you want to delete this conversation? This action cannot be undone.",
  darkMode = false
}: DeleteConfirmationModalProps) {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && isOpen) onConfirm();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        onClick={onClose}
    >
      <div 
        className={`w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in border ${
            darkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
            darkMode ? 'bg-red-500/10' : 'bg-red-50'
          }`}>
            <span className="material-symbols-outlined text-[24px] text-red-500">
              delete
            </span>
          </div>
          
          <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-zinc-100' : 'text-zinc-800'}`}>
            {title}
          </h3>
          
          <p className={`text-sm leading-relaxed mb-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {description}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                darkMode 
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white' 
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
