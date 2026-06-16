-- ============================================================================
-- Migration: Support Parallel Tool Use (too-use-result fix)
-- Date: 2025-06-15
-- Description: Update t_pending_client_call to support multiple tool_use
--              blocks per assistant turn by changing unique constraint
--              from call_id alone to composite (call_id, tool_use_id).
-- ============================================================================

-- Backup recommendation: Run this BEFORE executing migration
--   mysqldump ai_poc t_pending_client_call > backup_pending_client_call.sql

-- ============================================================================
-- Step 1: Drop old unique constraint on call_id
-- ============================================================================
ALTER TABLE t_pending_client_call
DROP INDEX IF EXISTS call_id;

-- ============================================================================
-- Step 2: Add composite unique constraint on (call_id, tool_use_id)
-- ============================================================================
-- This allows multiple pending records for the same call_id,
-- as long as each has a different tool_use_id (parallel tool use).
ALTER TABLE t_pending_client_call
ADD UNIQUE INDEX idx_callId_toolUseId (call_id, tool_use_id);

-- ============================================================================
-- Step 3: Clean up any pending client calls
-- ============================================================================
-- Rationale:
-- - Old pending calls don't have tool_use_id populated correctly
-- - Users will need to retry these conversations anyway (API contract changed)
-- - Safe operation: only affects in-progress tool calls (rare)
DELETE FROM t_pending_client_call WHERE status = 'pending';

-- Optional: Also clean up old completed calls (reduces table size)
-- DELETE FROM t_pending_client_call WHERE status = 'completed' AND updated_on < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- ============================================================================
-- Verification queries
-- ============================================================================

-- Check the new index exists
SHOW INDEX FROM t_pending_client_call WHERE Key_name = 'idx_callId_toolUseId';
-- Expected: 2 rows (call_id and tool_use_id columns)

-- Check no pending calls remain
SELECT COUNT(*) as pending_count FROM t_pending_client_call WHERE status = 'pending';
-- Expected: 0

-- Check table structure
DESCRIBE t_pending_client_call;
-- Expected: tool_use_id column exists (VARCHAR 255)

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================
-- If you need to rollback this migration:
--
-- ALTER TABLE t_pending_client_call
-- DROP INDEX IF EXISTS idx_callId_toolUseId;
--
-- ALTER TABLE t_pending_client_call
-- ADD UNIQUE INDEX call_id (call_id);
--
-- Note: You'll also need to restore from backup if you deleted records.
-- ============================================================================

-- Migration complete!
SELECT 'Migration 002_parallel_tool_use.sql completed successfully' as status;
