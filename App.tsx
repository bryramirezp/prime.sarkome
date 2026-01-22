import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatContent from './pages/ChatContent';
import StatsPage from './pages/StatsPage';
import GraphExplorer from './components/GraphExplorer';
import { useHealth } from './hooks/useKgQueries';
import DocsPage from './pages/DocsPage';
import FaqPage from './pages/FaqPage';
import ProjectsPage from './pages/ProjectsPage';
import { useChatSessions } from './hooks/useChatSessions';
import { useProjects } from './hooks/useProjects';

/**
 * Main application component.
 * Manages global state (dark mode, sessions, projects) and provides layout structure.
 */
function App() {
  const { data: health } = useHealth();
  const isOffline = health?.status === 'offline-mock';

  const {
    sessions,
    currentSessionId,
    createSession,
    loadSession,
    deleteSession,
    renameSession,
    pinSession,
    deleteAll,
    saveCurrentSession,
  } = useChatSessions();

  const projectsHook = useProjects();

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('primekg_theme') === 'dark';
    }
    return false;
  });

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('primekg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('primekg_theme', 'light');
    }
  }, [darkMode]);

  // Get current session for chat page
  const currentSession = sessions.find((s) => s.id === currentSessionId) || null;

  return (
    <Routes>
      {/* Documentation Routes (Standalone Layout) */}
      <Route path="/docs" element={<Navigate to="/docs/primekg-graph" replace />} />
      <Route path="/docs/:slug" element={<DocsPage darkMode={darkMode} />} />
      <Route path="/faq" element={<FaqPage darkMode={darkMode} />} />

      {/* Layout wrapper for all other routes */}
      <Route
        element={
          <Layout
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSessionLoad={loadSession}
            onSessionCreate={createSession}
            onSessionDelete={deleteSession}
            onSessionRename={renameSession}
            onSessionPin={pinSession}
            onDeleteAll={deleteAll}
            isOffline={isOffline}
            projectsHook={projectsHook}
          />
        }
      >
        {/* Default redirect to chat */}
        <Route index element={<Navigate to="/chat" replace />} />

        {/* Chat page - main functionality */}
        <Route
          path="/chat"
          element={
            <ChatContent
              currentSession={currentSession}
              onSaveSession={saveCurrentSession}
            />
          }
        />

        {/* Graph Explorer page */}
        <Route path="/graph" element={<GraphExplorer darkMode={darkMode} />} />

        {/* Statistics page */}
        <Route path="/stats" element={<StatsPage darkMode={darkMode} />} />

        {/* Projects page */}
        <Route path="/projects" element={<ProjectsPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
