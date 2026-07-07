import { z } from 'zod';

/**
 * Context provided to server tool execution functions
 */
export interface ServerToolContext {
  /** User ID executing the tool */
  userId: string;
  /** User's role */
  userRole: string;
  /** Optional session ID */
  sessionId?: string;
  /** Unique request ID for tracing */
  requestId: string;
}

/**
 * Definition of a server tool
 */
export interface ServerToolDefinition<T extends z.ZodTypeAny> {
  /** Tool name (without server__ prefix) */
  name: string;
  /** Human-readable description for LLM */
  description: string;
  /** Zod schema for parameter validation */
  parameters: T;
  /** Execution function */
  execute: (params: z.infer<T>, context: ServerToolContext) => Promise<any>;
}

/**
 * Define a server tool with type-safe parameters
 *
 * @example
 * ```typescript
 * export const myTool = defineServerTool({
 *   name: 'my-tool',
 *   description: 'Does something useful',
 *   parameters: z.object({
 *     input: z.string(),
 *   }),
 *   execute: async (params, context) => {
 *     return { result: params.input };
 *   },
 * });
 * ```
 */
export function defineServerTool<T extends z.ZodTypeAny>(
  definition: ServerToolDefinition<T>,
): ServerToolDefinition<T> {
  // Validate tool name format: lowercase, alphanumeric and hyphens only
  if (!/^[a-z][a-z0-9-]*$/.test(definition.name)) {
    throw new Error(
      `Invalid tool name: ${definition.name}. Must match /^[a-z][a-z0-9-]*$/`,
    );
  }

  return definition;
}
