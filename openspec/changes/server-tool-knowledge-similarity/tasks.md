# Tasks: Server Tool Infrastructure and Knowledge Similarity Tool

## Phase 1: Server Tool Infrastructure

### Tool Registry Core
- [ ] Create `packages/api/src/app/tool-registry/` directory
- [ ] Implement `define-server-tool.ts` with `defineServerTool` function and type definitions
- [ ] Implement `server-tool-registry.service.ts` with tool scanning and registration logic
- [ ] Implement `server-tool-executor.service.ts` with parameter validation and execution
- [ ] Create `tool-registry.module.ts` with `OnModuleInit` hook for auto-registration
- [ ] Add `zod-to-json-schema` dependency to `package.json`
- [ ] Add `glob` dependency to `package.json`

### Database Integration
- [ ] Create or locate `Tool` entity (`packages/api/src/app/entities/tool.entity.ts`)
- [ ] Verify `t_tool` table supports 'SERVER' type in `type` column
- [ ] Test tool upsert logic (insert new, update existing)

### Module Integration
- [ ] Import `ToolRegistryModule` in `AppModule`
- [ ] Verify tools are registered on application startup
- [ ] Add logging for registration success/failure

### Testing
- [ ] Write unit tests for `defineServerTool` validation
- [ ] Write unit tests for `ServerToolRegistryService` (tool scanning, loading, upserting)
- [ ] Write unit tests for `ServerToolExecutorService` (validation, execution, timeout)
- [ ] Test error handling for invalid tool definitions
- [ ] Test parameter validation with various Zod schemas

## Phase 2: Tool Execution Integration

### Tool Service Update
- [ ] Locate existing tool execution service (e.g., `ToolService`)
- [ ] Add `ServerToolExecutorService` as dependency
- [ ] Update tool execution router to handle 'SERVER' type
- [ ] Implement `ServerToolContext` construction (userId, userRole, sessionId, requestId)
- [ ] Add error handling for server tool execution failures

### Service Injection
- [ ] Design pattern for injecting services into tool execution context
- [ ] Implement service provider mechanism for tools to access repositories/services
- [ ] Update `ServerToolContext` interface to include service accessor

### Testing
- [ ] Write integration test for SERVER tool execution via API
- [ ] Test tool execution with valid/invalid parameters
- [ ] Test timeout behavior
- [ ] Test error response format

## Phase 3: Knowledge Similarity Tool

### Service Implementation
- [ ] Create `packages/api/src/app/tools/` directory
- [ ] Implement `knowledge-similarity-tool.service.ts` with similarity search query
- [ ] Use `word_similarity()` function with threshold 0.2
- [ ] Implement tag filtering with JSONB `?|` operator
- [ ] Implement topN limit and score ordering
- [ ] Format response with document metadata and scores

### Tool Definition
- [ ] Create `knowledge-similarity.tool.ts` with `defineServerTool`
- [ ] Define Zod schema for parameters (query, tags, topN)
- [ ] Implement execute function calling the service
- [ ] Add comprehensive tool description for LLM

### Module Configuration
- [ ] Create `tools.module.ts` importing DocumentChunk entity
- [ ] Export `KnowledgeSimilarityToolService`
- [ ] Import `ToolsModule` in `AppModule`

### Testing
- [ ] Write unit tests for `KnowledgeSimilarityToolService`
- [ ] Mock query builder and test SQL generation
- [ ] Test tag filtering logic
- [ ] Test topN limit
- [ ] Test score parsing and response formatting
- [ ] Write integration test with real database
- [ ] Test with various query lengths and patterns
- [ ] Test with/without tag filters

## Phase 4: Documentation & Polish

### Code Documentation
- [ ] Add JSDoc comments to all public APIs
- [ ] Document tool definition pattern with examples
- [ ] Create developer guide for adding new server tools

### Logging & Monitoring
- [ ] Add structured logging for tool registration
- [ ] Add structured logging for tool execution (duration, success/failure)
- [ ] Log slow queries (>500ms) with warning level
- [ ] Add error logging with stack traces (dev mode only)

### Performance
- [ ] Verify GIN index on `chunk_content` is being used
- [ ] Test query performance with large knowledge base
- [ ] Add query timeout configuration (default 30s)

### Security
- [ ] Verify parameter validation prevents injection
- [ ] Verify topN cap (max 50) is enforced
- [ ] Consider adding rate limiting for tool executions
- [ ] Audit logging for all tool invocations

## Phase 5: End-to-End Testing

### Manual Testing
- [ ] Start API server and verify tools register on startup
- [ ] Check database: verify `server__<id>__knowledge-similarity` exists in `t_tool` (with actual ID)
- [ ] Execute tool via chat UI with test query
- [ ] Verify response includes multiple chunks with scores
- [ ] Test with tag filter
- [ ] Test with various topN values (1, 10, 50)

### Edge Cases
- [ ] Test with empty query string (should fail validation)
- [ ] Test with topN > 50 (should be capped or fail validation)
- [ ] Test with non-existent tags (should return empty results)
- [ ] Test with very long query (>1000 chars)
- [ ] Test with special characters in query

### Error Scenarios
- [ ] Test tool execution when database is unavailable
- [ ] Test tool execution timeout (simulate slow query)
- [ ] Test parameter validation errors
- [ ] Verify error responses include helpful messages

## Phase 6: Documentation Updates

### Architecture Docs
- [ ] Update system architecture diagram to include Server Tools
- [ ] Document tool execution flow (MCP vs Client vs Server)
- [ ] Add tool development guide

### API Documentation
- [ ] Document tool execution endpoint
- [ ] Document server tool response format
- [ ] Add example requests/responses

### Knowledge Base
- [ ] Add entry explaining server tools to internal docs
- [ ] Document knowledge-similarity tool usage
- [ ] Add troubleshooting guide

## Success Criteria

- [x] Server tools auto-register on API startup
- [x] `server__<id>__knowledge-similarity` tool executable from chat (with actual ID)
- [x] Tool returns multiple chunks per document
- [x] Parameter validation works via Zod schema
- [x] Tool execution time < 500ms for typical queries
- [x] All unit tests passing
- [x] Integration tests passing
- [x] Documentation complete
