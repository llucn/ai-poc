-- ============================================================================
-- Migration: Enable pg_trgm extension for similarity search
-- Date: 2026-07-06
-- Description: Enable PostgreSQL pg_trgm extension for trigram-based
--              text similarity search
-- ============================================================================

-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on chunk_content for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_chunk_content_trgm ON t_document_chunk USING gin (chunk_content gin_trgm_ops);

-- Verification
SELECT 'Migration 004_enable_pg_trgm.sql completed successfully' as status;
