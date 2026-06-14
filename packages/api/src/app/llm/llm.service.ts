import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlockParam,
  MessageParam,
  ToolUnion,
} from '@anthropic-ai/sdk/resources/messages';
import type { AgentEntity } from '../agent/agent.entity';

/**
 * Default per-call max_tokens for Anthropic Messages API requests. Per design
 * D7 / 1.3, this is a global constant for v1 — promote to per-agent config
 * later if needed. 4096 is a comfortable default for chat-shaped turns; the
 * caller surfaces `stop_reason: "max_tokens"` as an error rather than treating
 * a truncated response as a final answer (design risk note).
 */
export const DEFAULT_MAX_TOKENS = 4096;

/**
 * Minimal spec of an Anthropic tool declaration that the agent loop
 * constructs from each agent's available tools (mcp__/client__ prefixed
 * names + their input JSON Schema). Compatible with the SDK's `ToolUnion`.
 */
export interface AnthropicToolSpec {
  name: string;
  description?: string;
  input_schema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

/**
 * The conversation context as native Anthropic message blocks. The system
 * string is passed alongside via the `system` request parameter, not as a
 * role inside this array — Anthropic's API does not have a `system` role on
 * messages. Per design D3, the loop carries this array directly through
 * suspend/resume; flat MessageEntity rows are reconstructed only at the
 * start of a fresh user turn (history collapse, design D4).
 */
export type AnthropicMessages = MessageParam[];

/**
 * Discriminated turn result returned by `LlmService.callLlm`. Replaces the
 * old `string` return type so the caller stops re-parsing structure that the
 * API already validated.
 *
 * - `final`     — `stop_reason: "end_turn"`; `text` is the assistant's reply
 * - `tool_use`  — `stop_reason: "tool_use"`; loop must execute the tool and
 *                 send back a `tool_result` keyed by `toolUseId`. `text` is
 *                 any thought text the model emitted alongside (may be empty).
 *                 `assistantContent` is the full assistant content array as
 *                 returned, ready to be appended to the live message context.
 * - `error`     — transport, SDK, or unexpected stop_reason failure (e.g.
 *                 `max_tokens` truncation, `refusal`).
 */
export type LlmTurn =
  | { kind: 'final'; text: string }
  | {
      kind: 'tool_use';
      text: string;
      toolUseId: string;
      toolName: string;
      input: unknown;
      assistantContent: ContentBlockParam[];
    }
  | { kind: 'error'; message: string };

/**
 * Build a native Anthropic tool declaration from a registered tool entry.
 * `parameters` is the tool's JSON Schema object; we default to an empty
 * object schema when none is provided so every entry is a valid declaration.
 */
export function buildAnthropicTool(
  name: string,
  description: string | null,
  parameters: unknown
): AnthropicToolSpec {
  const input_schema = isObjectSchema(parameters)
    ? (parameters as AnthropicToolSpec['input_schema'])
    : { type: 'object' as const, properties: {} };
  return {
    name,
    ...(description ? { description } : {}),
    input_schema,
  };
}

function isObjectSchema(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'object'
  );
}

interface ModelConfig {
  baseUrl?: string | null;
  authToken: string;
  modelName: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  /**
   * Call the Anthropic Messages API with the agent's model config and the
   * native message context. Returns a structured `LlmTurn` mapping the
   * response's content blocks + `stop_reason`. Non-streaming.
   *
   * Design refs: D2 (structured turn result), D3 (native message context),
   * D5 (tools array shape), D7 (config mapping), 2.4 (max_tokens handling),
   * 2.5 (config validation).
   */
  async callLlm(
    agent: AgentEntity,
    system: string,
    messages: AnthropicMessages,
    tools: AnthropicToolSpec[]
  ): Promise<LlmTurn> {
    const cfg = this.readModelConfig(agent);

    const client = new Anthropic({
      apiKey: cfg.authToken,
      ...(cfg.baseUrl ? { baseURL: cfg.baseUrl } : {}),
    });

    try {
      const response = await client.messages.create({
        model: cfg.modelName,
        max_tokens: DEFAULT_MAX_TOKENS,
        system,
        messages,
        ...(tools.length > 0 ? { tools: tools as ToolUnion[] } : {}),
      });

      // The API hard-fails on a truncated reply: never present partial text
      // as a final answer, since the model may have been mid-tool-call.
      if (response.stop_reason === 'max_tokens') {
        return {
          kind: 'error',
          message: `LLM response truncated (max_tokens=${DEFAULT_MAX_TOKENS}). Increase max_tokens or shorten the conversation.`,
        };
      }

      // Collect text and find the last tool_use block (Claude emits at most
      // one when stop_reason is "tool_use").
      let text = '';
      let toolUse: { id: string; name: string; input: unknown } | null = null;
      const assistantContent: ContentBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text;
          assistantContent.push({ type: 'text', text: block.text });
        } else if (block.type === 'tool_use') {
          toolUse = { id: block.id, name: block.name, input: block.input };
          assistantContent.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as ToolUseBlockInput,
          });
        }
        // Other block types (thinking, server-tool results, etc.) are not
        // expected in this loop's request shape; ignored if they appear.
      }

      if (response.stop_reason === 'tool_use') {
        if (!toolUse) {
          return {
            kind: 'error',
            message:
              'LLM stop_reason was tool_use but no tool_use block was returned',
          };
        }
        return {
          kind: 'tool_use',
          text,
          toolUseId: toolUse.id,
          toolName: toolUse.name,
          input: toolUse.input,
          assistantContent,
        };
      }

      if (response.stop_reason === 'end_turn' || response.stop_reason === 'stop_sequence') {
        return { kind: 'final', text };
      }

      return {
        kind: 'error',
        message: `Unexpected stop_reason: ${response.stop_reason ?? 'null'}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`LLM call failed for agent ${agent.id}: ${message}`);
      return { kind: 'error', message };
    }
  }

  /**
   * Validate the agent's model_config and return it as a typed shape.
   * Throws a clear configuration error on missing required fields (2.5).
   */
  private readModelConfig(agent: AgentEntity): ModelConfig {
    const raw = agent.modelConfig;
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Agent ${agent.id} has no model_config`);
    }
    const cfg = raw as {
      baseUrl?: string | null;
      authToken?: string | null;
      modelName?: string | null;
    };
    if (!cfg.authToken) {
      throw new Error(
        `Agent ${agent.id} model_config is missing required field "authToken" (Anthropic API key)`
      );
    }
    if (!cfg.modelName) {
      throw new Error(
        `Agent ${agent.id} model_config is missing required field "modelName" (Claude model id)`
      );
    }
    return {
      baseUrl: cfg.baseUrl ?? null,
      authToken: cfg.authToken,
      modelName: cfg.modelName,
    };
  }
}

// Anthropic's tool_use block input is typed as a JSON-shaped object on the
// param side; alias it locally to avoid a circular type import.
type ToolUseBlockInput = Record<string, unknown> | unknown;
