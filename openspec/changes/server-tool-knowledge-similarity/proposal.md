# Proposal: Server Tool Infrastructure and Knowledge Similarity Tool

## Overview

Add a new tool type "Server Tool" to complement existing MCP Tools and Client Tools. Server Tools are defined in the API module using TypeScript, automatically registered to the `t_tool` table on startup, and executable through the same tool execution flow as other tool types.

## Problem Statement

Currently, the system supports two tool types:
1. **MCP Tools**: External tools provided via Model Context Protocol servers
2. **Client Tools**: Frontend-defined tools executed in the browser

There is a need for backend-defined tools that:
- Execute server-side logic with access to database and internal services
- Are version-controlled as part of the codebase
- Auto-register on application startup
- Don't require external MCP server infrastructure

## Proposed Solution

### 1. Server Tool Infrastructure

**Tool Naming Convention:**
- Prefix: `server__`
- Example: `server__knowledge-similarity`

**Definition Pattern:**
```typescript
// packages/api/src/app/tools/knowledge-similarity.tool.ts
import { defineServerTool } from '../tool-registry/define-server-tool';
import { z } from 'zod';

export const knowledgeSimilarityTool = defineServerTool({
  name: 'knowledge-similarity',
  description: 'Search knowledge base using similarity matching',
  parameters: z.object({
    query: z.string().describe('Search query text'),
    tags: z.array(z.string()).optional().describe('Filter by tags'),
    topN: z.number().default(10).describe('Number of results to return'),
  }),
  execute: async (params, context) => {
    // Implementation with access to services, database, etc.
  },
});
```

**Registration:**
- Scan `packages/api/src/app/tools/*.tool.ts` on startup
- Insert/update records in `t_tool` with type = 'SERVER'
- Store JSON schema in `tool.input_schema`

**Execution Flow:**
- LLM requests tool use with `server__knowledge-similarity`
- API looks up tool in `t_tool`, identifies type as 'SERVER'
- Loads corresponding tool module and calls `execute()`
- Returns result to LLM

### 2. Knowledge Similarity Server Tool

**Tool Name:** `server__knowledge-similarity`

**Purpose:** Search knowledge base chunks using word_similarity (pg_trgm) and return multiple chunks per document.

**Parameters:**
- `query` (string, required): Search query text
- `tags` (string[], optional): Filter results by document tags
- `topN` (number, optional, default=10): Maximum number of chunks to return

**Behavior:**
- Query `t_document_chunk` using `word_similarity(query, chunk_content)`
- Order by similarity score descending
- Return up to `topN` chunks
- Each chunk is a separate result (multiple chunks from same document allowed)
- Include: document name, document path, chunk content, similarity score

**Example Response:**
```json
{
  "results": [
    {
      "documentId": 5,
      "documentName": "API Guide.md",
      "documentPath": "docs/api",
      "chunkIndex": 2,
      "chunkContent": "To deploy the application...",
      "score": 0.85
    },
    {
      "documentId": 5,
      "documentName": "API Guide.md",
      "documentPath": "docs/api",
      "chunkIndex": 7,
      "chunkContent": "Deployment configuration...",
      "score": 0.78
    }
  ],
  "total": 2
}
```

## Technical Design

### Database Schema

No changes needed to `t_tool` - existing schema supports this:
- `name`: 'server__knowledge-similarity'
- `type`: 'SERVER'
- `description`: Tool description
- `input_schema`: JSON schema generated from Zod

### File Structure

```
packages/api/src/app/
├── tool-registry/
│   ├── define-server-tool.ts          # defineServerTool function
│   ├── server-tool-registry.service.ts # Registration service
│   └── server-tool-executor.service.ts # Execution service
└── tools/
    └── knowledge-similarity.tool.ts    # First server tool
```

### Integration Points

1. **App Startup** (`app.module.ts`):
   - Import `ServerToolRegistryService`
   - Call `registerAllServerTools()` on module init

2. **Tool Execution** (`tool.service.ts` or similar):
   - Check tool type
   - If type === 'SERVER', delegate to `ServerToolExecutorService`

3. **LLM Tool Listing**:
   - Include server tools in available tools list sent to LLM
   - Use prefix `server__` to identify tool source

## Benefits

- **Type Safety**: Zod validation for parameters
- **Code Colocation**: Tool logic lives with backend code
- **Easy Testing**: Unit test server tools like any other service
- **No External Dependencies**: No need for MCP server setup
- **Full Backend Access**: Direct access to database, services, file system

## Risks & Mitigation

**Risk:** Tool name conflicts with MCP/Client tools
**Mitigation:** Enforce `server__` prefix validation

**Risk:** Performance impact of loading all tool modules on startup
**Mitigation:** Lazy-load tool executors, only register metadata on startup

**Risk:** Tool changes require API restart
**Mitigation:** Acceptable for version-controlled backend tools (not a hot-reload use case)

## Alternatives Considered

1. **MCP Server for Backend Tools**: Rejected - adds deployment complexity for internal tools
2. **Client Tools for All**: Rejected - some operations need server-side execution
3. **Hardcoded Tool Handlers**: Rejected - not extensible, no schema validation

## Success Criteria

- [ ] Server tools auto-register on API startup
- [ ] `server__knowledge-similarity` tool executable from chat
- [ ] Tool returns multiple chunks per document
- [ ] Parameter validation works via Zod schema
- [ ] Tool execution time < 500ms for typical queries

## Implementation Phases

### Phase 1: Server Tool Infrastructure
- Define `defineServerTool` function
- Create `ServerToolRegistryService`
- Create `ServerToolExecutorService`
- Integrate with tool execution flow

### Phase 2: Knowledge Similarity Tool
- Implement `knowledge-similarity.tool.ts`
- Add service method for chunk similarity search
- Test with various query patterns

### Phase 3: Documentation & Examples
- Document server tool development guide
- Add example tools
- Update architecture documentation
