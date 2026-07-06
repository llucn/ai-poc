# Design: Server Tool Infrastructure and Knowledge Similarity Tool

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         NestJS Application                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Tool Execution Flow                        │    │
│  │                                                          │    │
│  │  LLM Request → ToolService → Type Router → Executor    │    │
│  │                                 │                        │    │
│  │                                 ├─ MCP Executor         │    │
│  │                                 ├─ Client Tool Proxy    │    │
│  │                                 └─ Server Tool Executor │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          Server Tool Registry (Startup)                 │    │
│  │                                                          │    │
│  │  1. Scan packages/api/src/app/tools/*.tool.ts          │    │
│  │  2. Import each tool module                             │    │
│  │  3. Extract metadata + schema                           │    │
│  │  4. Upsert to t_tool table                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │          Server Tools                                   │    │
│  │                                                          │    │
│  │  knowledge-similarity.tool.ts                           │    │
│  │  [future tools...]                                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Module Structure

### Tool Registry Module

**File:** `packages/api/src/app/tool-registry/tool-registry.module.ts`

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Tool])],
  providers: [
    ServerToolRegistryService,
    ServerToolExecutorService,
  ],
  exports: [ServerToolExecutorService],
})
export class ToolRegistryModule implements OnModuleInit {
  constructor(private registry: ServerToolRegistryService) {}

  async onModuleInit() {
    await this.registry.registerAllServerTools();
  }
}
```

### Define Server Tool Function

**File:** `packages/api/src/app/tool-registry/define-server-tool.ts`

```typescript
import { z } from 'zod';

export interface ServerToolDefinition<T extends z.ZodTypeAny> {
  name: string;
  description: string;
  parameters: T;
  execute: (params: z.infer<T>, context: ServerToolContext) => Promise<any>;
}

export interface ServerToolContext {
  userId: string;
  sessionId?: string;
  // Add other context as needed
}

export function defineServerTool<T extends z.ZodTypeAny>(
  definition: ServerToolDefinition<T>
): ServerToolDefinition<T> {
  return definition;
}
```

### Server Tool Registry Service

**File:** `packages/api/src/app/tool-registry/server-tool-registry.service.ts`

**Responsibilities:**
- Scan tool files at startup
- Extract tool metadata and schemas
- Upsert to `t_tool` table
- Cache tool definitions in memory

**Key Methods:**
```typescript
class ServerToolRegistryService {
  async registerAllServerTools(): Promise<void>
  private async scanToolFiles(): Promise<string[]>
  private async loadToolModule(filePath: string): Promise<ServerToolDefinition<any>>
  private zodToJsonSchema(schema: z.ZodTypeAny): object
  private async upsertToolToDatabase(tool: ServerToolDefinition<any>): Promise<void>
}
```

### Server Tool Executor Service

**File:** `packages/api/src/app/tool-registry/server-tool-executor.service.ts`

**Responsibilities:**
- Load and execute server tools by name
- Validate parameters against Zod schema
- Handle errors and return formatted responses

**Key Methods:**
```typescript
class ServerToolExecutorService {
  async execute(toolName: string, params: unknown, context: ServerToolContext): Promise<any>
  private getToolDefinition(toolName: string): ServerToolDefinition<any>
  private validateParams(tool: ServerToolDefinition<any>, params: unknown): any
}
```

## Database Schema

### t_tool Table

Existing schema (no changes):

```sql
CREATE TABLE t_tool (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- 'MCP', 'CLIENT', 'SERVER'
  description TEXT,
  input_schema JSONB,
  created_on TIMESTAMP DEFAULT NOW(),
  updated_on TIMESTAMP
);
```

**Server Tool Example Row:**
```json
{
  "name": "server__knowledge-similarity",
  "type": "SERVER",
  "description": "Search knowledge base using similarity matching",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query text"
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Filter by tags"
      },
      "topN": {
        "type": "number",
        "default": 10,
        "description": "Number of results to return"
      }
    },
    "required": ["query"]
  }
}
```

## Knowledge Similarity Tool Implementation

### Tool Definition File

**File:** `packages/api/src/app/tools/knowledge-similarity.tool.ts`

```typescript
import { defineServerTool } from '../tool-registry/define-server-tool';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../knowledge/document-chunk.entity';

const KnowledgeSimilarityParams = z.object({
  query: z.string().describe('Search query text'),
  tags: z.array(z.string()).optional().describe('Filter by document tags'),
  topN: z.number().min(1).max(50).default(10).describe('Number of results to return'),
});

export const knowledgeSimilarityTool = defineServerTool({
  name: 'knowledge-similarity',
  description: 'Search knowledge base using similarity matching. Returns multiple relevant chunks with their content and metadata.',
  parameters: KnowledgeSimilarityParams,
  execute: async (params, context) => {
    // Implementation delegated to KnowledgeSimilarityToolService
    const { query, tags, topN } = params;

    // Access via dependency injection in actual implementation
    const service = getServiceFromContext(context);
    return await service.searchSimilar(query, tags, topN);
  },
});
```

### Service Implementation

**File:** `packages/api/src/app/tools/knowledge-similarity-tool.service.ts`

```typescript
@Injectable()
export class KnowledgeSimilarityToolService {
  constructor(
    @InjectRepository(DocumentChunk)
    private chunkRepo: Repository<DocumentChunk>,
  ) {}

  async searchSimilar(
    query: string,
    tags?: string[],
    topN = 10,
  ) {
    const qb = this.chunkRepo.createQueryBuilder('c');

    qb.select([
      'c.id',
      'c.documentId',
      'c.documentName',
      'c.documentType',
      'c.documentPath',
      'c.chunkIndex',
      'c.chunkContent',
    ]);
    qb.addSelect('word_similarity(:query, c.chunk_content)', 'score');
    qb.where('word_similarity(:query, c.chunk_content) > 0.2', { query });

    if (tags && tags.length > 0) {
      qb.andWhere("c.document_tags->'tags' ?| :tags", { tags });
    }

    qb.orderBy('score', 'DESC');
    qb.limit(topN);

    const results = await qb.getRawAndEntities();

    return {
      results: results.entities.map((chunk, i) => ({
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        documentPath: chunk.documentPath,
        chunkIndex: chunk.chunkIndex,
        chunkContent: chunk.chunkContent,
        score: results.raw[i].score,
      })),
      total: results.entities.length,
    };
  }
}
```

## Integration with Tool Execution Flow

### Modified Tool Service

**File:** `packages/api/src/app/tool/tool.service.ts` (or similar)

```typescript
@Injectable()
export class ToolService {
  constructor(
    private serverToolExecutor: ServerToolExecutorService,
    // ... other executors
  ) {}

  async executeTool(toolName: string, params: unknown, context: ExecutionContext) {
    const tool = await this.findToolByName(toolName);

    switch (tool.type) {
      case 'MCP':
        return await this.mcpExecutor.execute(toolName, params);
      case 'CLIENT':
        return { clientToolRequest: { name: toolName, params } };
      case 'SERVER':
        return await this.serverToolExecutor.execute(
          toolName.replace('server__', ''),
          params,
          this.buildServerToolContext(context)
        );
      default:
        throw new Error(`Unknown tool type: ${tool.type}`);
    }
  }
}
```

## Error Handling

### Parameter Validation Errors

```typescript
try {
  const validated = tool.parameters.parse(params);
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      error: 'Invalid parameters',
      details: error.errors,
    };
  }
  throw error;
}
```

### Execution Errors

```typescript
try {
  const result = await tool.execute(validated, context);
  return { success: true, data: result };
} catch (error) {
  return {
    success: false,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}
```

## Performance Considerations

### Tool Registry Caching

- Load all tool modules once at startup
- Cache tool definitions in memory (Map<string, ServerToolDefinition>)
- No file I/O during tool execution

### Database Query Optimization

- `word_similarity()` uses GIN index on `chunk_content` (already created)
- Limit results with `LIMIT` clause
- Consider adding materialized view for frequently searched content

### Execution Timeouts

```typescript
const TOOL_TIMEOUT_MS = 30000; // 30 seconds

const result = await Promise.race([
  tool.execute(params, context),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Tool execution timeout')), TOOL_TIMEOUT_MS)
  ),
]);
```

## Security Considerations

### Input Validation

- All parameters validated via Zod schema
- SQL injection prevented by TypeORM parameterized queries
- topN capped at 50 to prevent excessive data retrieval

### Access Control

- Tool execution context includes userId
- Check user permissions before tool execution
- Log all tool invocations for audit

### Rate Limiting

```typescript
@Injectable()
export class ServerToolExecutorService {
  private rateLimiter = new Map<string, number[]>();

  private async checkRateLimit(userId: string): Promise<void> {
    const now = Date.now();
    const userCalls = this.rateLimiter.get(userId) || [];
    const recentCalls = userCalls.filter(t => now - t < 60000); // 1 minute window

    if (recentCalls.length >= 30) {
      throw new Error('Rate limit exceeded');
    }

    recentCalls.push(now);
    this.rateLimiter.set(userId, recentCalls);
  }
}
```

## Testing Strategy

### Unit Tests

**Tool Definition:**
```typescript
describe('knowledgeSimilarityTool', () => {
  it('should validate required query parameter', () => {
    expect(() => tool.parameters.parse({})).toThrow();
  });

  it('should use default topN value', () => {
    const result = tool.parameters.parse({ query: 'test' });
    expect(result.topN).toBe(10);
  });
});
```

**Service:**
```typescript
describe('KnowledgeSimilarityToolService', () => {
  it('should return top N similar chunks', async () => {
    const result = await service.searchSimilar('deploy', [], 5);
    expect(result.results).toHaveLength(5);
    expect(result.results[0].score).toBeGreaterThan(result.results[4].score);
  });
});
```

### Integration Tests

```typescript
describe('Server Tool Execution', () => {
  it('should execute knowledge-similarity tool via API', async () => {
    const response = await request(app.getHttpServer())
      .post('/tools/execute')
      .send({
        toolName: 'server__knowledge-similarity',
        params: { query: 'authentication', topN: 3 }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.results).toHaveLength(3);
  });
});
```

## Migration Path

### Phase 1: Infrastructure (No Breaking Changes)
- Add tool registry module
- Implement defineServerTool
- Register empty tool list (no tools yet)

### Phase 2: First Tool (Additive)
- Implement knowledge-similarity tool
- Verify registration on startup
- Enable in tool execution flow

### Phase 3: Stabilization
- Add monitoring/logging
- Performance tuning
- Documentation

## Monitoring & Observability

### Metrics to Track

- Tool registration count on startup
- Tool execution duration (p50, p95, p99)
- Tool execution error rate
- Parameter validation failure rate

### Logging

```typescript
logger.info('Server tool executed', {
  toolName: tool.name,
  userId: context.userId,
  duration: Date.now() - startTime,
  resultSize: JSON.stringify(result).length,
});
```

## Future Enhancements

1. **Hot Reload**: Watch tool files and re-register on changes (dev mode only)
2. **Tool Versioning**: Support multiple versions of same tool
3. **Tool Composition**: Allow tools to call other tools
4. **Streaming Results**: Support streaming large result sets
5. **Caching Layer**: Cache frequent queries with TTL
