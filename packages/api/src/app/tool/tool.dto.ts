import type { McpToolSchema } from './tool.entity';

// Create a Tool by registering an MCP server. serverName must be kebab-case
// and globally unique. The backend fetches the MCP server's tool listing and
// stores it as mcpSchema.
export interface CreateToolDto {
  serverName: string;
  serverUrl: string;
}

// Update a Tool. Both fields optional; serverName (if provided) must remain
// kebab-case and unique. Changing serverUrl re-fetches the mcpSchema.
export interface UpdateToolDto {
  serverName?: string;
  serverUrl?: string;
}

// Test an MCP server URL without persisting. Returns the parsed tool list.
export interface TestToolDto {
  serverUrl: string;
}

export interface DeleteToolsDto {
  ids: number[];
}

export type { McpToolSchema };
