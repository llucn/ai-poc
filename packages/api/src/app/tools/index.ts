import { ServerToolDefinition } from '../tool-registry/define-server-tool';
import { knowledgeSimilarityTool } from './knowledge-similarity.tool';

/**
 * Registry of all server tools.
 * Add new tools here to make them available for registration.
 */
export const SERVER_TOOLS: ServerToolDefinition<any>[] = [
  knowledgeSimilarityTool,
];
