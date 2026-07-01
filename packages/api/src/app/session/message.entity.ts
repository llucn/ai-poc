import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages';

/**
 * Represents a message in a chat session, supporting both legacy text-only
 * display and native Anthropic conversation reconstruction.
 *
 * Fields:
 * - `content`: display text for the UI (always present, backward compatible)
 * - `native_content`: Anthropic ContentBlockParam[] for API requests (new)
 * - `message_role`: 'user' | 'assistant' (for native messages)
 * - `isThought`: 1 = collapsible thought in UI, 0 = regular message
 *
 * Migration path:
 * - Old rows: native_content = NULL → fallback to content as text
 * - New rows: store both content (display) + native_content (API)
 */
@Entity({ name: 't_message' })
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId!: number;

  @Column({ name: 'user_name', type: 'varchar', length: 255 })
  userName!: string;

  @Column({ name: 'message_type', type: 'int', default: 1 })
  messageType!: number;

  // 1 marks this message as an assistant "thought" rendered as a
  // collapsible note. 0 is a regular message.
  @Column({ name: 'is_thought', type: 'boolean', default: false })
  isThought!: boolean;

  // Display text for the UI. Always present for backward compatibility.
  // For native messages, this is a rendered summary of native_content.
  @Column({ type: 'text', nullable: true })
  content!: string | null;

  // Native Anthropic content blocks (text, tool_use, tool_result).
  // Stored as JSON array of ContentBlockParam. NULL for legacy messages.
  @Column({ name: 'native_content', type: 'jsonb', nullable: true })
  nativeContent!: ContentBlockParam[] | null;

  // Message role for native conversation reconstruction.
  // 'user' | 'assistant'. NULL for legacy messages (inferred from userName).
  @Column({ name: 'message_role', type: 'varchar', length: 16, nullable: true })
  messageRole!: 'user' | 'assistant' | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
