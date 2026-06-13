// Client Tool execution registry (Phase 2: defineClientTool with zod).
//
// Client Tools run in the browser. When the agent loop suspends on a
// `client__<toolId>__<toolName>` action, the server pushes a `client_call`
// SSE event; the chat page dispatches it here. Each tool is registered by its
// actual tool name (the `<toolName>` part, without the `client__<id>__` prefix
// — the server strips that before sending the event).
//
// Phase 2: tools are declared with defineClientTool({ name, description,
// parameters(zod), handler }), and the registry holds both metadata and handler.
// On app mount, getAllClientTools() syncs the metadata to the backend via
// POST /client-tools/sync; the backend reconciles them into t_tool (source='registry').

import { z } from 'zod';

export type ClientToolHandler = (params: any) => Promise<unknown> | unknown;

// Result of executing a client tool: exactly one of result / error is set.
export type ClientToolOutcome = { result: unknown } | { error: string };

// Internal registry entry: metadata + handler.
interface ClientToolEntry<T extends z.ZodTypeAny = z.ZodTypeAny> {
  name: string;
  description: string;
  parameters: T;
  handler: (params: z.infer<T>) => Promise<unknown> | unknown;
}

const registry = new Map<string, ClientToolEntry>();

/**
 * Check whether a tool is registered (by name, no prefix).
 */
export function hasClientTool(toolName: string): boolean {
  return registry.has(toolName);
}

/**
 * Define a client tool: register it with name, description, zod parameters,
 * and handler. The handler's param type is inferred from the zod schema.
 * Returns the definition for chaining or export.
 */
export function defineClientTool<T extends z.ZodTypeAny>(def: {
  name: string;
  description: string;
  parameters: T;
  handler: (params: z.infer<T>) => Promise<unknown> | unknown;
}): typeof def {
  registry.set(def.name, def as ClientToolEntry);
  return def;
}

/**
 * Get all registered tools as { name, description, parametersSchema }[]
 * for syncing to the backend. Uses zod 4's native z.toJSONSchema().
 */
export function getAllClientTools(): Array<{
  name: string;
  description: string;
  parametersSchema: unknown;
}> {
  return Array.from(registry.values()).map((entry) => ({
    name: entry.name,
    description: entry.description,
    parametersSchema: z.toJSONSchema(entry.parameters),
  }));
}

/**
 * Execute a client tool by name, capturing success/failure into a uniform
 * outcome the caller posts back to the server. Never throws.
 */
export async function executeClientTool(
  toolName: string,
  params: unknown
): Promise<ClientToolOutcome> {
  const entry = registry.get(toolName);
  if (!entry) {
    return { error: `No client tool registered for "${toolName}"` };
  }
  try {
    const result = await entry.handler(params);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// NOTE: tool definitions live in ./tools/*.ts and are registered by importing
// ./tools (the bootstrap barrel). This module deliberately does NOT import them
// — doing so would create a circular import where a tool calls defineClientTool
// before `registry` is initialized (TDZ). Import './tools' from the app entry
// (and tests) instead, after this module is fully evaluated.

