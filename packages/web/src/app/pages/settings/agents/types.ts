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

// Tool execution location: 'mcp' (remote MCP server), 'client' (browser), or
// 'server' (built-in server-side registry tool).
export type ToolKind = 'mcp' | 'client' | 'server';

// A Tool is a top-level resource (t_tool) associated with the agent through
// t_agent_tool. The agent detail endpoint returns the resolved Tool rows.
export interface AgentTool {
  id: number;
  serverName: string;
  serverUrl: string;
  kind: ToolKind;
  mcpSchema: McpToolSchema[] | null;
  createdOn: string;
  createdBy: string;
  updatedOn?: string | null;
  updatedBy?: string | null;
}

// A Skill is a top-level resource (t_skill) associated with the agent through
// t_agent_skill.
export interface AgentSkill {
  id: number;
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
  tools?: AgentTool[];
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
