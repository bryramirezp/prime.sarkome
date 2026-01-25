import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ChatContent from './pages/ChatContent';
import StatsPage from './pages/StatsPage';
import GraphExplorer from './components/GraphExplorer';
import { useHealth } from './hooks/useKgQueries';
import DocsPage from './pages/DocsPage';
import FaqPage from './pages/FaqPage';
import ProjectsPage from './pages/ProjectsPage';
import LabDashboard from './pages/LabDashboard';
import HypothesisSimulator from './pages/HypothesisSimulator';
import HypothesisHub from './pages/HypothesisHub';
import MolecularSim from './pages/MolecularSim';

import { useApiKey } from './contexts/ApiKeyContext';
import { useChatSessions } from './hooks/useChatSessions';
import { useProjects } from './hooks/useProjects';

/**
 * Main application component.
 * Manages global state (dark mode, sessions, projects, API keys) and provides layout structure.
 */
function App() {
  const { data: health } = useHealth();
  const isOffline = health?.status === 'offline-mock';
  const { isValid } = useApiKey();

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

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // Get current session for chat page
  const currentSession = useMemo(() => 
    sessions.find((s) => s.id === currentSessionId) || null,
  [sessions, currentSessionId]);



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
            onToggleDarkMode={toggleDarkMode}
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
        {/* Default redirect to dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Bio-Lab Dashboard */}
        <Route path="/dashboard" element={<LabDashboard />} />

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

        {/* Hypothesis Simulator Game */}
        <Route path="/HypothesisSimulator" element={<HypothesisSimulator />} />

        {/* Hypothesis Hub (New Unified Dashboard) */}
        <Route path="/hypothesis" element={<HypothesisHub />} />

        {/* Molecular Simulator (New) */}
        <Route path="/molecular" element={<MolecularSim />} />

        {/* Statistics page */}
        <Route path="/stats" element={<StatsPage darkMode={darkMode} />} />

        {/* Projects page */}
        <Route path="/projects" element={<ProjectsPage />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
