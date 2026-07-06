-- ============================================================================
-- Migration: Knowledge Management tables
-- Date: 2026-07-04
-- Description: Create t_document and t_document_chunk tables for knowledge
--              management feature with full-text search support.
-- ============================================================================

-- ============================================================================
-- Step 1: Create t_document table
-- ============================================================================
CREATE TABLE t_document (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type INT NOT NULL,  -- 1: directory, 2: file, 3: attachment
  parent_id INT NOT NULL DEFAULT 0,  -- 0 for ROOT
  path VARCHAR(255) NOT NULL,
  tags JSONB,
  size INT NOT NULL DEFAULT 0,
  content TEXT,
  created_on TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Unique constraint: no duplicate names under same parent
CREATE UNIQUE INDEX idx_document_parent_name ON t_document (parent_id, name);

-- Index for path lookups
CREATE UNIQUE INDEX idx_document_path ON t_document (path);

-- Index for parent_id queries (list children)
CREATE INDEX idx_document_parent_id ON t_document (parent_id);

-- ============================================================================
-- Step 2: Create t_document_chunk table
-- ============================================================================
CREATE TABLE t_document_chunk (
  id SERIAL PRIMARY KEY,
  document_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  document_type INT NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  document_tags JSONB,
  chunk_index INT NOT NULL,
  chunk_content TEXT,
  search_vector TSVECTOR,
  created_on TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_on TIMESTAMP,
  updated_by VARCHAR(255)
);

-- Unique constraint: one chunk per index per document
CREATE UNIQUE INDEX idx_chunk_document_index ON t_document_chunk (document_id, chunk_index);

-- GIN index for full-text search
CREATE INDEX idx_chunk_search_vector ON t_document_chunk USING GIN (search_vector);

-- Index for document_id lookups
CREATE INDEX idx_chunk_document_id ON t_document_chunk (document_id);

-- ============================================================================
-- Verification
-- ============================================================================
SELECT 'Migration 003_knowledge_management.sql completed successfully' as status;
