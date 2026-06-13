// Client Tool execution registry.
//
// Client Tools run in the browser. When the agent loop suspends on a
// `client__<toolId>__<toolName>` action, the server pushes a `client_call`
// SSE event; the chat page dispatches it here. Each tool is registered by its
// actual tool name (the `<toolName>` part, without the `client__<id>__` prefix
// — the server strips that before sending the event).
//
// Phase 1: tools are registered statically below. Phase 2 will introduce
// `defineClientTool` + a sync mechanism; this module is the seam for that.

export type ClientToolHandler = (params: any) => Promise<unknown> | unknown;

// Result of executing a client tool: exactly one of result / error is set.
export type ClientToolOutcome =
  | { result: unknown }
  | { error: string };

const registry = new Map<string, ClientToolHandler>();

/** Register a client tool handler by its tool name (no prefix). */
export function registerClientTool(
  toolName: string,
  handler: ClientToolHandler
): void {
  registry.set(toolName, handler);
}

/** Whether a handler is registered for the given tool name. */
export function hasClientTool(toolName: string): boolean {
  return registry.has(toolName);
}

/**
 * Execute a client tool by name, capturing success/failure into a uniform
 * outcome the caller posts back to the server. Never throws.
 */
export async function executeClientTool(
  toolName: string,
  params: unknown
): Promise<ClientToolOutcome> {
  const handler = registry.get(toolName);
  if (!handler) {
    return { error: `No client tool registered for "${toolName}"` };
  }
  try {
    const result = await handler(params);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

// ===== Built-in tools (Phase 1) =====

// Demo tool: log a message to the browser console and return an echo object.
// Used to verify the end-to-end suspend/resume flow.
registerClientTool('console-log-echo', (params: { message?: string }) => {
  const message = params?.message ?? '';
  // eslint-disable-next-line no-console
  console.log(message);
  return { echo: message, timestamp: Date.now() };
});
