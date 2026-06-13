// A single tool parsed from an MCP server's registration info.
export interface McpToolSchema {
  name: string;
  description?: string | null;
  parameters?: unknown | null;
}

// Tool execution location: 'mcp' (server-side) or 'client' (browser).
export type ToolKind = 'mcp' | 'client';

// A Tool is a top-level resource. kind distinguishes MCP (server-side) tools
// from Client (browser) tools.
export interface Tool {
  id: number;
  serverName: string;
  serverUrl: string;
  kind: ToolKind;
  mcpSchema: McpToolSchema[] | null;
  // Number of agents currently referencing this tool (for delete warnings).
  agentCount: number;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}
