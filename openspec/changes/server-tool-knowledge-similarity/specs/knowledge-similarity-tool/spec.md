# Spec: Knowledge Similarity Tool

## Overview

The `knowledge-similarity` server tool searches the knowledge base using PostgreSQL trigram similarity matching and returns multiple relevant chunks with their content and metadata.

## Tool Definition

### File Location

`packages/api/src/app/tools/knowledge-similarity.tool.ts`

### Implementation

```typescript
import { defineServerTool } from '../tool-registry/define-server-tool';
import { z } from 'zod';

const KnowledgeSimilarityParams = z.object({
  query: z.string().min(1).describe('Search query text'),
  tags: z.array(z.string()).optional().describe('Filter results by document tags'),
  topN: z.number().int().min(1).max(50).default(10).describe('Maximum number of chunks to return'),
});

export const knowledgeSimilarityTool = defineServerTool({
  name: 'knowledge-similarity',
  description: 'Search knowledge base using similarity matching. Returns multiple relevant chunks with their content and metadata. Use this when you need to find information across the knowledge base.',
  parameters: KnowledgeSimilarityParams,
  execute: async (params, context) => {
    // Get service from context (injected during execution)
    const service = getKnowledgeSimilarityService(context);
    return await service.search(params.query, params.tags, params.topN);
  },
});
```

## Service Implementation

### File Location

`packages/api/src/app/tools/knowledge-similarity-tool.service.ts`

### Code

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunk } from '../knowledge/document-chunk.entity';

export interface SimilaritySearchResult {
  results: Array<{
    documentId: number;
    documentName: string;
    documentPath: string;
    documentType: number;
    chunkIndex: number;
    chunkContent: string;
    score: number;
  }>;
  total: number;
}

@Injectable()
export class KnowledgeSimilarityToolService {
  constructor(
    @InjectRepository(DocumentChunk)
    private chunkRepo: Repository<DocumentChunk>,
  ) {}

  async search(
    query: string,
    tags?: string[],
    topN = 10,
  ): Promise<SimilaritySearchResult> {
    const qb = this.chunkRepo.createQueryBuilder('c');

    // Select chunk fields
    qb.select([
      'c.id',
      'c.documentId',
      'c.documentName',
      'c.documentType',
      'c.documentPath',
      'c.chunkIndex',
      'c.chunkContent',
    ]);

    // Add similarity score
    qb.addSelect('word_similarity(:query, c.chunk_content)', 'score');

    // Filter by similarity threshold
    qb.where('word_similarity(:query, c.chunk_content) > 0.2', { query });

    // Optional tag filter
    if (tags && tags.length > 0) {
      qb.andWhere("c.document_tags->'tags' ?| :tags", { tags });
    }

    // Order by score descending
    qb.orderBy('score', 'DESC');

    // Limit results
    qb.limit(topN);

    // Execute query
    const results = await qb.getRawAndEntities();

    // Format response
    return {
      results: results.entities.map((chunk, i) => ({
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        documentPath: chunk.documentPath,
        documentType: chunk.documentType,
        chunkIndex: chunk.chunkIndex,
        chunkContent: chunk.chunkContent,
        score: parseFloat(results.raw[i].score),
      })),
      total: results.entities.length,
    };
  }
}
```

## Module Configuration

### Update ToolsModule

Create or update `packages/api/src/app/tools/tools.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunk } from '../knowledge/document-chunk.entity';
import { KnowledgeSimilarityToolService } from './knowledge-similarity-tool.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunk])],
  providers: [KnowledgeSimilarityToolService],
  exports: [KnowledgeSimilarityToolService],
})
export class ToolsModule {}
```

### Context Injection

Update tool execution to inject service:

```typescript
// In ServerToolExecutorService or similar

private buildContext(userId: string, sessionId?: string): ServerToolContext {
  return {
    userId,
    userRole: this.getUserRole(userId),
    sessionId,
    requestId: this.generateRequestId(),
    // Inject services needed by tools
    services: {
      knowledgeSimilarity: this.knowledgeSimilarityService,
    },
  };
}
```

## API Parameters

### query (required)

- **Type:** `string`
- **Description:** Search query text
- **Validation:** Minimum 1 character
- **Example:** `"deploy application"`

### tags (optional)

- **Type:** `string[]`
- **Description:** Filter results by document tags
- **Default:** `undefined` (no filtering)
- **Example:** `["backend", "deployment"]`

### topN (optional)

- **Type:** `number`
- **Description:** Maximum number of chunks to return
- **Validation:** Integer between 1 and 50
- **Default:** `10`
- **Example:** `20`

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "documentId": 5,
        "documentName": "Deployment Guide.md",
        "documentPath": "docs/deployment",
        "documentType": 2,
        "chunkIndex": 3,
        "chunkContent": "To deploy the application to production, follow these steps: 1. Build the Docker image...",
        "score": 0.8542
      },
      {
        "documentId": 5,
        "documentName": "Deployment Guide.md",
        "documentPath": "docs/deployment",
        "documentType": 2,
        "chunkIndex": 7,
        "chunkContent": "Configuration for deployment environments is stored in .env files...",
        "score": 0.7823
      },
      {
        "documentId": 12,
        "documentName": "API Setup.md",
        "documentPath": "docs/api",
        "documentType": 2,
        "chunkIndex": 2,
        "chunkContent": "Deploying the API server requires Node.js 18+ and PostgreSQL 16...",
        "score": 0.6915
      }
    ],
    "total": 3
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Parameter validation failed: query is required"
}
```

