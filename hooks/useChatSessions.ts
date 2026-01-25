import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatSessionsArraySchema, ChatSession, ChatMessage } from '../schemas/sessionSchema';
import { chatSyncService, getBrowserFingerprint } from '../services/supabaseService';

const STORAGE_KEY = 'primekg_chat_sessions';
const HISTORY_KEY = 'primekg_chat_history';
const MAX_SESSIONS = 50;

export function useChatSessions() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const fingerprint = useRef(getBrowserFingerprint());

    // Load sessions on mount - first from localStorage (fast), then from Supabase (background)
    useEffect(() => {
        // 1. Load from localStorage immediately
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                const result = ChatSessionsArraySchema.safeParse(parsed);
                if (result.success) {
                    const sorted = [...result.data].sort((a, b) => {
                        if (a.pinned && !b.pinned) return -1;
                        if (!a.pinned && b.pinned) return 1;
                        return b.timestamp.getTime() - a.timestamp.getTime();
                    });
                    setSessions(sorted);
                }
            } catch (e) {
                console.error('[Session Hook] Failed to parse localStorage sessions:', e);
            }
        }

        // 2. Load from Supabase in background (will merge/update)
        chatSyncService.loadSessions(fingerprint.current).then(cloudSessions => {
            if (cloudSessions.length > 0) {
                setIsCloudSynced(true);
                
                // Convert normalized schema to ChatSession format
                const converted: ChatSession[] = cloudSessions.map(cs => ({
                    id: cs.id,
                    title: cs.title,
                    messages: (cs.messages || []).map(msg => ({
                        id: msg.id.toString(),
                        role: msg.role as 'user' | 'model' | 'system',
                        content: msg.content,
                        timestamp: new Date(msg.created_at),
                        relatedData: msg.related_data,
                        trace: msg.trace
                    })),
                    timestamp: new Date(cs.updated_at),
                    pinned: cs.pinned
                }));

                // Merge with localStorage sessions (cloud wins for conflicts)
                setSessions(prev => {
                    const merged = new Map<string, ChatSession>();
                    
                    // Add local sessions first
                    prev.forEach(s => merged.set(s.id, s));
                    
                    // Cloud sessions overwrite local
                    converted.forEach(s => merged.set(s.id, s));
                    
                    const final = Array.from(merged.values())
                        .sort((a, b) => {
                            if (a.pinned && !b.pinned) return -1;
                            if (!a.pinned && b.pinned) return 1;
                            return b.timestamp.getTime() - a.timestamp.getTime();
                        })
                        .slice(0, MAX_SESSIONS);
                    
                    // Update localStorage with merged data
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
                    
                    return final;
                });
            }
        }).catch(err => {
            console.warn('[Session Hook] Cloud sync failed, using local only:', err);
        });
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

        // Sync to cloud in background
        chatSyncService.upsertSession({
            id: newSession.id,
            title: newSession.title,
            messages: [],
            pinned: false,
            fingerprint: fingerprint.current
        });

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

        // Sync deletion to cloud
        chatSyncService.deleteSession(sessionId);
    }, [currentSessionId]);

    const renameSession = useCallback((sessionId: string, newTitle: string) => {
        setSessions(prev => {
            const updated = prev.map(s =>
                s.id === sessionId ? { ...s, title: newTitle } : s
            );
            
            // Sync to cloud
            const session = updated.find(s => s.id === sessionId);
            if (session) {
                chatSyncService.upsertSession({
                    id: session.id,
                    title: newTitle,
                    messages: session.messages,
                    pinned: session.pinned,
                    fingerprint: fingerprint.current
                });
            }
            
            return updated;
        });
    }, []);

    const pinSession = useCallback((sessionId: string, pinned: boolean) => {
        setSessions(prev => {
            const updated = prev.map(s =>
                s.id === sessionId ? { ...s, pinned } : s
            );
            
            const sorted = updated.sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });

            // Sync to cloud
            const session = sorted.find(s => s.id === sessionId);
            if (session) {
                chatSyncService.upsertSession({
                    id: session.id,
                    title: session.title,
                    messages: session.messages,
                    pinned: pinned,
                    fingerprint: fingerprint.current
                });
            }

            return sorted;
        });
    }, []);

    const deleteAll = useCallback(() => {
        setSessions([]);
        setCurrentSessionId(null);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(HISTORY_KEY);

        // Sync to cloud
        chatSyncService.deleteAllSessions(fingerprint.current);
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

            let final: ChatSession[];
            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = session;
                final = updated;
            } else {
                final = [session, ...prev].slice(0, MAX_SESSIONS);
            }

            // Sync to cloud (debounced internally by the user's typing, this is called on each message)
            chatSyncService.upsertSession({
                id: session.id,
                title: session.title,
                messages: session.messages,
                pinned: session.pinned,
                fingerprint: fingerprint.current
            });

            return final;
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
        isCloudSynced, // New: indicates if cloud sync is active
    };
}
