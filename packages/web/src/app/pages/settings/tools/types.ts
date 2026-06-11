// A single tool parsed from an MCP server's registration info.
export interface McpToolSchema {
  name: string;
  description?: string | null;
  parameters?: unknown | null;
}

// A Tool is a top-level resource representing one MCP server.
export interface Tool {
  id: number;
  serverName: string;
  serverUrl: string;
  mcpSchema: McpToolSchema[] | null;
  // Number of agents currently referencing this tool (for delete warnings).
  agentCount: number;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}