## Database Query

### SQL Generated

```sql
SELECT
  c.id,
  c.document_id,
  c.document_name,
  c.document_type,
  c.document_path,
  c.chunk_index,
  c.chunk_content,
  word_similarity($1, c.chunk_content) AS score
FROM t_document_chunk c
WHERE word_similarity($1, c.chunk_content) > 0.2
  AND c.document_tags->'tags' ?| $2  -- only if tags provided
ORDER BY score DESC
LIMIT $3
```

### Parameters

- `$1`: `query` string
- `$2`: `tags` array (if provided)
- `$3`: `topN` number

### Index Usage

Uses existing GIN index on `chunk_content`:

```sql
CREATE INDEX idx_chunk_content_trgm ON t_document_chunk
USING gin (chunk_content gin_trgm_ops);
```

## Behavior

### Multiple Chunks Per Document

Unlike the search page (which returns only the highest-scoring chunk per document), this tool returns **all matching chunks** up to `topN` limit. This allows the LLM to see multiple relevant sections from the same document if they all match the query.

**Example:**
- Query: "authentication"
- Document "API Guide.md" has 3 chunks matching with scores: 0.85, 0.78, 0.65
- All 3 chunks are returned (if topN >= 3)

### Similarity Threshold

Only chunks with `word_similarity > 0.2` are returned. This threshold:
- Filters out irrelevant matches
- Allows partial word matches
- Works well for queries of 3+ words

### Tag Filtering

When `tags` array is provided:
- Only chunks from documents tagged with ANY of the specified tags are returned
- Uses PostgreSQL JSONB `?|` operator (OR logic)
- Example: `tags: ["backend", "api"]` matches documents tagged with "backend" OR "api"

## Testing

### Unit Test

```typescript
// packages/api/src/app/tools/knowledge-similarity-tool.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KnowledgeSimilarityToolService } from './knowledge-similarity-tool.service';
import { DocumentChunk } from '../knowledge/document-chunk.entity';

describe('KnowledgeSimilarityToolService', () => {
  let service: KnowledgeSimilarityToolService;
  let mockRepo: any;

  beforeEach(async () => {
    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({
          entities: [
            {
              id: 1,
              documentId: 5,
              documentName: 'test.md',
              documentPath: 'docs',
              documentType: 2,
              chunkIndex: 0,
              chunkContent: 'test content',
            },
          ],
          raw: [{ score: 0.85 }],
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeSimilarityToolService,
        {
          provide: getRepositoryToken(DocumentChunk),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<KnowledgeSimilarityToolService>(KnowledgeSimilarityToolService);
  });

  it('should return similarity search results', async () => {
    const result = await service.search('test query', undefined, 10);

    expect(result.results).toHaveLength(1);
    expect(result.results[0].score).toBe(0.85);
    expect(result.results[0].documentName).toBe('test.md');
    expect(result.total).toBe(1);
  });

  it('should apply tag filter when provided', async () => {
    const qb = mockRepo.createQueryBuilder();

    await service.search('test', ['backend'], 10);

    expect(qb.andWhere).toHaveBeenCalledWith(
      "c.document_tags->'tags' ?| :tags",
      { tags: ['backend'] }
    );
  });

  it('should limit results to topN', async () => {
    const qb = mockRepo.createQueryBuilder();

    await service.search('test', undefined, 5);

    expect(qb.limit).toHaveBeenCalledWith(5);
  });
});
```

### Integration Test

```typescript
describe('knowledge-similarity tool (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Setup test app with real database
  });

  it('should execute via tool service', async () => {
    const result = await request(app.getHttpServer())
      .post('/tools/execute')
      .send({
        toolName: 'server__knowledge-similarity',
        params: {
          query: 'authentication',
          topN: 5,
        },
      });

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.data.results).toBeDefined();
    expect(result.body.data.results.length).toBeLessThanOrEqual(5);
  });
});
```

## Performance

### Expected Performance

- **Query time:** 50-200ms for typical knowledge base (<1000 documents)
- **Bottleneck:** word_similarity calculation on all chunks
- **Optimization:** GIN index on chunk_content reduces scan time

### Monitoring

Log slow queries (>500ms):

```typescript
const startTime = Date.now();
const result = await service.search(query, tags, topN);
const duration = Date.now() - startTime;

if (duration > 500) {
  this.logger.warn({
    message: 'Slow knowledge similarity search',
    query,
    duration,
    resultCount: result.total,
  });
}
```

## Usage Example

### From Chat

User asks: "How do I deploy the application?"

LLM decides to use the tool:

```json
{
  "tool_use": {
    "name": "server__knowledge-similarity",
    "input": {
      "query": "deploy application production",
      "topN": 5
    }
  }
}
```

Tool returns:

```json
{
  "results": [
    {
      "documentName": "Deployment Guide.md",
      "chunkContent": "To deploy to production: 1. Build image 2. Push to registry...",
      "score": 0.85
    },
    ...
  ]
}
```

LLM synthesizes response using the retrieved chunks.

## Limitations

### Current Limitations

1. **No semantic understanding:** Uses character-level trigram similarity, not meaning
2. **Short query penalty:** Very short queries (<3 chars) may have low scores
3. **No query expansion:** Doesn't handle synonyms or related terms
4. **Language:** Optimized for English text

### Future Enhancements

1. Add embedding-based semantic search (pgvector)
2. Implement query preprocessing (stemming, stopword removal)
3. Add relevance feedback mechanism
4. Support multi-language similarity
