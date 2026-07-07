// A single tool parsed from an MCP server's registration info.
export interface McpToolSchema {
  name: string;
  description?: string | null;
  parameters?: unknown | null;
}

// Tool execution location:
//   'mcp'    — executed server-side via MCP server
//   'client' — executed in the browser
//   'server' — executed server-side via backend tool registry
export type ToolKind = 'mcp' | 'client' | 'server';

// How a tool row is managed:
//   'database' — created/edited by an admin in the Tools UI (persisted truth)
//   'registry' — auto-synced from a frontend defineClientTool declaration;
//                truth lives in browser code, reconciled on /client-tools/sync
export type ToolSource = 'database' | 'registry';

// A Tool is a top-level resource. kind distinguishes MCP (server-side) tools
// from Client (browser) tools. source distinguishes admin-managed tools from
// code-declared registry tools.
export interface Tool {
  id: number;
  serverName: string;
  serverUrl: string;
  kind: ToolKind;
  source: ToolSource;
  mcpSchema: McpToolSchema[] | null;
  // Number of agents currently referencing this tool (for delete warnings).
  agentCount: number;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}
