import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { ChatSession, ChatMessage } from '../schemas/sessionSchema';
import type { LayoutContext } from '../components/Layout';

/**
 * Props for the ChatContent component
 */
interface ChatContentProps {
    /** Current active chat session */
    currentSession: ChatSession | null;
    /** Callback to save session messages */
    onSaveSession: (messages: ChatMessage[]) => void;
}

/**
 * Chat content component - the main chat interface without layout wrapper.
 * This is rendered inside the Layout component via Outlet.
 */
export default function ChatContent({
    currentSession,
    onSaveSession,
}: ChatContentProps) {
    // Get context from Layout parent
    const { darkMode, isOffline, selectedModel, projectsHook } = useOutletContext<LayoutContext>();

    return (
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
            <ChatInterface
                currentSession={currentSession}
                onSaveSession={onSaveSession}
                isOffline={isOffline}
                darkMode={darkMode}
                selectedModel={selectedModel}
                projectsHook={projectsHook}
            />
        </div>
    );
}
