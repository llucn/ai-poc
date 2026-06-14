import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

// Status of a suspended Client Tool call.
export type PendingClientCallStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'timeout';

/**
 * The native Anthropic message context captured at suspend time.
 *
 * Each entry is an Anthropic `MessageParam` (`{ role: 'user'|'assistant',
 * content: ContentBlockParam[] | string }`) — `tool_use` blocks live inside
 * the assistant turn that triggered the suspension and `tool_result` blocks
 * live inside the user turn that resumes it. Per design D3 / D4 the live
 * loop carries this array directly; the resume path appends a `tool_result`
 * keyed by the originating `tool_use_id` (also persisted on this row in the
 * `tool_use_id` column) and re-enters the loop without any reconstruction
 * step.
 */
export type PendingMessageContext = MessageParam[];

// A suspended Client Tool call awaiting browser execution. Created when the
// Anthropic response carries a `tool_use` block whose name starts with
// `client__`; the server persists the suspended message context here, pushes
// a `client_call` SSE event, and ends the request. On result POST the row is
// loaded and the loop resumes by appending a `tool_result` block keyed by the
// saved `tool_use_id`.
//
// call_id (UUID) is the idempotency key; message_context holds the Anthropic
// MessageParam array captured at suspend time. tool_use_id is the originating
// `tool_use` block's id, used to correlate the `tool_result` on resume. No DB
// foreign keys — referential integrity is enforced in the application layer
// (consistent with the other tables).
@Entity({ name: 't_pending_client_call' })
export class PendingClientCallEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'call_id', type: 'varchar', length: 255, unique: true })
  callId!: string;

  @Column({ name: 'session_id', type: 'int' })
  sessionId!: number;

  @Column({ name: 'agent_id', type: 'int' })
  agentId!: number;

  @Column({ name: 'tool_id', type: 'int' })
  toolId!: number;

  @Column({ name: 'tool_name', type: 'varchar', length: 255 })
  toolName!: string;

  @Column({ name: 'tool_use_id', type: 'varchar', length: 255 })
  toolUseId!: string;

  @Column({ name: 'params', type: 'json', nullable: true })
  params!: unknown | null;

  @Column({ name: 'message_context', type: 'json' })
  messageContext!: PendingMessageContext;

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'pending' })
  status!: PendingClientCallStatus;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
