/**
 * Helper functions for working with MessageEntity's native content fields.
 * These functions bridge between Anthropic's native MessageParam format
 * and the database MessageEntity rows.
 */

import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';
import type { MessageEntity } from './message.entity';

const ASSISTANT_USER = 'ASSISTANT';

/**
 * Reconstruct the Anthropic messages array from MessageEntity rows.
 *
 * Strategy (D1 - context reconstruction):
 * 1. If a row has `nativeContent`, use it directly (preserves tool blocks)
 * 2. If `nativeContent` is NULL (legacy row), fallback to text-only content
 * 3. DO NOT filter by `isThought` - that flag is UI-only (fold/expand control)
 *
 * This ensures every tool_use and tool_result block re-enters the context,
 * fixing the "gateway.upstream_unavailable" bug caused by unbalanced pairing.
 */
export function reconstructNativeMessages(rows: MessageEntity[]): MessageParam[] {
  const messages: MessageParam[] = [];

  for (const row of rows) {
    // Determine role (prefer messageRole, fallback to userName)
    const role: 'user' | 'assistant' =
      row.messageRole ?? (row.userName === ASSISTANT_USER ? 'assistant' : 'user');

    if (row.nativeContent && Array.isArray(row.nativeContent)) {
      // Native content available - use it directly (preserves tool blocks)
      messages.push({
        role,
        content: row.nativeContent as ContentBlockParam[],
      });
    } else if (row.content) {
      // Legacy row - fallback to text-only
      messages.push({
        role,
        content: row.content,
      });
    }
    // Skip rows with neither nativeContent nor content (shouldn't exist)
  }

  return messages;
}

/**
 * Render native content blocks to display text for the UI.
 * This generates the `content` field value for MessageEntity.
 *
 * Examples:
 * - [text] → the text
 * - [text, tool_use] → the text (tool_use rendered separately as thought)
 * - [tool_result] → "{observation: ...}" (for UI compatibility)
 */
export function renderContentForDisplay(
  content: ContentBlockParam[],
  isToolResultOnly: boolean = false
): string {
  if (isToolResultOnly) {
    // Tool result messages use the observation envelope for UI compatibility
    const toolResult = content.find((b) => b.type === 'tool_result');
    if (toolResult && 'content' in toolResult) {
      return JSON.stringify({ observation: toolResult.content });
    }
    return '';
  }

  // Extract all text blocks
  const textParts: string[] = [];
  for (const block of content) {
    if (block.type === 'text' && 'text' in block) {
      textParts.push(block.text);
    }
  }

  return textParts.join('');
}

/**
 * Create a MessageEntity for a native user message.
 */
export function createUserMessage(
  sessionId: number,
  userName: string,
  textContent: string,
  createdBy: string
): Partial<MessageEntity> {
  return {
    sessionId,
    userName,
    messageType: 1,
    isThought: 0,
    content: textContent,
    nativeContent: [{ type: 'text', text: textContent }],
    messageRole: 'user',
    createdBy,
  };
}

/**
 * Create a MessageEntity for a native assistant message (final answer).
 */
export function createAssistantMessage(
  sessionId: number,
  textContent: string,
  createdBy: string
): Partial<MessageEntity> {
  return {
    sessionId,
    userName: ASSISTANT_USER,
    messageType: 1,
    isThought: 0,
    content: textContent,
    nativeContent: [{ type: 'text', text: textContent }],
    messageRole: 'assistant',
    createdBy,
  };
}

/**
 * Create a MessageEntity for an assistant turn with tool_use blocks.
 * This stores the complete assistant response including text + all tool_use blocks.
 *
 * Per D2: one assistant tool_use turn = one row (isThought=1 for UI fold,
 * nativeContent contains the full content array for LLM context).
 */
export function createAssistantToolUseMessage(
  sessionId: number,
  assistantContent: ContentBlockParam[],
  createdBy: string
): Partial<MessageEntity> {
  const displayText = renderContentForDisplay(assistantContent, false);

  return {
    sessionId,
    userName: ASSISTANT_USER,
    messageType: 1,
    isThought: 1, // Fold in UI (not a regular message bubble)
    content: displayText || 'Calling tools…',
    nativeContent: assistantContent,
    messageRole: 'assistant',
    createdBy,
  };
}

/**
 * Create a MessageEntity for merged tool results (user role in API, but internal).
 * This merges ALL tool_result blocks of one assistant turn into one user message.
 *
 * Per D2: one merged tool_result per turn = one row (isThought=1 for UI fold,
 * nativeContent contains all tool_result blocks for LLM context).
 */
export function createToolResultsMessage(
  sessionId: number,
  toolResults: ContentBlockParam[],
  createdBy: string
): Partial<MessageEntity> {
  // For UI, render a summary of all results
  const displayContent = renderContentForDisplay(toolResults, true);

  return {
    sessionId,
    userName: ASSISTANT_USER, // Internal message, not user-authored
    messageType: 1,
    isThought: 1, // Fold in UI (not a regular message bubble)
    content: displayContent,
    nativeContent: toolResults,
    messageRole: 'user', // API role is 'user' for tool_result
    createdBy,
  };
}
