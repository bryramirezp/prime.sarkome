-- PrimeKG Chat Sessions Database Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/YOUR_PROJECT/sql/new)
-- 
-- Design follows PostgreSQL best practices:
-- - 3NF (Third Normal Form) compliance
-- - Strategic denormalization for read performance
-- - JSONB used only for truly dynamic/unknown schema data
-- - Proper indexing for chat application query patterns

-- ============================================================================
-- 1. Users Table (Anonymous Fingerprint-based)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  fingerprint TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries (e.g., delete inactive users)
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at DESC);

-- ============================================================================
-- 2. Chat Sessions Table
-- ============================================================================
-- Normalized: session metadata only (no messages embedded)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_fingerprint TEXT NOT NULL REFERENCES users(fingerprint) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON chat_sessions(user_fingerprint, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_pinned ON chat_sessions(user_fingerprint, pinned, updated_at DESC);

-- ============================================================================
-- 3. Chat Messages Table
-- ============================================================================
-- Fully normalized: one message per row
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Optional: Related data from tool execution (graph data, hypothesis results, etc.)
  -- Using JSONB here is appropriate because this structure is truly dynamic
  -- and depends on which tools the AI used (could be GraphData, RepurposingData, etc.)
  related_data JSONB,
  
  -- Optional: Execution trace for debugging
  trace TEXT[]
);

-- Critical indexes for chat message queries
CREATE INDEX IF NOT EXISTS idx_messages_session_time ON chat_messages(session_id, created_at ASC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write access
-- Note: This is simple but not secure. For production, use proper auth.
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sessions" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update session's updated_at timestamp when messages are added
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session timestamp
DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON chat_messages;
CREATE TRIGGER trigger_update_session_timestamp
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_timestamp();

-- ============================================================================
-- Denormalization Decision: Message Count
-- ============================================================================
-- We could add a `message_count` column to chat_sessions to avoid COUNT(*) queries,
-- but with proper indexing, COUNT on indexed columns is fast enough.
-- Only add if you experience performance issues with large sessions (10k+ messages).
-- 
-- ALTER TABLE chat_sessions ADD COLUMN message_count INT NOT NULL DEFAULT 0;
-- Then update the trigger to increment/decrement this counter.

-- ============================================================================
-- Performance Notes
-- ============================================================================
-- 1. This schema is fully normalized (3NF):
--    - No transitive dependencies
--    - Each non-key attribute depends only on the primary key
--    - Users, Sessions, and Messages are separate entities
--
-- 2. Strategic denormalization applied:
--    - `related_data` JSONB: Tool results are truly dynamic schema
--    - `trace` array: Small, rarely queried, no need for separate table
--
-- 3. Index strategy optimized for:
--    - Loading user's sessions sorted by time: idx_sessions_user_updated
--    - Loading session messages in chronological order: idx_messages_session_time
--    - Filtering pinned sessions: idx_sessions_pinned
--
-- 4. Cleanup strategy:
--    - Cascade deletes: Deleting a session deletes all messages
--    - idx_users_last_active: For purging inactive anonymous users

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Check if tables were created successfully:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'chat_%' OR table_name = 'users';

-- Check indexes:
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('users', 'chat_sessions', 'chat_messages');
