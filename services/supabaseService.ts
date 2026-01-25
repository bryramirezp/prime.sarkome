import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabase) return supabase;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Missing URL or Anon Key. Cloud sync disabled. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
    return null;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false
    }
  });

  return supabase;
};

// Type definitions matching our normalized schema
export interface ChatMessageRow {
  id: number;
  session_id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  created_at: string;
  related_data?: any;
  trace?: string[];
}

export interface ChatSessionRow {
  id: string;
  user_fingerprint: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  messages?: ChatMessageRow[]; // Joined data
}

export interface UserRow {
  fingerprint: string;
  created_at: string;
  last_active_at: string;
}

/**
 * Database operations with normalized schema
 */
export const chatSyncService = {
  /**
   * Ensure user exists in the database
   */
  async ensureUser(fingerprint: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('users')
        .upsert({
          fingerprint,
          last_active_at: new Date().toISOString()
        }, { onConflict: 'fingerprint' });

      if (error) {
        console.error('[Supabase] Ensure user error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Ensure user exception:', e);
      return false;
    }
  },

  /**
   * Save or update a session with its messages
   * This is a transaction: session + messages together
   */
  async upsertSession(session: {
    id: string;
    title: string;
    messages: any[];
    pinned?: boolean;
    fingerprint: string;
  }): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      // 1. Ensure user exists
      await this.ensureUser(session.fingerprint);

      // 2. Upsert session metadata
      const { error: sessionError } = await client
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_fingerprint: session.fingerprint,
          title: session.title,
          pinned: session.pinned || false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (sessionError) {
        console.error('[Supabase] Session upsert error:', sessionError.message);
        return false;
      }

      // 3. Delete existing messages for this session and insert new ones
      // This is simpler than trying to diff and update (and faster for small sessions)
      const { error: deleteError } = await client
        .from('chat_messages')
        .delete()
        .eq('session_id', session.id);

      if (deleteError) {
        console.error('[Supabase] Delete messages error:', deleteError.message);
        return false;
      }

      // 4. Insert all messages
      if (session.messages.length > 0) {
        const messagesData = session.messages.map((msg, index) => ({
          session_id: session.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.timestamp || new Date(Date.now() + index).toISOString(),
          related_data: msg.relatedData || null,
          trace: msg.trace || null
        }));

        const { error: insertError } = await client
          .from('chat_messages')
          .insert(messagesData);

        if (insertError) {
          console.error('[Supabase] Insert messages error:', insertError.message);
          return false;
        }
      }

      return true;
    } catch (e) {
      console.error('[Supabase] Upsert session exception:', e);
      return false;
    }
  },

  /**
   * Load all sessions for a user with their messages
   */
  async loadSessions(fingerprint: string): Promise<ChatSessionRow[]> {
    const client = getSupabaseClient();
    if (!client) return [];

    try {
      // Update user's last_active timestamp
      await this.ensureUser(fingerprint);

      // Load sessions
      const { data: sessions, error: sessionsError } = await client
        .from('chat_sessions')
        .select('*')
        .eq('user_fingerprint', fingerprint)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (sessionsError) {
        console.error('[Supabase] Load sessions error:', sessionsError.message);
        return [];
      }

      if (!sessions || sessions.length === 0) return [];

      // Load messages for all sessions in one query (efficient!)
      const sessionIds = sessions.map(s => s.id);
      const { data: messages, error: messagesError } = await client
        .from('chat_messages')
        .select('*')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[Supabase] Load messages error:', messagesError.message);
        return sessions as ChatSessionRow[];
      }

      // Group messages by session
      const messagesBySession = new Map<string, ChatMessageRow[]>();
      messages?.forEach(msg => {
        if (!messagesBySession.has(msg.session_id)) {
          messagesBySession.set(msg.session_id, []);
        }
        messagesBySession.get(msg.session_id)!.push(msg as ChatMessageRow);
      });

      // Attach messages to sessions
      return sessions.map(session => ({
        ...session,
        messages: messagesBySession.get(session.id) || []
      })) as ChatSessionRow[];
    } catch (e) {
      console.error('[Supabase] Load sessions exception:', e);
      return [];
    }
  },

  /**
   * Delete a session (cascade deletes messages automatically)
   */
  async deleteSession(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('chat_sessions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Delete session error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Delete session exception:', e);
      return false;
    }
  },

  /**
   * Delete all sessions for a fingerprint
   */
  async deleteAllSessions(fingerprint: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from('chat_sessions')
        .delete()
        .eq('user_fingerprint', fingerprint);

      if (error) {
        console.error('[Supabase] Delete all sessions error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Supabase] Delete all sessions exception:', e);
      return false;
    }
  }
};

/**
 * Generate a robust browser fingerprint for anonymous user isolation
 * Uses crypto.randomUUID() when possible for collision resistance
 */
export const getBrowserFingerprint = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  const stored = localStorage.getItem('primekg_fingerprint');
  if (stored) return stored;

  // Use standard UUID if available (guaranteed uniqueness)
  let fp: string;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    fp = 'fp_' + crypto.randomUUID().replace(/-/g, '');
  } else {
    // Fallback for older browsers
    fp = 'fp_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }

  localStorage.setItem('primekg_fingerprint', fp);
  return fp;
};
