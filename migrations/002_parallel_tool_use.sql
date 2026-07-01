-- ============================================================================
-- Migration: Support Parallel Tool Use (PostgreSQL version)
-- Date: 2025-06-15
-- Status: SUPERSEDED by main schema (database.sql already includes composite index)
-- Description: Update t_pending_client_call to support multiple tool_use
--              blocks per assistant turn by changing unique constraint
--              from call_id alone to composite (call_id, tool_use_id).
-- ============================================================================

-- NOTE: This migration is superseded. The new PostgreSQL schema in
-- docs/database.sql already includes the composite unique index
-- idx_pending_call_tooluse on (call_id, tool_use_id).
--
-- If you're migrating from an existing PostgreSQL database that has the
-- old single-column constraint, run the steps below. Otherwise, skip.

-- Backup recommendation: Run this BEFORE executing migration
--   pg_dump -t t_pending_client_call ai_poc > backup_pending_client_call.sql

-- ============================================================================
-- Step 1: Drop old unique constraint on call_id (if exists)
-- ============================================================================
DROP INDEX IF EXISTS call_id;

-- ============================================================================
-- Step 2: Add composite unique constraint on (call_id, tool_use_id)
-- ============================================================================
-- This allows multiple pending records for the same call_id,
-- as long as each has a different tool_use_id (parallel tool use).
CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_call_tooluse
  ON t_pending_client_call (call_id, tool_use_id);

-- ============================================================================
-- Step 3: Clean up any pending client calls
-- ============================================================================
-- Rationale:
-- - Old pending calls don't have tool_use_id populated correctly
-- - Users will need to retry these conversations anyway (API contract changed)
-- - Safe operation: only affects in-progress tool calls (rare)
DELETE FROM t_pending_client_call WHERE status = 'pending';

-- Optional: Also clean up old completed calls (reduces table size)
-- DELETE FROM t_pending_client_call
-- WHERE status = 'completed' AND updated_on < NOW() - INTERVAL '7 days';

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check the new index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 't_pending_client_call' AND indexname = 'idx_pending_call_tooluse';
-- Expected: 1 row showing the composite unique index

-- Check no pending calls remain
SELECT COUNT(*) as pending_count FROM t_pending_client_call WHERE status = 'pending';
-- Expected: 0

-- Check table structure
\d t_pending_client_call
-- Expected: tool_use_id column exists (VARCHAR 255)

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================
-- If you need to rollback this migration:
--
-- DROP INDEX IF EXISTS idx_pending_call_tooluse;
-- CREATE UNIQUE INDEX call_id ON t_pending_client_call (call_id);
--
-- Note: You'll also need to restore from backup if you deleted records.
-- ============================================================================

-- Migration complete!
SELECT 'Migration 002_parallel_tool_use.sql (PostgreSQL) completed successfully' as status;
