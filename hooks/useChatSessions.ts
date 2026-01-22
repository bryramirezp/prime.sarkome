import { useState, useCallback, useEffect } from 'react';
import { ChatSessionsArraySchema, ChatSession, ChatMessage } from '../schemas/sessionSchema';

const STORAGE_KEY = 'primekg_chat_sessions';
const HISTORY_KEY = 'primekg_chat_history';
const MAX_SESSIONS = 20;

export function useChatSessions() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Load sessions on mount
    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                const result = ChatSessionsArraySchema.safeParse(parsed);
                if (result.success) {
                    // Sort: pinned first, then by timestamp
                    const sorted = [...result.data].sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return b.timestamp.getTime() - a.timestamp.getTime();
                    });
                    setSessions(sorted);
                } else {
                    console.error('[Session Hook] Invalid session data:', result.error);
                }
            } catch (e) {
                console.error('[Session Hook] Failed to parse sessions:', e);
            }
        }
    }, []);

    // Persist sessions to localStorage whenever they change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const createSession = useCallback(() => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            messages: [],
            timestamp: new Date(),
        };

        setSessions(prev => [newSession, ...prev].slice(0, MAX_SESSIONS));
        setCurrentSessionId(newSession.id);
        localStorage.removeItem(HISTORY_KEY);
        return newSession.id;
    }, []);

    const loadSession = useCallback((sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(session.messages));
            setCurrentSessionId(sessionId);
        }
    }, [sessions]);

    const deleteSession = useCallback((sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            localStorage.removeItem(HISTORY_KEY);
        }
    }, [currentSessionId]);

    const renameSession = useCallback((sessionId: string, newTitle: string) => {
        setSessions(prev => prev.map(s =>
            s.id === sessionId ? { ...s, title: newTitle } : s
        ));
    }, []);

    const pinSession = useCallback((sessionId: string, pinned: boolean) => {
        setSessions(prev => {
            const updated = prev.map(s =>
                s.id === sessionId ? { ...s, pinned } : s
            );
            return updated.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });
        });
    }, []);

    const deleteAll = useCallback(() => {
        setSessions([]);
        setCurrentSessionId(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(HISTORY_KEY);
    }, []);

    const saveCurrentSession = useCallback((messages: ChatMessage[]) => {
        if (messages.length <= 1) return; // Ignore if only welcome message

        const sessionId = currentSessionId || Date.now().toString();

        // Extract title from first user message
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg ?
            (firstUserMsg.content.substring(0, 40) + (firstUserMsg.content.length > 40 ? '...' : '')) :
            `Chat ${new Date().toLocaleDateString()}`;

        setSessions(prev => {
            const existingIndex = prev.findIndex(s => s.id === sessionId);
            const session: ChatSession = {
                id: sessionId,
                title,
                messages,
                timestamp: new Date(),
                pinned: existingIndex >= 0 ? prev[existingIndex].pinned : false
            };

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = session;
                return updated;
            } else {
                return [session, ...prev].slice(0, MAX_SESSIONS);
            }
        });

        if (!currentSessionId) {
            setCurrentSessionId(sessionId);
        }
    }, [currentSessionId]);

    return {
        sessions,
        currentSessionId,
        createSession,
        loadSession,
        deleteSession,
        renameSession,
        pinSession,
        deleteAll,
        saveCurrentSession,
    };
}
