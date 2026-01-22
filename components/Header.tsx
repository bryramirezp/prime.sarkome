import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GeminiModel } from '../types';

/**
 * Model icon component for displaying the selected AI model
 */
const ModelIcon: React.FC<{ model: GeminiModel }> = ({ model }) => {
    if (model === GeminiModel.FLASH || model === GeminiModel.FLASH_2_0_EXP) {
        return <span className="material-symbols-outlined">bolt</span>;
    }
    return <span className="material-symbols-outlined">psychology</span>;
};

/**
 * Props for the Header component
 */
export interface HeaderProps {
    /** Current dark mode state */
    darkMode: boolean;
    /** Callback to toggle dark mode */
    onToggleDarkMode?: () => void;
    /** Callback to toggle sidebar (mobile) */
    onToggleSidebar?: () => void;
    /** Whether user has configured an API key */
    hasApiKey: boolean;
    /** Callback to open API key modal */
    onShowApiKeyModal: () => void;
    /** Currently selected Gemini model */
    selectedModel: GeminiModel;
    /** Callback when model selection changes */
    onModelChange: (model: GeminiModel) => void;
    /** Optional title override for non-chat pages */
    title?: string;
    /** Whether to show the model selector (only on chat pages) */
    showModelSelector?: boolean;
    /** Whether to show back button (for non-chat pages) */
    showBackButton?: boolean;
}

/**
 * Reusable application header component.
 * Displays branding, model selector, API key status, and dark mode toggle.
 */
const Header: React.FC<HeaderProps> = ({
    darkMode,
    onToggleDarkMode,
    onToggleSidebar,
    hasApiKey,
    onShowApiKeyModal,
    selectedModel,
    onModelChange,
    title,
    showModelSelector: showModelSelectorProp = true,
    showBackButton = false,
}) => {
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                modelDropdownRef.current &&
                !modelDropdownRef.current.contains(event.target as Node)
            ) {
                setIsModelDropdownOpen(false);
            }
        };

        if (isModelDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isModelDropdownOpen]);

    const handleModelSelect = (model: GeminiModel) => {
        onModelChange(model);
        setIsModelDropdownOpen(false);
    };

    return (
        <header className="h-16 flex items-center px-5 gap-3 bg-white dark:bg-zinc-950 border-b border-border/50 flex-shrink-0">
            {/* Logo and Brand - always visible */}
            <div className="flex items-center gap-3">
                <img
                    src="https://em-content.zobj.net/source/twitter/376/cow-face_1f42e.png"
                    alt="cow"
                    className="w-8 h-8 brightness-110 contrast-125 hue-rotate-[280deg]"
                />
                <div className="flex flex-col">
                    <span className="font-semibold text-primary tracking-tight text-sm">PrimeKG</span>
                    <span className="text-[10px] text-tertiary">Precision Medicine</span>
                </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden ml-auto">
                {onToggleSidebar && (
                    <button
                        className="text-secondary hover:text-primary z-50 p-1"
                        onClick={onToggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                )}
            </div>


            {/* Center: Model selector (visible on desktop, only on chat pages) */}
            {showModelSelectorProp && (
                <div ref={modelDropdownRef} className="absolute left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="hidden md:flex items-center gap-2 bg-surface/80 backdrop-blur border border-border rounded-full p-1 pr-4 shadow-sm hover:bg-surface transition-colors whitespace-nowrap"
                        aria-expanded={isModelDropdownOpen}
                        aria-haspopup="listbox"
                    >
                        <div className="flex items-center justify-center w-7 h-7 bg-surface-hover rounded-full text-accent">
                            <ModelIcon model={selectedModel} />
                        </div>
                        <span className="text-xs font-medium text-primary">
                            {selectedModel === GeminiModel.FLASH
                                ? 'Gemini 3.0 Flash'
                                : selectedModel === GeminiModel.PRO
                                    ? 'Gemini 3.0 Pro'
                                    : 'Gemini 2.0 Flash Exp'
                            }
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-tertiary">expand_more</span>
                    </button>

                    {/* Model dropdown */}
                    {isModelDropdownOpen && (
                        <div
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-xl overflow-hidden animate-scale-in"
                            role="listbox"
                        >
                            <button
                                onClick={() => handleModelSelect(GeminiModel.FLASH)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2 ${selectedModel === GeminiModel.FLASH
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                role="option"
                                aria-selected={selectedModel === GeminiModel.FLASH}
                            >
                                <span className="material-symbols-outlined text-[16px]">bolt</span>
                                Gemini 3.0 Flash
                            </button>
                            <button
                                onClick={() => handleModelSelect(GeminiModel.PRO)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2 ${selectedModel === GeminiModel.PRO
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                role="option"
                                aria-selected={selectedModel === GeminiModel.PRO}
                            >
                                <span className="material-symbols-outlined text-[16px]">psychology</span>
                                Gemini 3.0 Pro
                            </button>
                            <button
                                onClick={() => handleModelSelect(GeminiModel.FLASH_2_0_EXP)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2 ${selectedModel === GeminiModel.FLASH_2_0_EXP
                                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                role="option"
                                aria-selected={selectedModel === GeminiModel.FLASH_2_0_EXP}
                            >
                                <span className="material-symbols-outlined text-[16px]">science</span>
                                Gemini 2.0 Flash Exp
                            </button>
                        </div>
                    )}
                </div>
            )}


            {/* Desktop brand (when model selector is hidden) */}
            {!showModelSelectorProp && (
                <div className="hidden md:flex items-center gap-2">
                    {showBackButton && (
                        <Link
                            to="/chat"
                            className="flex items-center gap-2 text-sm font-medium transition-colors text-secondary hover:text-primary mr-4"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                            <span>Back to Chat</span>
                        </Link>
                    )}
                    <span className="font-medium text-primary">{title || 'PrimeKG'}</span>
                </div>
            )}

            {/* Right side: API key button and dark mode toggle */}
            <div className="flex items-center gap-3 ml-auto">
                <button
                    onClick={onShowApiKeyModal}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-surface ${hasApiKey ? 'text-secondary hover:text-primary' : 'text-amber-500 hover:text-amber-400'
                        }`}
                    aria-label={hasApiKey ? 'Manage API Key' : 'Set API Key'}
                >
                    <span className="material-symbols-outlined text-[16px]">vpn_key</span>
                    <span>{hasApiKey ? 'API Key' : 'Set Key'}</span>
                </button>

                {onToggleDarkMode && (
                    <button
                        onClick={onToggleDarkMode}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-secondary hover:text-primary transition-colors"
                        title="Toggle dark mode"
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {darkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
