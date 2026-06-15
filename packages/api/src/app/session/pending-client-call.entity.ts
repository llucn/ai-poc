import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

// Status of a suspended Client Tool call.
export type PendingClientCallStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'timeout';

/**
 * Single tool result object stored in message_context.
 * Success: {type:'tool_result', tool_use_id, content}
 * Failure: {error: string}
 */
export type PendingToolResult =
  | { type: 'tool_result'; tool_use_id: string; content: string }
  | { error: string };

// A suspended Client Tool call awaiting browser execution. Created when the
// Anthropic response carries a `tool_use` block whose name starts with
// `client__`; the server persists the suspended message context here, pushes
// a `client_call` SSE event, and ends the request. On result POST the row is
// loaded and the loop resumes by appending a `tool_result` block keyed by the
// saved `tool_use_id`.
/**
 * Records a Client Tool call suspended mid-loop, waiting for browser execution.
 * One assistant turn with multiple tool_use blocks creates multiple rows sharing
 * the same call_id, each with its own tool_use_id. Uniqueness is enforced on
 * the composite (call_id, tool_use_id).
 */
@Entity({ name: 't_pending_client_call' })
@Index(['callId', 'toolUseId'], { unique: true })
export class PendingClientCallEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // Grouping key: multiple tool_use blocks in one assistant turn share this call_id.
  // Composite unique with tool_use_id.
  @Column({ name: 'call_id', type: 'varchar', length: 255 })
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

  // Single tool result object: {type:'tool_result', tool_use_id, content} or {error}.
  // NULL while pending; written when the tool completes (MCP immediate, Client on resume).
  @Column({ name: 'message_context', type: 'json', nullable: true })
  messageContext!: PendingToolResult | null;

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
