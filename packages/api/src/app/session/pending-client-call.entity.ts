import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Status of a suspended Client Tool call.
export type PendingClientCallStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'timeout';

// One LLM message captured in the suspended context (system / user / assistant).
export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// A suspended Client Tool call awaiting browser execution. Created when the LLM
// loop emits an action whose tool name starts with `client__`; the server
// persists the suspended LLM context here, pushes a `client_call` SSE event,
// and ends the request. On result POST the row is loaded and the loop resumes.
//
// call_id (UUID) is the idempotency key; message_context holds the LLM messages
// array captured at suspend time. No DB foreign keys — referential integrity is
// enforced in the application layer (consistent with the other tables).
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

  @Column({ name: 'params', type: 'json', nullable: true })
  params!: unknown | null;

  @Column({ name: 'message_context', type: 'json' })
  messageContext!: LlmMessage[];

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
