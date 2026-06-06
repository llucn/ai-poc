import type { AgentModelConfig } from './agent.entity';
import type { McpToolSchema } from './agent-tool.entity';

export interface AgentSkillDto {
  id?: number;
  name: string;
  description?: string | null;
  content?: string | null;
}

// Create only sets basic info. System prompt, tools and skills are
// managed separately from the Agent Detail page after creation.
// The model auth token (API key) is carried inside modelConfig.authToken.
export interface CreateAgentDto {
  name: string;
  description?: string | null;
  modelConfig?: AgentModelConfig | null;
  isDefault?: number;
}

// Update only touches basic info. modelConfig.authToken is optional: when
// blank/omitted the existing token is preserved; when provided it replaces.
export interface UpdateAgentDto {
  name?: string;
  description?: string | null;
  modelConfig?: AgentModelConfig | null;
  isDefault?: number;
}

export interface UpdateSystemPromptDto {
  systemPrompt: string | null;
}

export interface DeleteAgentsDto {
  ids: number[];
}

// Register / update an MCP server by URL. The backend fetches the MCP
// server's tool listing and stores it as mcpSchema.
export interface RegisterMcpServerDto {
  serverName: string;
  serverUrl: string;
}

// Test an MCP server URL without persisting. Returns the parsed tool list.
export interface TestMcpServerDto {
  serverUrl: string;
}

export interface CreateSkillDto {
  name: string;
  description?: string | null;
  content?: string | null;
}

export interface UpdateSkillDto {
  name?: string;
  description?: string | null;
  content?: string | null;
}

export type { McpToolSchema };
