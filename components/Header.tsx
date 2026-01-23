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
    darkMode: boolean;
    onToggleDarkMode?: () => void;
    onToggleSidebar?: () => void;
    hasApiKey: boolean;
    onShowApiKeyModal: () => void;
    onLogout?: () => void;
    selectedModel: GeminiModel;
    onModelChange: (model: GeminiModel) => void;
    title?: string;
    showModelSelector?: boolean;
    showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    darkMode,
    onToggleDarkMode,
    onToggleSidebar,
    hasApiKey,
    onShowApiKeyModal,
    onLogout,
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
        <header className="h-16 flex items-center px-5 gap-3 bg-[rgb(var(--color-bg-main))] border-b border-border/50 flex-shrink-0 relative z-[60]">
            {/* Logo and Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group transition-transform hover:scale-105">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img
                      src="https://em-content.zobj.net/source/twitter/376/cow-face_1f42e.png"
                      alt="cow"
                      className="w-8 h-8 brightness-110 contrast-125 hue-rotate-[280deg] relative z-10"
                  />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-primary tracking-tight text-sm bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">PRIME-LAB</span>
                    <span className="text-[10px] font-semibold text-tertiary tracking-widest uppercase">Bio-Simulation</span>
                </div>
            </Link>

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

            {/* Center: Model selector */}
            {showModelSelectorProp && (
                <div ref={modelDropdownRef} className="absolute left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="hidden md:flex items-center gap-2 bg-surface/80 backdrop-blur border border-border rounded-full p-1 pr-4 shadow-sm hover:bg-surface transition-colors whitespace-nowrap"
                        aria-expanded={isModelDropdownOpen}
                        aria-haspopup="listbox"
                    >
                        <div className="flex items-center justify-center w-7 h-7 bg-indigo-500/10 rounded-full text-indigo-500">
                            <ModelIcon model={selectedModel} />
                        </div>
                        <span className="text-xs font-semibold text-primary">
                            {selectedModel === GeminiModel.FLASH
                                ? 'Gemini 3.0 Flash'
                                : selectedModel === GeminiModel.PRO
                                    ? 'Gemini 3.0 Pro'
                                    : 'Gemini 2.0 Flash'
                            }
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-tertiary">expand_more</span>
                    </button>

                    {/* Model dropdown */}
                    {isModelDropdownOpen && (
                        <div
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-[rgb(var(--color-bg-main))] border border-border rounded-xl shadow-xl overflow-hidden animate-scale-in"
                            role="listbox"
                        >
                            <button
                                onClick={() => handleModelSelect(GeminiModel.FLASH)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2 ${selectedModel === GeminiModel.FLASH
                                    ? 'bg-surface text-primary'
                                    : 'text-secondary hover:bg-surface-hover hover:text-primary'
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
                                    ? 'bg-surface text-primary'
                                    : 'text-secondary hover:bg-surface-hover hover:text-primary'
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
                                    ? 'bg-surface text-primary'
                                    : 'text-secondary hover:bg-surface-hover hover:text-primary'
                                    }`}
                                role="option"
                                aria-selected={selectedModel === GeminiModel.FLASH_2_0_EXP}
                            >
                                <span className="material-symbols-outlined text-[16px]">science</span>
                                Gemini 2.0 Flash
                            </button>
                        </div>
                    )}
                </div>
            )}



            {/* Right side controls */}
            <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                   <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Active clearance</span>
                </div>

                <div className="h-4 w-[1px] bg-border/50 mx-1" />

                {onLogout && (
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-1.5 text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-widest px-2 py-1"
                        title="Lock Laboratory (Logout)"
                    >
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                    </button>
                )}

                {onToggleDarkMode && (
                    <button
                        onClick={onToggleDarkMode}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-secondary hover:text-primary transition-colors border border-transparent hover:border-border"
                        title="Toggle terminal mode"
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
