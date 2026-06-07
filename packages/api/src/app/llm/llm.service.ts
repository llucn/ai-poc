import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { AgentEntity } from '../agent/agent.entity';

interface ModelConfig {
  baseUrl: string;
  authToken: string;
  modelName: string;
}

interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  /**
   * Call LLM (Qwen via OpenAI-compatible endpoint) with the given agent config and message history.
   * @param agent The agent whose model_config contains {baseUrl, authToken, modelName}
   * @param messages Conversation history (system prompt + user/assistant messages)
   * @returns LLM's text output
   */
  async callLlm(agent: AgentEntity, messages: LlmMessage[]): Promise<string> {
    let modelConfig: ModelConfig;
    try {
      modelConfig = agent.modelConfig as ModelConfig;
    } catch (err) {
      this.logger.error(
        `Failed to parse model_config for agent ${agent.id}: ${err instanceof Error ? err.message : String(err)}`
      );
      throw new Error('Invalid agent model_config: not valid JSON');
    }

    if (!modelConfig.baseUrl || !modelConfig.authToken || !modelConfig.modelName) {
      throw new Error(
        'Agent model_config missing required fields: baseUrl, authToken, modelName'
      );
    }

    const client = new OpenAI({
      apiKey: modelConfig.authToken,
      baseURL: modelConfig.baseUrl,
    });

    try {
      const completion = await client.chat.completions.create({
        model: modelConfig.modelName,
        messages,
      });

      const output = completion.choices[0]?.message?.content;
      if (!output) {
        throw new Error('LLM returned empty response');
      }

      return output;
    } catch (err) {
      this.logger.error(
        `LLM call failed for agent ${agent.id}: ${err instanceof Error ? err.message : String(err)}`
      );
      throw err;
    }
  }
}
