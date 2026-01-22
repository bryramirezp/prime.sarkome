import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import ApiKeyModal, { getStoredApiKey } from './ApiKeyModal';
import { GeminiModel } from '../types';
import { ChatSession, ChatMessage } from '../schemas/sessionSchema';
import { useProjects } from '../hooks/useProjects';

/**
 * Props for the Layout component
 */
export interface LayoutProps {
    /** Current dark mode state */
    darkMode: boolean;
    /** Callback to toggle dark mode */
    onToggleDarkMode: () => void;
    /** List of chat sessions for the sidebar */
    sessions: ChatSession[];
    /** Currently active session ID */
    currentSessionId: string | null;
    /** Callback when a session is loaded */
    onSessionLoad: (sessionId: string) => void;
    /** Callback to create a new session */
    onSessionCreate: () => void;
    /** Callback to delete a session */
    onSessionDelete: (sessionId: string) => void;
    /** Callback to rename a session */
    onSessionRename: (sessionId: string, title: string) => void;
    /** Callback to pin/unpin a session */
    onSessionPin: (sessionId: string, pinned: boolean) => void;
    /** Callback to delete all sessions */
    onDeleteAll: () => void;
    /** Whether API is offline */
    isOffline?: boolean;
    /** Projects hook for research collections */
    projectsHook: ReturnType<typeof useProjects>;
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
    projectsHook,
}) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('primekg_sidebar_collapsed');
            // Default to collapsed (true) if no preference stored
            return stored !== null ? stored === 'true' : true;
        }
        return true; // Default collapsed
    });
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState<GeminiModel>(GeminiModel.FLASH);

    // Persist sidebar collapsed state in sessionStorage (only for current session)
    useEffect(() => {
        sessionStorage.setItem('primekg_sidebar_collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);


    // Check for existing API key on mount
    useEffect(() => {
        const key = getStoredApiKey();
        setHasApiKey(!!key);
    }, []);

    // Determine if we're on the chat page (show sidebar and model selector)
    const isChatPage = location.pathname === '/' || location.pathname === '/chat';
    const isGraphPage = location.pathname === '/graph';
    const isStatsPage = location.pathname === '/stats';
    const isPrimeKGPage = location.pathname === '/docs/primekg-graph';

    // Get page title based on route
    const getPageTitle = (): string | undefined => {
        if (isGraphPage) return '🐮';
        if (isStatsPage) return '🐮';
        if (isPrimeKGPage) return '🐮';
        return undefined; // Use default for chat
    };

    return (
        <div
            className={`h-screen flex flex-col font-sans overflow-hidden relative transition-colors duration-300 ${darkMode ? 'bg-[#09090b] text-slate-100' : 'bg-slate-100 text-slate-900'
                }`}
        >
            {/* API Key Modal (global) */}
            <ApiKeyModal
                isOpen={showApiKeyModal}
                onClose={() => setShowApiKeyModal(false)}
                onSave={(key) => setHasApiKey(!!key)}
                darkMode={darkMode}
            />

            {/* Header - Fixed at top */}
            <Header
                darkMode={darkMode}
                onToggleDarkMode={onToggleDarkMode}
                onToggleSidebar={() => setSidebarOpen(true)}
                hasApiKey={hasApiKey}
                onShowApiKeyModal={() => setShowApiKeyModal(true)}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                title={getPageTitle()}
                showModelSelector={isChatPage}
                showBackButton={!isChatPage}
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
                    projectsHook={projectsHook}
                />


                {/* Page content - Uses Outlet for nested routes */}
                <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <Outlet
                        context={{
                            darkMode,
                            hasApiKey,
                            selectedModel,
                            onShowApiKeyModal: () => setShowApiKeyModal(true),
                            isOffline: false,
                            projectsHook,
                        }}
                    />
                </main>
            </div>
        </div>
    );
};

/**
 * Context type for child routes to access layout state
 */
export interface LayoutContext {
    darkMode: boolean;
    hasApiKey: boolean;
    selectedModel: GeminiModel;
    onShowApiKeyModal: () => void;
    isOffline: boolean;
    projectsHook: ReturnType<typeof useProjects>;
}

export default Layout;
