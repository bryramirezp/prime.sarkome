import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import AppBackground from './AppBackground';
import ApiKeyModal from './ApiKeyModal';
import RecoveryKeyModal from './RecoveryKeyModal';
import { GeminiModel } from '../types';
import { ChatSession } from '../schemas/sessionSchema';
import { useApiKey } from '../contexts/ApiKeyContext';

/**
 * Props for the Layout component
 */
export interface LayoutProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
    sessions: ChatSession[];
    currentSessionId: string | null;
    onSessionLoad: (sessionId: string) => void;
    onSessionCreate: () => void;
    onSessionDelete: (sessionId: string) => void;
    onSessionRename: (sessionId: string, title: string) => void;
    onSessionPin: (sessionId: string, pinned: boolean) => void;
    onDeleteAll: () => void;
    isOffline?: boolean;
}

/**
 * Shared layout component that wraps all pages.
 * Provides consistent Header, Sidebar, and content area structure.
 */
const Layout: React.FC<LayoutProps> = ({
    darkMode,
    onToggleDarkMode,
    sessions,
    currentSessionId,
    onSessionLoad,
    onSessionCreate,
    onSessionDelete,
    onSessionRename,
    onSessionPin,
    onDeleteAll,
}) => {
    const { isValid, clearApiKey } = useApiKey();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('primekg_sidebar_collapsed');
            return stored !== null ? stored === 'true' : true;
        }
        return true;
    });
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [showRecoveryKeyModal, setShowRecoveryKeyModal] = useState(false);
    const [selectedModel, setSelectedModel] = useState<GeminiModel>(GeminiModel.FLASH);

    // Persist sidebar collapsed state in sessionStorage
    useEffect(() => {
        sessionStorage.setItem('primekg_sidebar_collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    // Show Recovery Key modal on first visit
    useEffect(() => {
        const hasSeenKey = localStorage.getItem('primekg_has_seen_recovery_key');
        if (!hasSeenKey) {
            // Show after a short delay so the user sees the app first
            const timer = setTimeout(() => {
                setShowRecoveryKeyModal(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Determine context based on route
    const isChatPage = location.pathname === '/chat';
    const isGraphPage = location.pathname === '/graph';
    const isStatsPage = location.pathname === '/stats';
    const isGamePage = location.pathname === '/game';
    const isDashboard = location.pathname === '/dashboard';

    // Get page title based on route
    const getPageTitle = (): string | undefined => {
        if (isGraphPage) return 'Network Navigator';
        if (isStatsPage) return 'Lab Statistics';
        if (isGamePage) return 'Hypothesis Simulator';
        if (isDashboard) return 'Bio-Command Center';
        return undefined; // Use default for chat
    };

    return (
        <div
            className={`h-screen flex flex-col font-sans overflow-hidden relative transition-colors duration-300 text-secondary bg-transparent`}
        >
            {/* Global Modular Background */}
            <AppBackground />


            {/* API Key Modal (global management) */}
            <ApiKeyModal
                isOpen={showApiKeyModal}
                onClose={() => setShowApiKeyModal(false)}
                onSave={() => {}} // Context handles it via LabAccessModal primarily, but this can still update the key
                darkMode={darkMode}
            />

            {/* Recovery Key Modal */}
            <RecoveryKeyModal
                isOpen={showRecoveryKeyModal}
                onClose={() => setShowRecoveryKeyModal(false)}
                darkMode={darkMode}
            />

            {/* Header - Fixed at top */}
            <Header
                darkMode={darkMode}
                onToggleDarkMode={onToggleDarkMode}
                onToggleSidebar={() => setSidebarOpen(true)}
                hasApiKey={isValid}
                onShowApiKeyModal={() => setShowApiKeyModal(true)}
                onLogout={clearApiKey}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onShowRecoveryKey={() => setShowRecoveryKeyModal(true)}
                title={getPageTitle()}
                showModelSelector={isChatPage}
                showBackButton={!isDashboard && !isChatPage}
            />

            {/* Main content area with sidebar */}
            <div className="flex-1 flex min-h-0">
                <Sidebar
                    sessions={sessions}
                    currentSessionId={currentSessionId}
                    darkMode={darkMode}
                    onSessionLoad={onSessionLoad}
                    onSessionDelete={onSessionDelete}
                    onSessionRename={onSessionRename}
                    onSessionPin={onSessionPin}
                    onDeleteAll={onDeleteAll}
                    onCreateNew={onSessionCreate}
                    mobileOpen={sidebarOpen}
                    onCloseMobile={() => setSidebarOpen(false)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    showOnDesktop={isChatPage}
                />

                {/* Page content */}
                <div id="layout-content" className="flex-1 flex flex-col min-h-0 overflow-y-auto relative">
                    <Outlet
                        context={{
                            darkMode,
                            hasApiKey: isValid,
                            selectedModel,
                            onShowApiKeyModal: () => setShowApiKeyModal(true),
                            isOffline: false,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export interface LayoutContext {
    darkMode: boolean;
    hasApiKey: boolean;
    selectedModel: GeminiModel;
    onShowApiKeyModal: () => void;
    isOffline: boolean;
}

export default Layout;
