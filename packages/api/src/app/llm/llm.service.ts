import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import type {
  ContentBlockParam,
  MessageParam,
  TextBlockParam,
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
 * Number of recent messages to leave uncached for prompt caching optimization.
 * The last 2 turns (4 messages: user → assistant → user → assistant) are most
 * likely to be edited or retried, so we don't cache them. Messages before this
 * threshold are considered stable and marked as cacheable. This balances cache
 * hit rates with flexibility for recent message edits.
 */
export const STABLE_HISTORY_THRESHOLD = 4;

/**
 * Cache control metadata for Anthropic prompt caching. Marks content blocks
 * as cacheable with a 5-minute TTL (ephemeral cache).
 */
export interface CacheControl {
  type: 'ephemeral';
}

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
 * - `tool_use`  — `stop_reason: "tool_use"`; loop must execute ALL tools and
 *                 send back a merged `tool_result` user turn. `text` is any
 *                 thought text the model emitted alongside (may be empty).
 *                 `toolUses` is an array of all tool_use blocks in this turn.
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
      toolUses: { id: string; name: string; input: unknown }[];
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

/**
 * Build a cacheable system prompt with 3-tier cache boundaries for Anthropic
 * prompt caching. This implements the cache boundary strategy from design D1:
 *
 * Tier 1: System prompt + tools (cached) - these change infrequently (only
 * when agent config updates), so we mark the last block with cache_control
 * to maximize cache hits across turns.
 *
 * @param systemText - The base system prompt text
 * @param toolsText - Optional tool context (e.g., JSON of available tools)
 * @returns Array of text blocks with cache_control on the last block
 */
export function buildCacheableSystem(
  systemText: string,
  toolsText?: string
): TextBlockParam[] {
  const blocks: TextBlockParam[] = [{ type: 'text', text: systemText }];

  if (toolsText && toolsText.trim().length > 0) {
    // Add tools as separate block with cache breakpoint
    blocks.push({
      type: 'text',
      text: toolsText,
      cache_control: { type: 'ephemeral' },
    });
  } else {
    // No tools - mark system prompt itself as cacheable
    blocks[0] = {
      ...blocks[0],
      cache_control: { type: 'ephemeral' },
    };
  }

  return blocks;
}

/**
 * Mark the stable history boundary for prompt caching (Tier 2 of the 3-tier
 * cache strategy). Adds cache_control to the last content block of the message
 * at stableCount-1, making all messages before that boundary cacheable.
 *
 * The last STABLE_HISTORY_THRESHOLD messages remain uncached because they're
 * most likely to be edited/retried. Messages before this threshold are stable
 * and benefit from caching.
 *
 * @param messages - The message history array
 * @param stableCount - Number of stable messages (all but last N)
 * @returns Modified messages array with cache_control on stable boundary
 */
export function markStableHistoryBoundary(
  messages: MessageParam[],
  stableCount: number
): MessageParam[] {
  // Edge cases: no messages, or stableCount out of bounds
  if (messages.length === 0 || stableCount <= 0 || stableCount > messages.length) {
    return messages;
  }

  const boundaryIndex = stableCount - 1;
  const boundaryMessage = messages[boundaryIndex];

  // Messages must have content as an array to add cache_control
  if (!boundaryMessage.content || !Array.isArray(boundaryMessage.content)) {
    return messages;
  }

  const content = boundaryMessage.content;
  if (content.length === 0) {
    return messages;
  }

  // Clone the messages array and the boundary message to avoid mutation
  const updatedMessages = [...messages];
  const lastBlockIndex = content.length - 1;
  const lastBlock = content[lastBlockIndex];

  // Only text blocks support cache_control
  if (lastBlock.type !== 'text') {
    return messages;
  }

  updatedMessages[boundaryIndex] = {
    ...boundaryMessage,
    content: [
      ...content.slice(0, lastBlockIndex),
      {
        ...lastBlock,
        cache_control: { type: 'ephemeral' },
      },
    ],
  };

  return updatedMessages;
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
   * Supports prompt caching via cache_control headers on system and message
   * content blocks. System parameter accepts either a string (legacy) or an
   * array of TextBlockParam (for cache control).
   *
   * Design refs: D2 (structured turn result), D3 (native message context),
   * D5 (tools array shape), D7 (config mapping), 2.4 (max_tokens handling),
   * 2.5 (config validation).
   */
  async callLlm(
    agent: AgentEntity,
    system: string | TextBlockParam[],
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

      // Log cache usage metrics for prompt caching monitoring (design D4)
      // Format: "LLM call agent=<id>: cached=<N> created=<N> uncached=<N> output=<N>"
      // - cached: tokens read from cache (cache hit)
      // - created: tokens written to cache (cache miss, first occurrence)
      // - uncached: tokens not eligible for caching
      // - output: response tokens generated
      // Use these metrics to calculate cache hit rate: cached / (cached + created + uncached)
      const usage = response.usage;
      this.logger.log(
        `LLM call agent=${agent.id}: ` +
        `cached=${usage.cache_read_input_tokens ?? 0} ` +
        `created=${usage.cache_creation_input_tokens ?? 0} ` +
        `uncached=${usage.input_tokens ?? 0} ` +
        `output=${usage.output_tokens ?? 0}`
      );

      // The API hard-fails on a truncated reply: never present partial text
      // as a final answer, since the model may have been mid-tool-call.
      if (response.stop_reason === 'max_tokens') {
        return {
          kind: 'error',
          message: `LLM response truncated (max_tokens=${DEFAULT_MAX_TOKENS}). Increase max_tokens or shorten the conversation.`,
        };
      }

      // Collect text and all tool_use blocks (Anthropic supports multiple
      // tool calls per turn for parallel tool use).
      let text = '';
      const toolUses: { id: string; name: string; input: unknown }[] = [];
      const assistantContent: ContentBlockParam[] = [];
      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text;
          assistantContent.push({ type: 'text', text: block.text });
        } else if (block.type === 'tool_use') {
          toolUses.push({ id: block.id, name: block.name, input: block.input });
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
        if (toolUses.length === 0) {
          return {
            kind: 'error',
            message:
              'LLM stop_reason was tool_use but no tool_use block was returned',
          };
        }
        return {
          kind: 'tool_use',
          text,
          toolUses,
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
