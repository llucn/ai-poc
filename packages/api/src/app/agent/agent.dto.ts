import type { AgentModelConfig } from './agent.entity';
import type { McpToolSchema } from './agent-tool.entity';

// Create only sets basic info. System prompt, tools and skills are
// managed separately from the Agent Detail page after creation.
// The model auth token (API key) is carried inside modelConfig.authToken.
export interface CreateAgentDto {
  name: string;
  description?: string | null;
  modelConfig?: AgentModelConfig | null;
  isDefault?: boolean;
}

// Update only touches basic info. modelConfig.authToken is optional: when
// blank/omitted the existing token is preserved; when provided it replaces.
export interface UpdateAgentDto {
  name?: string;
  description?: string | null;
  modelConfig?: AgentModelConfig | null;
  isDefault?: boolean;
}

export interface UpdateSystemPromptDto {
  systemPrompt: string | null;
}

export interface DeleteAgentsDto {
  ids: number[];
}

// Associate an existing top-level Tool with this agent.
export interface LinkToolDto {
  toolId: number;
}

// Associate an existing top-level Skill with this agent.
export interface LinkSkillDto {
  skillId: number;
}

export type { McpToolSchema };
