import type { McpToolSchema, ToolKind } from './tool.entity';

// Create a Tool. serverName must be kebab-case and globally unique.
// - kind='mcp' (default): the backend fetches the MCP server's tool listing
//   from serverUrl and stores it as mcpSchema.
// - kind='client': serverUrl may be empty; mcpSchema is provided manually
//   (Phase 1, no auto-registration).
export interface CreateToolDto {
  serverName: string;
  serverUrl?: string;
  kind?: ToolKind;
  mcpSchema?: McpToolSchema[];
}

// Update a Tool. All fields optional; serverName (if provided) must remain
// kebab-case and unique. For kind='mcp', changing serverUrl re-fetches the
// mcpSchema. For kind='client', mcpSchema is updated directly.
export interface UpdateToolDto {
  serverName?: string;
  serverUrl?: string;
  kind?: ToolKind;
  mcpSchema?: McpToolSchema[];
}

// Test an MCP server URL without persisting. Returns the parsed tool list.
export interface TestToolDto {
  serverUrl: string;
}

export interface DeleteToolsDto {
  ids: number[];
}

export type { McpToolSchema };
