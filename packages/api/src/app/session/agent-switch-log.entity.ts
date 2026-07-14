import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_agent_switch_log' })
export class AgentSwitchLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'session_id', type: 'int' })
  sessionId!: number;

  @Column({ name: 'from_agent_id', type: 'int' })
  fromAgentId!: number;

  @Column({ name: 'to_agent_id', type: 'int' })
  toAgentId!: number;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 3, scale: 2 })
  confidenceScore!: number;

  @Column({ name: 'prompt_forward', type: 'text' })
  promptForward!: string;

  @Column({ name: 'switched_at', type: 'timestamp' })
  switchedAt!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;
}
