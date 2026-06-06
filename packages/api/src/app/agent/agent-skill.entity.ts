import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_agent_skill' })
export class AgentSkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // Plain column linking to t_agent.id. No DB foreign key — referential
  // integrity is enforced in the application layer (see AgentService).
  @Column({ name: 'agent_id', type: 'int' })
  agentId!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'longtext', nullable: true })
  content!: string | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
