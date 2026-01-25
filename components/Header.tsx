import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GeminiModel } from '../types';

/**
 * Model icon component for displaying the selected AI model
 */
const ModelIcon: React.FC<{ model: GeminiModel }> = ({ model }) => {
    if (model === GeminiModel.FLASH_2_0_EXP) {
        return <span className="material-symbols-outlined">science</span>;
    }
    if (model === GeminiModel.FLASH) {
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
    onShowRecoveryKey?: () => void;
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
    onShowRecoveryKey,
    title,
    showModelSelector: showModelSelectorProp = true,
    showBackButton = false,
}) => {
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const isChat = location.pathname === '/chat';

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
        <header className="h-16 flex items-center px-5 gap-3 bg-card/50 backdrop-blur-sm border-b border-border flex-shrink-0 relative z-50">
            {/* Logo and Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group transition-transform hover:scale-105" data-discover="true">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <img 
                        alt="cow" 
                        className="w-8 h-8 brightness-110 contrast-125 hue-rotate-[280deg] relative z-10" 
                        src="https://em-content.zobj.net/source/twitter/376/cow-face_1f42e.png" 
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-foreground tracking-tight text-sm">PRIME-LAB</span>
                    <span className="text-[10px] font-semibold text-tertiary tracking-widest uppercase">Bio-Simulation</span>
                </div>
            </Link>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden ml-auto">
                {onToggleSidebar && isChat && (
                    <button 
                        className="text-muted-foreground hover:text-primary z-50 p-1" 
                        aria-label="Toggle sidebar"
                        onClick={onToggleSidebar}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                )}
            </div>

            {/* Center: Model selector (Preserved from original) */}
            {showModelSelectorProp && (
                <div ref={modelDropdownRef} className="absolute left-1/2 -translate-x-1/2 z-50 hidden md:block">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className="flex items-center gap-2 bg-surface/80 backdrop-blur border border-border rounded-full p-1 pr-4 shadow-sm hover:bg-surface transition-colors whitespace-nowrap"
                        aria-expanded={isModelDropdownOpen}
                        aria-haspopup="listbox"
                    >
                        <div className="flex items-center justify-center w-7 h-7 bg-indigo-500/10 rounded-full text-indigo-500">
                            <ModelIcon model={selectedModel} />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
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
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-surface border border-border rounded-xl shadow-xl overflow-hidden animate-scale-in"
                            role="listbox"
                        >
                            <button
                                onClick={() => handleModelSelect(GeminiModel.FLASH)}
                                className={`w-full text-left px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2 ${selectedModel === GeminiModel.FLASH
                                    ? 'bg-surface-hover text-foreground'
                                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
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
                                    ? 'bg-surface text-foreground'
                                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
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
                                    ? 'bg-surface text-foreground'
                                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
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
            <div className="flex items-center gap-3 ml-auto hidden md:flex">
                <Link 
                    to="/docs/primekg-graph" 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border" 
                    title="Knowledge Graph Documentation"
                >
                    <span className="material-symbols-outlined text-[20px]">menu_book</span>
                </Link>
                <a 
                    href="https://github.com/bryramirezp/prime.sarkome" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border" 
                    title="View Source on GitHub"
                >
                    <span className="material-symbols-outlined text-[20px]">code</span>
                </a>
                <button 
                    onClick={onShowApiKeyModal}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border ${hasApiKey 
                        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                    }`} 
                    title={hasApiKey ? "API Key Active - Click to Manage" : "API Key Missing - Click to Configure"}
                >
                    <span className="material-symbols-outlined text-[20px]">key</span>
                </button>
                {onShowRecoveryKey && (
                    <button 
                        onClick={onShowRecoveryKey}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all border text-amber-500 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" 
                        title="Recovery Key - Backup & Restore Your Chats"
                    >
                        <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                    </button>
                )}
                {onToggleDarkMode && (
                    <button 
                        onClick={onToggleDarkMode}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors border border-transparent hover:border-purple-500/20" 
                        title="Toggle terminal mode"
                    >
                        <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                    </button>
                )}
            </div>
        </header>
    );};

export default Header;
