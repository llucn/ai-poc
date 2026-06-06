export interface AgentModelConfig {
  baseUrl: string | null;
  authToken: string | null;
  modelName: string | null;
}

// A single tool parsed from an MCP server's registration info.
export interface McpToolSchema {
  name: string;
  description?: string | null;
  parameters?: unknown | null;
}

// One row per registered MCP server.
export interface McpServer {
  id: number;
  agentId: number;
  serverName: string;
  serverUrl: string;
  mcpSchema: McpToolSchema[] | null;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}

export interface AgentSkill {
  id: number;
  agentId: number;
  name: string;
  description: string | null;
  content: string | null;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}

export interface Agent {
  id: number;
  name: string;
  description: string | null;
  modelConfig: AgentModelConfig | null;
  // The model authToken (API key) is never sent to the client; hasApiKey
  // signals whether one is stored. modelConfig.authToken is always null here.
  hasApiKey: boolean;
  isDefault: number;
  systemPrompt: string | null;
  tools?: McpServer[];
  skills?: AgentSkill[];
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}

export interface CreateAgentDto {
  name: string;
  description?: string | null;
  modelConfig?: AgentModelConfig | null;
  isDefault?: number;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string | null;
  modelConfig?: AgentModelConfig | null;
  isDefault?: number;
}
