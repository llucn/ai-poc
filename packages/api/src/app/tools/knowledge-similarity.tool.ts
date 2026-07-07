import { defineServerTool } from '../tool-registry/define-server-tool';
import { z } from 'zod';

/**
 * Knowledge Similarity Tool
 *
 * Searches the knowledge base using similarity matching (pg_trgm word_similarity).
 * Returns multiple relevant chunks with their content and metadata.
 *
 * Use this when you need to find information across the knowledge base.
 * It can return multiple chunks from the same document if they all match the query.
 *
 * NOTE: The actual execution is handled in SessionService.executeTool()
 * which calls KnowledgeSimilarityToolService directly. This definition
 * provides the schema and metadata for tool registration.
 */

const KnowledgeSimilarityParams = z.object({
  query: z
    .string()
    .min(1)
    .describe('Search query text. Can be a word, phrase, or question.'),
  tags: z
    .array(z.string())
    .optional()
    .describe(
      'Optional array of tags to filter results. Only documents with any of these tags will be returned.',
    ),
  topN: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of chunks to return (1-50, default 10)'),
});

export const knowledgeSimilarityTool = defineServerTool({
  name: 'knowledge-similarity',
  description:
    'Search knowledge base using similarity matching. Returns multiple relevant document chunks with their content, metadata, and similarity scores. Use this to find information across uploaded documents. Multiple chunks from the same document can be returned if they all match the query well.',
  parameters: KnowledgeSimilarityParams,
  execute: async (params, context) => {
    // This execute function is not used directly.
    // Execution is routed through SessionService.executeTool()
    // which calls KnowledgeSimilarityToolService.
    // This placeholder ensures the tool definition is valid.
    return {
      error: 'Direct execution not supported. Tool should be called through SessionService.'
    };
  },
});
